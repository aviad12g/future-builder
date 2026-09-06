const encoder = new TextEncoder();
const decoder = new TextDecoder();

const b64url = (value: Uint8Array) =>
  btoa(String.fromCharCode(...value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

const decode64url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

export function normalizeAppOrigin(configured: string, requestUrl?: string) {
  if (!configured) throw new Error('APP_ORIGIN is missing.');
  let origin: URL;
  try {
    origin = new URL(configured);
  } catch {
    throw new Error('APP_ORIGIN must be a complete URL.');
  }
  const local =
    origin.hostname === 'localhost' || origin.hostname === '127.0.0.1';
  if (origin.protocol !== 'https:' && !(local && origin.protocol === 'http:'))
    throw new Error('APP_ORIGIN must use HTTPS.');
  if (
    origin.username ||
    origin.password ||
    (origin.pathname !== '/' && origin.pathname !== '') ||
    origin.search ||
    origin.hash
  )
    throw new Error(
      'APP_ORIGIN must contain only the site origin, with no path or query.',
    );
  if (requestUrl) {
    const requestOrigin = new URL(requestUrl).origin;
    const requestIsLocal = ['localhost', '127.0.0.1'].includes(
      new URL(requestUrl).hostname,
    );
    if (!requestIsLocal && requestOrigin !== origin.origin)
      throw new Error('APP_ORIGIN does not match the deployed site.');
  }
  return origin.origin;
}

export function readCookie(header: string | null, name: string) {
  if (!header) return '';
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return '';
}

export function sameToken(left: string, right: string) {
  if (!left || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++)
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export const randomToken = () =>
  b64url(crypto.getRandomValues(new Uint8Array(32)));

export async function pkceChallenge(verifier: string) {
  return b64url(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', encoder.encode(verifier)),
    ),
  );
}

async function encryptionKey(secret: string) {
  if (secret.length < 32)
    throw new Error('TOKEN_ENCRYPTION_KEY must be at least 32 characters.');
  return crypto.subtle.importKey(
    'raw',
    await crypto.subtle.digest('SHA-256', encoder.encode(secret)),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptToken(value: string, secret: string) {
  if (!value) throw new Error('GitHub returned an empty access token.');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await encryptionKey(secret),
    encoder.encode(value),
  );
  return `v1.${b64url(iv)}.${b64url(new Uint8Array(encrypted))}`;
}

export async function decryptToken(value: string, secret: string) {
  const [version, encodedIv, encodedData] = value.split('.');
  if (version !== 'v1' || !encodedIv || !encodedData)
    throw new Error('Stored GitHub token has an invalid format.');
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decode64url(encodedIv) },
      await encryptionKey(secret),
      decode64url(encodedData),
    );
    return decoder.decode(decrypted);
  } catch {
    throw new Error('Stored GitHub token could not be decrypted.');
  }
}

export type GithubOAuthFailure =
  | 'credentials'
  | 'origin'
  | 'denied'
  | 'missing_state'
  | 'state_mismatch'
  | 'expired_state'
  | 'token_exchange'
  | 'profile'
  | 'revoked'
  | 'rate_limited'
  | 'encryption'
  | 'persistence'
  | 'sync';

export const githubFailureMessage: Record<GithubOAuthFailure, string> = {
  credentials: 'GitHub connection is not configured by the site owner yet.',
  origin: 'The GitHub callback address does not match this deployment.',
  denied: 'GitHub authorization was cancelled. Nothing was connected.',
  missing_state:
    'The GitHub callback was incomplete. Start the connection again.',
  state_mismatch:
    'The GitHub security check failed. Start the connection again in this browser.',
  expired_state:
    'The GitHub connection expired. Start it again; the link is valid for ten minutes.',
  token_exchange:
    'GitHub could not finish authorization. Try connecting again.',
  profile:
    'GitHub authorized the app but did not return your account identity.',
  revoked:
    'GitHub access was revoked or expired. Disconnect the account, then connect it again.',
  rate_limited:
    'GitHub’s request limit was reached. Wait a little, then synchronize again.',
  encryption:
    'The server could not protect the GitHub token. Ask the site owner to check the encryption key.',
  persistence: 'The GitHub connection could not be saved. Try again.',
  sync: 'GitHub connected, but repositories could not be synchronized yet. Use Synchronize GitHub to retry.',
};
