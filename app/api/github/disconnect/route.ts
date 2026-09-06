import {
  user,
  db,
  readState,
  json,
  fail,
  sameOrigin,
  body,
  ApiError,
} from '@/lib/server';

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
      throw new ApiError(
        'Reload your journey before disconnecting GitHub.',
        409,
      );
    current.state.github = null;
    const updated = new Date().toISOString();
    const results = await db().batch([
      db()
        .prepare(
          'UPDATE journeys SET state = ?, revision = revision + 1, updated = ? WHERE user_id = ? AND revision = ?',
        )
        .bind(JSON.stringify(current.state), updated, uid, current.revision),
      db().prepare('DELETE FROM github_tokens WHERE user_id = ?').bind(uid),
    ]);
    if (!results[0]?.meta.changes)
      throw new ApiError(
        'Your journey changed in another tab. Reload it before disconnecting.',
        409,
      );
    return json({ state: current.state, revision: current.revision + 1 });
  } catch (error) {
    return fail(error);
  }
}
