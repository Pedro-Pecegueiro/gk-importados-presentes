import { requireAdmin } from '@/lib/admin-auth';
import { getSettings, updateSettings } from '@/lib/store-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json({ settings: await getSettings() });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Não foi possível carregar as configurações.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const forbidden = await requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  try {
    return Response.json({
      settings: await updateSettings(await request.json()),
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Não foi possível salvar as configurações.' },
      { status: 500 },
    );
  }
}
