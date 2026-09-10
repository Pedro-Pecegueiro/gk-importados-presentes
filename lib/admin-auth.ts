import { env } from 'cloudflare:workers';

const sessionCookieName = 'gk_admin_session';
const sessionDurationSeconds = 8 * 60 * 60;
const loginWindowSeconds = 15 * 60;
const loginLockSeconds = 15 * 60;
const maxLoginAttempts = 5;
const encoder = new TextEncoder();

type LoginAttemptRow = {
  attempts: number;
  window_started_at: number;
  locked_until: number;
};

type LoginRateLimit = {
  allowed: boolean;
  retryAfter: number;
};

function encodeBase64Url(bytes: Uint8Array) {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);

  try {
    const binary = atob(normalized + padding);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function sha256(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest('SHA-256', encoder.encode(value)),
  );
}

async function constantTimeEqual(left: string, right: string) {
  const [leftDigest, rightDigest] = await Promise.all([
    sha256(left),
    sha256(right),
  ]);
  let difference = 0;

  for (let index = 0; index < leftDigest.length; index += 1) {
    difference |= leftDigest[index] ^ rightDigest[index];
  }

  return difference === 0;
}

function getAdminPassword() {
  return env.ADMIN_ACCESS_CODE || '';
}

function getSessionSecret() {
  return env.ADMIN_SESSION_SECRET || '';
}

async function getSigningKey() {
  const password = getAdminPassword();
  const sessionSecret = getSessionSecret();

  if (!password || !sessionSecret) {
    return null;
  }

  return crypto.subtle.importKey(
    'raw',
    encoder.encode(`${sessionSecret}\n${password}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie') || '';

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');

    if (separator === -1) {
      continue;
    }

    const cookieName = part.slice(0, separator).trim();

    if (cookieName === name) {
      return part.slice(separator + 1).trim();
    }
  }

  return '';
}

function cookieSecurityAttribute(request: Request) {
  return new URL(request.url).protocol === 'https:' ? '; Secure' : '';
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const requestOrigin = new URL(request.url).origin;

  if (!origin || origin !== requestOrigin) {
    return Response.json(
      { error: 'Origem da solicitação não autorizada.' },
      { status: 403, headers: { 'cache-control': 'no-store' } },
    );
  }

  return null;
}

export async function verifyAdminPassword(password: string) {
  const expected = getAdminPassword();

  if (!expected) {
    return false;
  }

  return constantTimeEqual(password, expected);
}

export async function createAdminSessionToken() {
  const key = await getSigningKey();

  if (!key) {
    return null;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + sessionDurationSeconds;
  const payload = `v1.${issuedAt}.${expiresAt}.${crypto.randomUUID()}`;
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, encoder.encode(payload)),
  );

  return `${payload}.${encodeBase64Url(signature)}`;
}

export async function isAdminAuthenticated(request: Request) {
  const token = readCookie(request, sessionCookieName);

  if (!token || token.length > 512) {
    return false;
  }

  const parts = token.split('.');

  if (parts.length !== 5 || parts[0] !== 'v1') {
    return false;
  }

  const issuedAt = Number.parseInt(parts[1], 10);
  const expiresAt = Number.parseInt(parts[2], 10);
  const now = Math.floor(Date.now() / 1000);

  if (
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt) ||
    issuedAt > now + 60 ||
    expiresAt <= now ||
    expiresAt - issuedAt !== sessionDurationSeconds
  ) {
    return false;
  }

  const signature = decodeBase64Url(parts[4]);
  const key = await getSigningKey();

  if (!signature || !key) {
    return false;
  }

  return crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    encoder.encode(parts.slice(0, 4).join('.')),
  );
}

export async function requireAdmin(request: Request) {
  const originError = requireSameOrigin(request);

  if (originError) {
    return originError;
  }

  if (!(await isAdminAuthenticated(request))) {
    return Response.json(
      { error: 'Sua sessão expirou. Entre novamente no painel.' },
      { status: 401, headers: { 'cache-control': 'no-store' } },
    );
  }

  return null;
}

export function createSessionCookie(token: string, request: Request) {
  return `${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionDurationSeconds}${cookieSecurityAttribute(request)}`;
}

export function clearSessionCookie(request: Request) {
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${cookieSecurityAttribute(request)}`;
}

async function getLoginKey(request: Request) {
  const ipAddress = request.headers.get('cf-connecting-ip') || 'local';
  const secret = getSessionSecret() || 'unconfigured';
  return encodeBase64Url(await sha256(`${secret}\n${ipAddress}`));
}

export async function checkLoginRateLimit(
  request: Request,
): Promise<LoginRateLimit> {
  if (!env.DB) {
    return { allowed: false, retryAfter: loginLockSeconds };
  }

  const key = await getLoginKey(request);
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    `SELECT attempts, window_started_at, locked_until
     FROM admin_login_attempts
     WHERE attempt_key = ?`,
  )
    .bind(key)
    .first<LoginAttemptRow>();

  if (row && row.locked_until > now) {
    return { allowed: false, retryAfter: row.locked_until - now };
  }

  return { allowed: true, retryAfter: 0 };
}

export async function recordLoginFailure(request: Request) {
  const key = await getLoginKey(request);
  const now = Math.floor(Date.now() / 1000);
  const current = await env.DB.prepare(
    `SELECT attempts, window_started_at, locked_until
     FROM admin_login_attempts
     WHERE attempt_key = ?`,
  )
    .bind(key)
    .first<LoginAttemptRow>();
  const withinWindow =
    current && now - current.window_started_at < loginWindowSeconds;
  const attempts = withinWindow ? current.attempts + 1 : 1;
  const windowStartedAt = withinWindow ? current.window_started_at : now;
  const lockedUntil = attempts >= maxLoginAttempts ? now + loginLockSeconds : 0;

  await env.DB.prepare(
    `INSERT INTO admin_login_attempts (
       attempt_key, attempts, window_started_at, locked_until, updated_at
     ) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(attempt_key) DO UPDATE SET
       attempts = excluded.attempts,
       window_started_at = excluded.window_started_at,
       locked_until = excluded.locked_until,
       updated_at = excluded.updated_at`,
  )
    .bind(key, attempts, windowStartedAt, lockedUntil, now)
    .run();

  return {
    locked: lockedUntil > now,
    retryAfter: Math.max(lockedUntil - now, 0),
  };
}

export async function clearLoginFailures(request: Request) {
  const key = await getLoginKey(request);
  await env.DB.prepare('DELETE FROM admin_login_attempts WHERE attempt_key = ?')
    .bind(key)
    .run();
}
