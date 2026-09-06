import {
  user,
  db,
  runtime,
  safeOrigin,
  encrypt,
  readState,
  saveState,
  ApiError,
} from '@/lib/server';
import { fetchGithubPortfolio } from '@/lib/github';
import { readCookie, sameToken, type GithubOAuthFailure } from '@/lib/oauth';

class OAuthIssue extends Error {
  constructor(public reason: GithubOAuthFailure) {
    super(reason);
  }
}

const clearCookie =
  'fb_oauth_state=; Path=/api/github; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Priority=High';

function redirect(
  origin: string,
  result: 'connected' | 'error',
  reason?: GithubOAuthFailure,
) {
  const url = new URL('/', origin);
  url.searchParams.set('github', result);
  if (reason) url.searchParams.set('reason', reason);
  url.hash = 'github';
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      'Set-Cookie': clearCookie,
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: Request) {
  let origin: string;
  try {
    origin = safeOrigin(request);
  } catch {
    return new Response(
      'APP_ORIGIN is invalid. Ask the site owner to correct the hosted environment value.',
      {
        status: 503,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      },
    );
  }
  let stage: GithubOAuthFailure = 'missing_state';
  try {
    const uid = await user();
    const params = new URL(request.url).searchParams;
    if (params.get('error')) throw new OAuthIssue('denied');
    const state = params.get('state') || '';
    const code = params.get('code') || '';
    if (!state || !code) throw new OAuthIssue('missing_state');
    const cookie = readCookie(request.headers.get('cookie'), 'fb_oauth_state');
    if (!sameToken(cookie, state)) {
      await db()
        .prepare('DELETE FROM oauth_states WHERE state = ? AND user_id = ?')
        .bind(state, uid)
        .run();
      throw new OAuthIssue('state_mismatch');
    }
    const saved = await db()
      .prepare(
        'SELECT verifier, expires FROM oauth_states WHERE state = ? AND user_id = ?',
      )
      .bind(state, uid)
      .first<{ verifier: string; expires: number }>();
    if (!saved || saved.expires <= Date.now()) {
      await db()
        .prepare('DELETE FROM oauth_states WHERE state = ? AND user_id = ?')
        .bind(state, uid)
        .run();
      throw new OAuthIssue('expired_state');
    }
    const consumed = await db()
      .prepare(
        'DELETE FROM oauth_states WHERE state = ? AND user_id = ? RETURNING verifier',
      )
      .bind(state, uid)
      .first<{ verifier: string }>();
    if (!consumed || consumed.verifier !== saved.verifier)
      throw new OAuthIssue('expired_state');

    stage = 'token_exchange';
    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: runtime('GITHUB_CLIENT_ID'),
          client_secret: runtime('GITHUB_CLIENT_SECRET'),
          code,
          redirect_uri: origin + '/api/github/callback',
          code_verifier: saved.verifier,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    const token = (await response.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!response.ok || !token.access_token)
      throw new OAuthIssue('token_exchange');

    stage = 'sync';
    const portfolio = await fetchGithubPortfolio(token.access_token);
    stage = 'encryption';
    const encrypted = await encrypt(token.access_token);
    stage = 'persistence';
    const current = await readState(uid);
    current.state.github = { ...portfolio, synced: new Date().toISOString() };
    await db()
      .prepare(
        'INSERT INTO github_tokens (user_id,encrypted,login,updated) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET encrypted=excluded.encrypted, login=excluded.login, updated=excluded.updated',
      )
      .bind(uid, encrypted, portfolio.login, new Date().toISOString())
      .run();
    try {
      await saveState(uid, current.state, current.revision);
    } catch (error) {
      await db()
        .prepare('DELETE FROM github_tokens WHERE user_id = ?')
        .bind(uid)
        .run();
      throw error;
    }
    return redirect(origin, 'connected');
  } catch (error) {
    let reason: GithubOAuthFailure = stage;
    if (error instanceof OAuthIssue) reason = error.reason;
    else if (error instanceof ApiError && stage === 'sync') {
      if (error.status === 401) reason = 'revoked';
      else if (error.status === 429) reason = 'rate_limited';
      else if (/identity/i.test(error.message)) reason = 'profile';
      else reason = 'sync';
    }
    return redirect(origin, 'error', reason);
  }
}
