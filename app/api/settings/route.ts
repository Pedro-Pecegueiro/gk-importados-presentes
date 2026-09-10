import {
  getSettings,
  requireAdmin,
  updateSettings,
} from '@/lib/store-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json({ settings: await getSettings() });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Nao foi possivel carregar as configuracoes.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  try {
    return Response.json({ settings: await updateSettings(await request.json()) });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Nao foi possivel salvar as configuracoes.' },
      { status: 500 },
    );
  }
}
