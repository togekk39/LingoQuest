import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import type {
  AttemptResult,
  ChallengeProgress,
  Mastery,
  User,
  RunView,
} from '@lingoquest/contracts';
import type { PrivateExercise } from './content.ts';

export interface StoredRun {
  id: string;
  trackId: string;
  type: string;
  level: number;
  mode: 'practice' | 'ranked';
  relaxed: boolean;
  contentVersion: number;
  items: PrivateExercise[];
  startedAt: number;
  deadline: number | null;
  heartsInitial: number;
  hearts: number;
  position: number;
  correctCount: number;
  status: RunView['status'];
  score: number;
  reason?: string;
  answers: { questionId: string; correct: boolean; feedbackEs: string; acceptedAnswer: string }[];
  submissions: Record<string, { fingerprint: string; result: RunView }>;
}
export interface StoredState {
  user: User;
  completedLessons: string[];
  xp: number;
  learningDays: string[];
  mastery: Mastery[];
  attempts: Record<string, { fingerprint: string; result: AttemptResult }>;
  visitedExercises: Record<string, string[]>;
  runs: Record<string, StoredRun>;
  runRequests: Record<string, { fingerprint: string; runId: string }>;
  challengeProgress: ChallengeProgress[];
  reviewRewards: string[];
  skillDayBaseline?: Record<string, { day: string; lastPracticedAt: string | null }>;
}
export interface Account {
  id: string;
  email: string | null;
  salt: string | null;
  hash: string | null;
}
export interface Repository {
  secret: string;
  getAccountByEmail(email: string): Account | undefined;
  getAccount(id: string): Account | undefined;
  createUser(name: string, email?: string, salt?: string, hash?: string): StoredState;
  upgradeUser(id: string, email: string, salt: string, hash: string): void;
  get(id: string): StoredState | undefined;
  mutate<T>(id: string, fn: (state: StoredState) => T): T;
  createSession(userId: string, expires: number): string;
  hasSession(id: string, userId: string, now: number): boolean;
  deleteSession(id: string): void;
  deleteUser(id: string): void;
  close(): void;
}

export class SQLiteRepository implements Repository {
  private db: DatabaseSync;
  readonly secret: string;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    this.db
      .exec(`CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,email TEXT UNIQUE,salt TEXT,password_hash TEXT);
      CREATE TABLE IF NOT EXISTS user_state(user_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
    const row = this.db.prepare('SELECT value FROM meta WHERE key=?').get('session_secret') as
      { value: string } | undefined;
    this.secret = process.env.SESSION_SECRET ?? row?.value ?? randomBytes(48).toString('base64url');
    if (!row)
      this.db.prepare('INSERT INTO meta(key,value) VALUES(?,?)').run('session_secret', this.secret);
  }
  getAccountByEmail(email: string): Account | undefined {
    return this.db
      .prepare('SELECT id,email,salt,password_hash AS hash FROM accounts WHERE email=?')
      .get(email) as unknown as Account | undefined;
  }
  getAccount(id: string): Account | undefined {
    return this.db
      .prepare('SELECT id,email,salt,password_hash AS hash FROM accounts WHERE id=?')
      .get(id) as unknown as Account | undefined;
  }
  createUser(name: string, email?: string, salt?: string, hash?: string): StoredState {
    const id = randomUUID();
    const state: StoredState = {
      user: {
        id,
        name,
        email,
        isGuest: !email,
        goalMinutes: 10,
        motivation: 'life',
        reducedMotion: false,
      },
      completedLessons: [],
      xp: 0,
      learningDays: [],
      mastery: [],
      attempts: {},
      visitedExercises: {},
      runs: {},
      runRequests: {},
      challengeProgress: [],
      reviewRewards: [],
    };
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db
        .prepare('INSERT INTO accounts(id,email,salt,password_hash) VALUES(?,?,?,?)')
        .run(id, email ?? null, salt ?? null, hash ?? null);
      this.db
        .prepare('INSERT INTO user_state(user_id,payload) VALUES(?,?)')
        .run(id, JSON.stringify(state));
      this.db.exec('COMMIT');
      return state;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
  upgradeUser(id: string, email: string, salt: string, hash: string): void {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db
        .prepare('UPDATE accounts SET email=?,salt=?,password_hash=? WHERE id=?')
        .run(email, salt, hash, id);
      const state = this.get(id)!;
      state.user.email = email;
      state.user.isGuest = false;
      this.db
        .prepare('UPDATE user_state SET payload=? WHERE user_id=?')
        .run(JSON.stringify(state), id);
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
  get(id: string): StoredState | undefined {
    const row = this.db.prepare('SELECT payload FROM user_state WHERE user_id=?').get(id) as
      { payload: string } | undefined;
    return row ? (JSON.parse(row.payload) as StoredState) : undefined;
  }
  mutate<T>(id: string, fn: (state: StoredState) => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const state = this.get(id);
      if (!state) throw new Error('Unknown user');
      const result = fn(state);
      this.db
        .prepare('UPDATE user_state SET payload=? WHERE user_id=?')
        .run(JSON.stringify(state), id);
      this.db.exec('COMMIT');
      return result;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
  createSession(userId: string, expires: number): string {
    const id = randomUUID();
    this.db
      .prepare('INSERT INTO sessions(id,user_id,expires) VALUES(?,?,?)')
      .run(id, userId, expires);
    return id;
  }
  hasSession(id: string, userId: string, now: number): boolean {
    return !!this.db
      .prepare('SELECT id FROM sessions WHERE id=? AND user_id=? AND expires>?')
      .get(id, userId, now);
  }
  deleteSession(id: string): void {
    this.db.prepare('DELETE FROM sessions WHERE id=?').run(id);
  }
  deleteUser(id: string): void {
    this.db.prepare('DELETE FROM accounts WHERE id=?').run(id);
  }
  close(): void {
    this.db.close();
  }
}
