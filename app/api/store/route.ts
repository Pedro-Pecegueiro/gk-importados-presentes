import { getStorePayload } from '@/lib/store-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json(await getStorePayload(), {
      headers: { 'cache-control': 'no-store' },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Não foi possível carregar a loja.' },
      { status: 500 },
    );
  }
}
