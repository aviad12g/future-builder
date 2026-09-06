import {
  user,
  db,
  readState,
  saveState,
  decrypt,
  json,
  fail,
  sameOrigin,
  ApiError,
  body,
} from '@/lib/server';
import { fetchGithubPortfolio } from '@/lib/github';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const uid = await user();
    const input = await body(request);
    const current = await readState(uid);
    if (
      !Number.isInteger(input.revision) ||
      input.revision !== current.revision
    )
      throw new ApiError('Reload your journey before synchronizing.', 409);
    const row = await db()
      .prepare('SELECT encrypted FROM github_tokens WHERE user_id = ?')
      .bind(uid)
      .first<{ encrypted: string }>();
    if (!row) throw new ApiError('Connect your GitHub account first.');
    const token = await decrypt(row.encrypted);
    const portfolio = await fetchGithubPortfolio(token);
    current.state.github = { ...portfolio, synced: new Date().toISOString() };
    return json({
      state: current.state,
      revision: await saveState(uid, current.state, current.revision),
    });
  } catch (error) {
    return fail(error);
  }
}
