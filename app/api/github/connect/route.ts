import {
  user,
  db,
  runtime,
  safeOrigin,
  randomToken,
  challenge,
  fail,
  githubConfigured,
  ApiError,
} from '@/lib/server';
export async function GET(request: Request) {
  try {
    const uid = await user();
    if (!githubConfigured(request))
      throw new ApiError(
        'GitHub OAuth needs valid APP_ORIGIN, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and a token encryption key of at least 32 characters.',
        503,
      );
    const origin = safeOrigin(request),
      state = randomToken(),
      verifier = randomToken(),
      expires = Date.now() + 600000;
    try {
      await db().batch([
        db()
          .prepare('DELETE FROM oauth_states WHERE expires < ?')
          .bind(Date.now()),
        db().prepare('DELETE FROM oauth_states WHERE user_id = ?').bind(uid),
        db()
          .prepare(
            'INSERT INTO oauth_states (state,user_id,verifier,expires) VALUES (?,?,?,?)',
          )
          .bind(state, uid, verifier, expires),
      ]);
    } catch {
      throw new ApiError(
        'The GitHub security state could not be saved. Please try again.',
        503,
      );
    }
    const url = new URL('https://github.com/login/oauth/authorize');
    url.search = new URLSearchParams({
      client_id: runtime('GITHUB_CLIENT_ID'),
      redirect_uri: origin + '/api/github/callback',
      scope: 'read:user',
      state,
      code_challenge: await challenge(verifier),
      code_challenge_method: 'S256',
    }).toString();
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.toString(),
        'Set-Cookie': `fb_oauth_state=${encodeURIComponent(state)}; Path=/api/github; Max-Age=600; HttpOnly; Secure; SameSite=Lax; Priority=High`,
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (e) {
    return fail(e);
  }
}
