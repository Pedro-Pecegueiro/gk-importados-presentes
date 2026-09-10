import { env } from 'cloudflare:workers';
import { requireAdmin } from '@/lib/store-data';

export const dynamic = 'force-dynamic';

const maxUploadBytes = 4 * 1024 * 1024;

function fileExtension(type: string) {
  if (type === 'image/png') {
    return '.png';
  }

  if (type === 'image/webp') {
    return '.webp';
  }

  return '.jpg';
}

export async function POST(request: Request) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  if (!env.ASSETS) {
    return Response.json(
      { error: 'Armazenamento de imagens indisponivel.' },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return Response.json({ error: 'Envie uma imagem.' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return Response.json(
      { error: 'O arquivo precisa ser uma imagem.' },
      { status: 400 },
    );
  }

  if (file.size > maxUploadBytes) {
    return Response.json(
      { error: 'A imagem deve ter ate 4 MB.' },
      { status: 400 },
    );
  }

  const key = `uploads/${crypto.randomUUID()}${fileExtension(file.type)}`;

  await env.ASSETS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return Response.json({
    imageUrl: `/api/assets?key=${encodeURIComponent(key)}`,
  });
}
