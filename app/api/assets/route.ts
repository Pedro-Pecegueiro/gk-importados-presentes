import { env } from 'cloudflare:workers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!env.ASSETS) {
    return new Response('Storage unavailable', { status: 500 });
  }

  const key = new URL(request.url).searchParams.get('key') ?? '';

  if (!key.startsWith('uploads/')) {
    return new Response('Invalid asset key', { status: 400 });
  }

  const object = await env.ASSETS.get(key);

  if (!object) {
    return new Response('Asset not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}
