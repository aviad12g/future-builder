import { applyAction, type Action } from '@/lib/model';
import {
  user,
  readState,
  saveState,
  json,
  fail,
  body,
  sameOrigin,
  githubConfigured,
  ApiError,
} from '@/lib/server';
export async function GET(request: Request) {
  try {
    const uid = await user();
    return json({
      ...(await readState(uid)),
      githubConfigured: githubConfigured(request),
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const uid = await user(),
      p = await body(request);
    if (!Number.isInteger(p.revision) || typeof p.type !== 'string')
      throw new ApiError('Invalid request.');
    const previous = await readState(uid);
    if (previous.revision !== p.revision)
      throw new ApiError(
        'Another tab saved newer progress. Reload before continuing.',
        409,
      );
    if (!previous.state.profile.onboarded && p.type !== 'journey.start')
      throw new ApiError('Start your personal journey to save progress.');
    const state = applyAction(previous.state, {
      type: p.type,
      payload: p.payload,
    } as Action);
    const revision = await saveState(uid, state, previous.revision);
    return json({ state, revision });
  } catch (e) {
    return fail(e);
  }
}
