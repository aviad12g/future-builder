import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { blankState, hydrateState, type AppState } from './model';
import {
  decryptToken,
  encryptToken,
  normalizeAppOrigin,
  pkceChallenge,
  randomToken as createRandomToken,
} from './oauth';
export function db() {
  if (!env.DB) throw new Error('Storage is unavailable. Please try again.');
  return env.DB;
}
export function runtime(name: string): string {
  return String((env as unknown as Record<string, unknown>)[name] || '');
}
export async function user() {
  const u = await getChatGPTUser();
  if (!u) throw new ApiError('Sign in to save your personal journey.', 401);
  return u.userId;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
export function fail(error: unknown) {
  return json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : error instanceof Error && error.message.length < 250
            ? error.message
            : 'Something could not be saved. Please try again.',
    },
    error instanceof ApiError ? error.status : 400,
  );
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    throw new ApiError('Please make this request from Future Builder.', 403);
  if (request.headers.get('sec-fetch-site') === 'cross-site')
    throw new ApiError('Cross-site request rejected.', 403);
}
export async function body(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new ApiError('Expected JSON data.');
  if (Number(request.headers.get('content-length')) > 200000)
    throw new ApiError('This request is too large.', 413);
  const text = await request.text();
  if (text.length > 200000)
    throw new ApiError('This request is too large.', 413);
  const p = JSON.parse(text);
  if (!p || typeof p !== 'object' || Array.isArray(p))
    throw new ApiError('Invalid request.');
  return p as Record<string, unknown>;
}
export async function readState(uid: string) {
  const row = await db()
    .prepare('SELECT state, revision FROM journeys WHERE user_id = ?')
    .bind(uid)
    .first<{ state: string; revision: number }>();
  return row
    ? { state: hydrateState(JSON.parse(row.state)), revision: row.revision }
    : { state: blankState(), revision: 0 };
}
export async function saveState(
  uid: string,
  state: AppState,
  revision: number,
) {
  const now = new Date().toISOString();
  if (revision === 0) {
    const result = await db()
      .prepare(
        'INSERT OR IGNORE INTO journeys (user_id,state,revision,updated) VALUES (?,?,1,?)',
      )
      .bind(uid, JSON.stringify(state), now)
      .run();
    if (result.meta.changes) return 1;
  }
  const result = await db()
    .prepare(
      'UPDATE journeys SET state = ?, revision = revision + 1, updated = ? WHERE user_id = ? AND revision = ?',
    )
    .bind(JSON.stringify(state), now, uid, revision)
    .run();
  if (!result.meta.changes)
    throw new ApiError(
      'Your journey changed in another tab. Reload it before saving again.',
      409,
    );
  return revision + 1;
}
export function safeOrigin(request: Request) {
  try {
    return normalizeAppOrigin(runtime('APP_ORIGIN'), request.url);
  } catch (e) {
    throw new ApiError(
      e instanceof Error
        ? e.message
        : 'The application origin is not configured.',
      503,
    );
  }
}
export function githubConfigured(request?: Request) {
  try {
    if (
      !runtime('GITHUB_CLIENT_ID') ||
      !runtime('GITHUB_CLIENT_SECRET') ||
      runtime('TOKEN_ENCRYPTION_KEY').length < 32
    )
      return false;
    if (request) normalizeAppOrigin(runtime('APP_ORIGIN'), request.url);
    else normalizeAppOrigin(runtime('APP_ORIGIN'));
    return true;
  } catch {
    return false;
  }
}
export async function gh(path: string, token: string) {
  let r: Response;
  try {
    r = await fetch('https://api.github.com' + path, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'FutureBuilder',
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(
      'GitHub could not be reached. Check the connection and try again.',
      502,
    );
  }
  if (!r.ok) {
    if (r.status === 401)
      throw new ApiError(
        'GitHub access was revoked or expired. Disconnect and reconnect the account.',
        401,
      );
    if (r.status === 403 || r.status === 429) {
      const reset = Number(r.headers.get('x-ratelimit-reset'));
      const when =
        Number.isFinite(reset) && reset > 0
          ? ` after ${new Date(reset * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
          : ' later';
      throw new ApiError(
        `GitHub’s request limit was reached. Try again${when}.`,
        429,
      );
    }
    throw new ApiError(
      r.status === 404
        ? 'GitHub could not find this repository data.'
        : 'GitHub could not return repository data. Try again.',
      502,
    );
  }
  return r.json() as Promise<any>;
}
export const randomToken = createRandomToken;
export const challenge = pkceChallenge;
export async function encrypt(value: string) {
  try {
    return await encryptToken(value, runtime('TOKEN_ENCRYPTION_KEY'));
  } catch (e) {
    throw new ApiError(
      e instanceof Error
        ? e.message
        : 'The GitHub token could not be encrypted.',
      503,
    );
  }
}
export async function decrypt(value: string) {
  try {
    return await decryptToken(value, runtime('TOKEN_ENCRYPTION_KEY'));
  } catch (e) {
    throw new ApiError(
      e instanceof Error
        ? e.message
        : 'The GitHub token could not be decrypted.',
      503,
    );
  }
}
