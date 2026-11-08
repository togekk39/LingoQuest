import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildServer, timeBudget } from '../src/server.ts';
import { SQLiteRepository } from '../src/repository.ts';
import { lessons, challengePools, units, type PrivateExercise } from '../src/content.ts';
import type { Answer, Progress, RunView } from '@lingoquest/contracts';

const id = () => randomUUID();
class FakeClock {
  value = Date.parse('2026-11-08T12:00:00Z');
  now() {
    return this.value;
  }
}
async function fixture(t: TestContext) {
  const clock = new FakeClock();
  const repo = new SQLiteRepository(':memory:');
  const app = await buildServer({ clock, repository: repo, rateLimitMax: 10000 });
  t.after(() => app.close());
  const response = await app.inject({
    method: 'POST',
    url: '/v1/auth/guest',
    payload: { name: 'Ana' },
  });
  const token = response.json().token as string;
  const headers = { authorization: `Bearer ${token}` };
  return { app, clock, repo, token, headers };
}
const answer = (exercise: PrivateExercise): Answer =>
  exercise.correctOptionId
    ? { optionId: exercise.correctOptionId }
    : { text: exercise.acceptedAnswers[0]! };
const wrong: Answer = { text: 'respuesta incorrecta' };
const lesson = lessons['u01_l01']!;

test('catalog and public exercises never serialize private answer rules', async (t) => {
  const { app } = await fixture(t);
  const catalog = await app.inject('/v1/catalog');
  assert.equal(catalog.statusCode, 200);
  assert.equal(catalog.json().units.length, 8);
  assert.equal(units.flatMap((u) => u.lessons).length, 32);
  const response = await app.inject(`/v1/lessons/${lesson.id}`);
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().exercises.length, 10);
  assert.doesNotMatch(response.body, /acceptedAnswers|correctOptionId|feedbackEs/);
  const placement = await app.inject('/v1/placement');
  assert.equal(placement.json().questions.length, 12);
  assert.doesNotMatch(placement.body, /acceptedAnswers|correctOptionId|feedbackEs/);
});
test('all wrong learning attempts allow completion without hearts, countdown, or penalties; completion is idempotent', async (t) => {
  const { app, headers } = await fixture(t);
  assert.equal(
    (
      await app.inject({
        method: 'POST',
        url: `/v1/lessons/${lesson.id}/complete`,
        headers,
        payload: {},
      })
    ).statusCode,
    409,
  );
  for (const exercise of lesson.exercises) {
    const r = await app.inject({
      method: 'POST',
      url: '/v1/attempts',
      headers,
      payload: {
        clientAttemptId: id(),
        lessonId: lesson.id,
        exerciseId: exercise.id,
        answer: wrong,
      },
    });
    assert.equal(r.statusCode, 200);
    assert.equal(r.json().correct, false);
    assert.match(r.json().feedbackEs, /intento/);
    assert.doesNotMatch(r.body, /hearts|deadline/);
  }
  const complete = () =>
    app.inject({ method: 'POST', url: `/v1/lessons/${lesson.id}/complete`, headers, payload: {} });
  const first = await complete();
  assert.equal(first.statusCode, 200);
  assert.equal(first.json().xpAwarded, 25);
  assert.equal(first.json().progress.xp, 25);
  const again = await complete();
  assert.equal(again.json().xpAwarded, 0);
  assert.equal(again.json().progress.xp, 25);
  assert.equal(again.json().progress.completedLessons.length, 1);
});
test('attempt and offline event IDs are idempotent and cannot be reused with another payload', async (t) => {
  const { app, headers } = await fixture(t);
  const e = lesson.exercises[0]!;
  const payload = {
    clientAttemptId: id(),
    lessonId: lesson.id,
    exerciseId: e.id,
    answer: answer(e),
  };
  const a = await app.inject({ method: 'POST', url: '/v1/attempts', headers, payload });
  const b = await app.inject({ method: 'POST', url: '/v1/attempts', headers, payload });
  assert.deepEqual(a.json(), b.json());
  const conflict = await app.inject({
    method: 'POST',
    url: '/v1/attempts',
    headers,
    payload: { ...payload, answer: wrong },
  });
  assert.equal(conflict.statusCode, 409);
  const synced = await app.inject({
    method: 'POST',
    url: '/v1/sync/attempts',
    headers,
    payload: { attempts: [payload, payload] },
  });
  assert.equal(synced.statusCode, 200);
  assert.equal(synced.json().progress.mastery[0].evidenceCount, 1);
  for (let i = 0; i < 5; i++)
    await app.inject({
      method: 'POST',
      url: '/v1/attempts',
      headers,
      payload: { ...payload, clientAttemptId: id() },
    });
  const progress = (await app.inject({ url: '/v1/me/progress', headers })).json() as Progress;
  assert.equal(progress.mastery[0]!.evidenceCount, 1);
  assert.ok(progress.mastery[0]!.value < 1);
  assert.equal(progress.xp, 0);
});
test('unauthenticated, forged JWT, unknown account data, and tampered reward fields are rejected', async (t) => {
  const { app, headers, token } = await fixture(t);
  assert.equal((await app.inject('/v1/me/progress')).statusCode, 401);
  assert.equal(
    (
      await app.inject({
        url: '/v1/me/progress',
        headers: { authorization: `Bearer ${token.slice(0, -5)}abcde` },
      })
    ).statusCode,
    401,
  );
  const tamper = await app.inject({
    method: 'POST',
    url: '/v1/attempts',
    headers,
    payload: {
      clientAttemptId: id(),
      lessonId: lesson.id,
      exerciseId: lesson.exercises[0]!.id,
      answer: wrong,
      xp: 9999,
      userId: 'victim',
    },
  });
  assert.equal(tamper.statusCode, 400);
});
test('challenge practice is optional, drafts cannot create ranked runs, later topics stay unpublished', async (t) => {
  const { app, headers } = await fixture(t);
  const tracks = (await app.inject({ url: '/v1/challenges/tracks', headers })).json();
  assert.equal(tracks.tracks[0].unlocked, false);
  assert.equal(tracks.tracks[0].requiredLessons, 4);
  const payload = { clientRequestId: id(), trackId: 'present_simple', level: 1, mode: 'ranked' };
  const ranked = await app.inject({ method: 'POST', url: '/v1/challenges/runs', headers, payload });
  assert.equal(ranked.statusCode, 403);
  assert.equal(ranked.json().code, 'CONTENT_NOT_REVIEWED');
  assert.equal(
    (
      await app.inject({
        method: 'POST',
        url: '/v1/challenges/runs',
        headers,
        payload: { ...payload, clientRequestId: id(), mode: 'practice', trackId: 'past_simple' },
      })
    ).statusCode,
    503,
  );
  assert.equal((await app.inject({ url: '/v1/lessons/u03_l01', headers })).statusCode, 200);
});
test('three required lessons keep track locked; the fourth unlocks its introduction without a challenge', async (t) => {
  const { app, headers } = await fixture(t);
  const required = units.find((u) => u.id === 'u02')!.lessons;
  for (let i = 0; i < required.length; i++) {
    const l = lessons[required[i]!.id]!;
    for (const e of l.exercises)
      await app.inject({
        method: 'POST',
        url: '/v1/attempts',
        headers,
        payload: { clientAttemptId: id(), lessonId: l.id, exerciseId: e.id, answer: wrong },
      });
    await app.inject({ method: 'POST', url: `/v1/lessons/${l.id}/complete`, headers, payload: {} });
    const tracks = (await app.inject({ url: '/v1/challenges/tracks', headers })).json();
    assert.equal(tracks.tracks[0].unlocked, i === 3);
  }
});
test('server clock and hearts terminate challenges while learning state remains unchanged', async (t) => {
  const { app, headers, clock } = await fixture(t);
  const before = (await app.inject({ url: '/v1/me/progress', headers })).json();
  const create = () =>
    app.inject({
      method: 'POST',
      url: '/v1/challenges/runs',
      headers,
      payload: { clientRequestId: id(), trackId: 'present_simple', level: 13, mode: 'practice' },
    });
  let run = (await create()).json() as RunView;
  assert.equal(run.heartsInitial, 1);
  assert.doesNotMatch(JSON.stringify(run), /acceptedAnswers|correctOptionId|feedbackEs/);
  const wrongResponse = await app.inject({
    method: 'POST',
    url: `/v1/challenges/runs/${run.runId}/answers`,
    headers,
    payload: { clientSubmissionId: id(), questionPosition: 1, answer: wrong },
  });
  assert.equal(wrongResponse.json().status, 'failed');
  assert.equal(wrongResponse.json().heartsRemaining, 0);
  run = (await create()).json();
  clock.value += 56_000;
  const expired = await app.inject({
    method: 'POST',
    url: `/v1/challenges/runs/${run.runId}/answers`,
    headers,
    payload: { clientSubmissionId: id(), questionPosition: 1, answer: wrong },
  });
  assert.equal(expired.json().reason, 'timeout');
  assert.equal(expired.json().completedQuestions, 0);
  const after = (await app.inject({ url: '/v1/me/progress', headers })).json();
  assert.deepEqual(after, before);
});
test('run requests and answer submissions are idempotent; answers cannot be sent out of order or across users', async (t) => {
  const { app, headers } = await fixture(t);
  const payload = { clientRequestId: id(), trackId: 'present_simple', level: 1, mode: 'practice' };
  const r1 = await app.inject({ method: 'POST', url: '/v1/challenges/runs', headers, payload });
  const r2 = await app.inject({ method: 'POST', url: '/v1/challenges/runs', headers, payload });
  assert.equal(r1.json().runId, r2.json().runId);
  const run = r1.json() as RunView;
  const submission = { clientSubmissionId: id(), questionPosition: 1, answer: wrong };
  const request = {
    method: 'POST' as const,
    url: `/v1/challenges/runs/${run.runId}/answers`,
    headers,
    payload: submission,
  };
  const a = await app.inject(request);
  const b = await app.inject(request);
  assert.deepEqual(a.json(), b.json());
  assert.equal(a.json().heartsRemaining, 4);
  assert.equal(
    (
      await app.inject({
        ...request,
        payload: { ...submission, answer: { text: 'otra respuesta' } },
      })
    ).statusCode,
    409,
  );
  assert.equal(
    (
      await app.inject({
        ...request,
        payload: { ...submission, clientSubmissionId: id(), questionPosition: 4 },
      })
    ).statusCode,
    409,
  );
  const other = (await app.inject({ method: 'POST', url: '/v1/auth/guest', payload: {} })).json();
  assert.equal(
    (
      await app.inject({
        url: `/v1/challenges/runs/${run.runId}/current`,
        headers: { authorization: `Bearer ${other.token}` },
      })
    ).statusCode,
    404,
  );
  assert.equal(
    (
      await app.inject({
        ...request,
        payload: {
          ...submission,
          clientSubmissionId: id(),
          questionPosition: 2,
          hearts: 500,
          score: 9999,
        },
      })
    ).statusCode,
    400,
  );
});
test('all thirteen practice levels can finish; practice never grants ranked badges, XP or mastery', async (t) => {
  const { app, headers } = await fixture(t);
  const before = (await app.inject({ url: '/v1/me/progress', headers })).json() as Progress;
  for (let level = 1; level <= 13; level++) {
    let run = (
      await app.inject({
        method: 'POST',
        url: '/v1/challenges/runs',
        headers,
        payload: {
          clientRequestId: id(),
          trackId: 'present_simple',
          level,
          mode: 'practice',
          relaxed: true,
        },
      })
    ).json() as RunView;
    while (run.status === 'active') {
      const item = challengePools.grammar_rush.find((e) => e.id === run.question!.id)!;
      assert.equal(item.difficulty, level);
      const r = await app.inject({
        method: 'POST',
        url: `/v1/challenges/runs/${run.runId}/answers`,
        headers,
        payload: {
          clientSubmissionId: id(),
          questionPosition: run.questionPosition,
          answer: answer(item),
        },
      });
      assert.equal(r.statusCode, 200);
      run = r.json() as RunView;
    }
    assert.equal(run.status, 'passed');
    const finish = await app.inject({
      method: 'POST',
      url: `/v1/challenges/runs/${run.runId}/finish`,
      headers,
      payload: {},
    });
    assert.equal(finish.json().status, 'passed');
  }
  const after = (await app.inject({ url: '/v1/me/progress', headers })).json() as Progress;
  assert.equal(after.challengeProgress[0]!.highestLevel, 13);
  assert.equal(after.challengeProgress[0]!.badge, false);
  assert.equal(after.challengeProgress[0]!.mode, 'practice');
  assert.equal(after.xp, before.xp);
  assert.deepEqual(after.mastery, before.mastery);
  assert.deepEqual(after.completedLessons, before.completedLessons);
});
test('reading and cloze have separate clocks; preflight budgets equal real run budgets', async (t) => {
  const { app, headers, clock } = await fixture(t);
  for (const type of ['cloze_battle', 'reading_quest'] as const) {
    const levels = (
      await app.inject({ url: `/v1/challenges/tracks/present_simple/levels?type=${type}`, headers })
    ).json();
    for (const level of [1, 8, 13]) {
      const run = (
        await app.inject({
          method: 'POST',
          url: '/v1/challenges/runs',
          headers,
          payload: {
            clientRequestId: id(),
            trackId: 'present_simple',
            level,
            mode: 'practice',
            type,
          },
        })
      ).json() as RunView;
      assert.equal(
        (Date.parse(run.deadlineAt!) - clock.now()) / 1000,
        levels.levels[level - 1].seconds,
      );
      assert.ok(levels.levels[level - 1].seconds >= (type === 'reading_quest' ? 180 : 150));
    }
  }
  const long = { ...challengePools.reading_quest[0]!, passage: Array(400).fill('word').join(' ') };
  assert.ok(timeBudget('reading_quest', 13, [long, long, long, long]) >= 285);
});
test('runs retain private immutable answer snapshots after content changes', async (t) => {
  const { app, headers } = await fixture(t);
  const run = (
    await app.inject({
      method: 'POST',
      url: '/v1/challenges/runs',
      headers,
      payload: { clientRequestId: id(), trackId: 'present_simple', level: 1, mode: 'practice' },
    })
  ).json() as RunView;
  const item = challengePools.grammar_rush.find((e) => e.id === run.question!.id)!;
  const original = item.correctOptionId;
  const originalAccepted = [...item.acceptedAnswers];
  const validAnswer = answer(item);
  item.correctOptionId = 'changed';
  item.acceptedAnswers = ['changed'];
  try {
    const next = (
      await app.inject({
        method: 'POST',
        url: `/v1/challenges/runs/${run.runId}/answers`,
        headers,
        payload: { clientSubmissionId: id(), questionPosition: 1, answer: validAnswer },
      })
    ).json() as RunView;
    assert.equal(next.heartsRemaining, run.heartsRemaining);
  } finally {
    item.correctOptionId = original;
    item.acceptedAnswers = originalAccepted;
  }
});
test('local registration upgrades guest progress; login persists and deleting the account revokes every session', async (t) => {
  const { app, headers } = await fixture(t);
  const settings = await app.inject({
    method: 'POST',
    url: '/v1/me/settings',
    headers,
    payload: { name: 'Lucía', goalMinutes: 15, reducedMotion: true },
  });
  assert.equal(settings.statusCode, 200);
  const payload = { name: 'Lucía', email: 'lucia@example.com', password: 'a-secure-passphrase' };
  const registered = (
    await app.inject({ method: 'POST', url: '/v1/auth/register', headers, payload })
  ).json();
  assert.equal(registered.user.isGuest, false);
  assert.equal(registered.user.goalMinutes, 15);
  const login = await app.inject({ method: 'POST', url: '/v1/auth/login', payload });
  assert.equal(login.statusCode, 200);
  const auth = { authorization: `Bearer ${login.json().token}` };
  assert.equal(
    (
      await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { ...payload, password: 'incorrect-password' },
      })
    ).statusCode,
    401,
  );
  assert.equal(
    (await app.inject({ method: 'DELETE', url: '/v1/me', headers: auth })).json().deleted,
    true,
  );
  assert.equal((await app.inject({ url: '/v1/me/progress', headers })).statusCode, 401);
  assert.equal((await app.inject({ url: '/v1/me/progress', headers: auth })).statusCode, 401);
});
test('speech without an assessment provider gives neutral unscorable feedback and stores no recording', async (t) => {
  const { app, headers } = await fixture(t);
  const r = await app.inject({
    method: 'POST',
    url: '/v1/speech/assess',
    headers,
    payload: { referenceText: 'I am Ana.', consent: true },
  });
  assert.equal(r.statusCode, 200);
  assert.equal(r.json().status, 'unscorable');
  assert.equal(r.json().stored, false);
  assert.equal(r.json().score, undefined);
});
test('delayed unprompted evidence survives earlier recognition items on a full lesson revisit', async (t) => {
  const { app, headers, clock } = await fixture(t);
  const practice = async () => {
    for (const e of lesson.exercises)
      await app.inject({
        method: 'POST',
        url: '/v1/attempts',
        headers,
        payload: {
          clientAttemptId: id(),
          lessonId: lesson.id,
          exerciseId: e.id,
          answer: answer(e),
        },
      });
  };
  await practice();
  const before = (await app.inject({ url: '/v1/me/progress', headers })).json() as Progress;
  assert.ok(before.mastery.every((m) => m.lastDelayedSuccessAt === null));
  clock.value += 2 * 86_400_000;
  await practice();
  const after = (await app.inject({ url: '/v1/me/progress', headers })).json() as Progress;
  assert.ok(after.mastery.some((m) => m.lastDelayedSuccessAt !== null));
  assert.ok(after.xp > 0);
  await practice();
  const repeated = (await app.inject({ url: '/v1/me/progress', headers })).json() as Progress;
  assert.equal(repeated.xp, after.xp);
  assert.deepEqual(repeated.mastery, after.mastery);
});
test('data export excludes credentials and active run keys; logout revokes its bearer session', async (t) => {
  const { app, headers } = await fixture(t);
  await app.inject({
    method: 'POST',
    url: '/v1/challenges/runs',
    headers,
    payload: { clientRequestId: id(), trackId: 'present_simple', level: 1, mode: 'practice' },
  });
  const exported = await app.inject({ url: '/v1/me/export', headers });
  assert.equal(exported.statusCode, 200);
  assert.doesNotMatch(
    exported.body,
    /password_hash|session_secret|acceptedAnswers|correctOptionId|fingerprint|Bearer/,
  );
  assert.equal(exported.json().challenges.length, 1);
  assert.equal(
    (await app.inject({ method: 'POST', url: '/v1/auth/logout', headers, payload: {} })).statusCode,
    200,
  );
  assert.equal((await app.inject({ url: '/v1/me/progress', headers })).statusCode, 401);
});
test('the full 32-lesson curriculum completes independently of challenges and microphone permission', async (t) => {
  const { app, headers } = await fixture(t);
  for (const current of Object.values(lessons)) {
    for (const e of current.exercises) {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/attempts',
        headers,
        payload: {
          clientAttemptId: id(),
          lessonId: current.id,
          exerciseId: e.id,
          answer: e.type === 'reorder' ? { tokens: e.acceptedAnswers[0]!.split(' ') } : answer(e),
        },
      });
      assert.equal(response.statusCode, 200);
      assert.equal(response.json().correct, true, e.id);
    }
    const complete = await app.inject({
      method: 'POST',
      url: `/v1/lessons/${current.id}/complete`,
      headers,
      payload: {},
    });
    assert.equal(complete.statusCode, 200);
  }
  const progress = (await app.inject({ url: '/v1/me/progress', headers })).json() as Progress;
  assert.equal(progress.completedLessons.length, 32);
  assert.equal(progress.xp, 800);
  assert.equal(progress.challengeProgress.length, 0);
  assert.ok(progress.mastery.every((m) => m.value < 1 && m.lastDelayedSuccessAt === null));
});
test('SQLite progress and session verification survive reopening the database', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'lingoquest-api-'));
  let app: Awaited<ReturnType<typeof buildServer>> | undefined;
  try {
    const db = join(dir, 'state.sqlite');
    app = await buildServer({ repository: new SQLiteRepository(db) });
    const guest = (
      await app.inject({ method: 'POST', url: '/v1/auth/guest', payload: { name: 'Persistente' } })
    ).json();
    const headers = { authorization: `Bearer ${guest.token}` };
    await app.inject({
      method: 'POST',
      url: '/v1/me/settings',
      headers,
      payload: { goalMinutes: 5 },
    });
    await app.close();
    app = await buildServer({ repository: new SQLiteRepository(db) });
    const p = await app.inject({ url: '/v1/me/progress', headers });
    assert.equal(p.statusCode, 200);
    assert.equal(p.json().user.goalMinutes, 5);
  } finally {
    if (app) await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
