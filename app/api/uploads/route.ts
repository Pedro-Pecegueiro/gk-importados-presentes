import { env } from 'cloudflare:workers';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const maxUploadBytes = 4 * 1024 * 1024;

const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function fileExtension(type: string) {
  if (type === 'image/png') {
    return '.png';
  }

  if (type === 'image/webp') {
    return '.webp';
  }

  return '.jpg';
}

function hasValidImageSignature(type: string, bytes: Uint8Array) {
  if (type === 'image/jpeg') {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (type === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((byte, index) => bytes[index] === byte);
  }

  if (type === 'image/webp') {
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    );
  }

  return false;
}

export async function POST(request: Request) {
  const forbidden = await requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  if (!env.ASSETS) {
    return Response.json(
      { error: 'Armazenamento de imagens indisponível.' },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return Response.json({ error: 'Envie uma imagem.' }, { status: 400 });
  }

  if (!acceptedImageTypes.has(file.type)) {
    return Response.json(
      { error: 'Use uma imagem JPG, PNG ou WebP.' },
      { status: 400 },
    );
  }

  if (file.size > maxUploadBytes) {
    return Response.json(
      { error: 'A imagem deve ter até 4 MB.' },
      { status: 400 },
    );
  }

  const fileBytes = new Uint8Array(await file.arrayBuffer());

  if (!hasValidImageSignature(file.type, fileBytes)) {
    return Response.json(
      { error: 'O conteúdo do arquivo não corresponde a uma imagem válida.' },
      { status: 400 },
    );
  }

  const key = `uploads/${crypto.randomUUID()}${fileExtension(file.type)}`;

  await env.ASSETS.put(key, fileBytes, {
    httpMetadata: { contentType: file.type },
  });

  return Response.json({
    imageUrl: `/api/assets?key=${encodeURIComponent(key)}`,
  });
}
