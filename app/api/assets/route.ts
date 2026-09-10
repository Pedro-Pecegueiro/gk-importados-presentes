import { env } from 'cloudflare:workers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!env.ASSETS) {
    return new Response('Armazenamento indisponível', { status: 500 });
  }

  const key = new URL(request.url).searchParams.get('key') ?? '';

  if (!key.startsWith('uploads/')) {
    return new Response('Identificador de arquivo inválido', { status: 400 });
  }

  const object = await env.ASSETS.get(key);

  if (!object) {
    return new Response('Arquivo não encontrado', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('x-content-type-options', 'nosniff');

  return new Response(object.body, { headers });
}
