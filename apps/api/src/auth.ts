import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Repository } from './repository.ts';

export const passwordHash = (
  password: string,
  salt = randomBytes(16).toString('hex'),
): { salt: string; hash: string } => ({
  salt,
  hash: scryptSync(password, salt, 64).toString('hex'),
});
export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const computed = Buffer.from(passwordHash(password, salt).hash, 'hex');
  const stored = Buffer.from(hash, 'hex');
  return stored.length === computed.length && timingSafeEqual(stored, computed);
}
const encode = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
export function issueToken(repo: Repository, userId: string, now: number): string {
  const expires = now + 7 * 24 * 3600 * 1000;
  const jti = repo.createSession(userId, expires);
  const data = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: userId, jti, iat: Math.floor(now / 1000), exp: Math.floor(expires / 1000), iss: 'lingoquest-local', aud: 'lingoquest' })}`;
  return `${data}.${createHmac('sha256', repo.secret).update(data).digest('base64url')}`;
}
export function verifyToken(
  repo: Repository,
  token: string,
  now: number,
): { userId: string; sessionId: string } | null {
  try {
    const [header, payload, signature, ...extra] = token.split('.');
    if (!header || !payload || !signature || extra.length) return null;
    const expected = createHmac('sha256', repo.secret).update(`${header}.${payload}`).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const h = JSON.parse(Buffer.from(header, 'base64url').toString()) as { alg: string };
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      sub: string;
      jti: string;
      exp: number;
      iss: string;
      aud: string;
    };
    if (
      h.alg !== 'HS256' ||
      typeof p.sub !== 'string' ||
      typeof p.jti !== 'string' ||
      typeof p.exp !== 'number' ||
      p.exp * 1000 <= now ||
      p.iss !== 'lingoquest-local' ||
      p.aud !== 'lingoquest' ||
      !repo.hasSession(p.jti, p.sub, now)
    )
      return null;
    return { userId: p.sub, sessionId: p.jti };
  } catch {
    return null;
  }
}
