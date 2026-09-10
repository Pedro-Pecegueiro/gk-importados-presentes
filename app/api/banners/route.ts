import { requireAdmin } from '@/lib/admin-auth';
import { createBanner, listBanners } from '@/lib/store-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json({ banners: await listBanners() });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Não foi possível listar os banners.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const forbidden = await requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  try {
    const banner = await createBanner(await request.json());
    return Response.json({ banner }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Não foi possível cadastrar o banner.' },
      { status: 500 },
    );
  }
}
