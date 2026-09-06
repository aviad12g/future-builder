import { env } from 'cloudflare:workers';
import { ApiError, fail, user } from '@/lib/server';

function b64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function ownerPrefix(uid: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(uid),
  );
  return b64url(new Uint8Array(digest).slice(0, 18));
}

export async function GET(request: Request) {
  try {
    const uid = await user();
    const key = new URL(request.url).searchParams.get('key') || '';
    if (
      !key.startsWith((await ownerPrefix(uid)) + '/') ||
      !/^[A-Za-z0-9_-]{20,100}\/[a-f0-9-]{36}$/.test(key)
    )
      throw new ApiError('Question image not found.', 404);
    const bucket = (env as unknown as { SAT_IMAGES?: R2Bucket }).SAT_IMAGES;
    if (!bucket)
      throw new ApiError('Question image storage is unavailable.', 503);
    const object = await bucket.get(key);
    if (!object) throw new ApiError('Question image not found.', 404);
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'private, max-age=3600');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Content-Security-Policy', "default-src 'none'; sandbox");
    return new Response(object.body, { headers });
  } catch (error) {
    return fail(error);
  }
}
