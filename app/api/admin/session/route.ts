import {
  checkLoginRateLimit,
  clearLoginFailures,
  clearSessionCookie,
  createAdminSessionToken,
  createSessionCookie,
  isAdminAuthenticated,
  recordLoginFailure,
  requireSameOrigin,
  verifyAdminPassword,
} from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const noStoreHeaders = { 'cache-control': 'no-store' };

export async function GET(request: Request) {
  return Response.json(
    { authenticated: await isAdminAuthenticated(request) },
    { headers: noStoreHeaders },
  );
}

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);

  if (originError) {
    return originError;
  }

  const contentLength = Number.parseInt(
    request.headers.get('content-length') || '0',
    10,
  );

  if (contentLength > 2048) {
    return Response.json(
      { error: 'Solicitação inválida.' },
      { status: 413, headers: noStoreHeaders },
    );
  }

  try {
    const rateLimit = await checkLoginRateLimit(request);

    if (!rateLimit.allowed) {
      return Response.json(
        {
          error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        },
        {
          status: 429,
          headers: {
            ...noStoreHeaders,
            'retry-after': String(rateLimit.retryAfter),
          },
        },
      );
    }

    const body = (await request.json()) as { password?: unknown };
    const password = typeof body.password === 'string' ? body.password : '';

    if (password.length > 128 || !(await verifyAdminPassword(password))) {
      const failure = await recordLoginFailure(request);

      return Response.json(
        {
          error: failure.locked
            ? 'Muitas tentativas. Aguarde 15 minutos e tente novamente.'
            : 'Senha administrativa inválida.',
        },
        {
          status: failure.locked ? 429 : 401,
          headers: failure.locked
            ? {
                ...noStoreHeaders,
                'retry-after': String(failure.retryAfter),
              }
            : noStoreHeaders,
        },
      );
    }

    const token = await createAdminSessionToken();

    if (!token) {
      return Response.json(
        { error: 'Acesso administrativo ainda não configurado.' },
        { status: 503, headers: noStoreHeaders },
      );
    }

    await clearLoginFailures(request);

    return Response.json(
      { authenticated: true },
      {
        headers: {
          ...noStoreHeaders,
          'set-cookie': createSessionCookie(token, request),
        },
      },
    );
  } catch (error) {
    console.error('Falha no login administrativo.', error);
    return Response.json(
      { error: 'Não foi possível validar o acesso agora.' },
      { status: 500, headers: noStoreHeaders },
    );
  }
}

export async function DELETE(request: Request) {
  const originError = requireSameOrigin(request);

  if (originError) {
    return originError;
  }

  return Response.json(
    { authenticated: false },
    {
      headers: {
        ...noStoreHeaders,
        'set-cookie': clearSessionCookie(request),
      },
    },
  );
}
