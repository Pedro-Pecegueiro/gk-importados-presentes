import {
  deleteBanner,
  requireAdmin,
  updateBanner,
} from '@/lib/store-data';

export const dynamic = 'force-dynamic';

type BannerContext = {
  params: { id: string } | Promise<{ id: string }>;
};

async function getBannerId(context: BannerContext) {
  return (await context.params).id;
}

export async function PATCH(request: Request, context: BannerContext) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  try {
    const banner = await updateBanner(
      await getBannerId(context),
      await request.json(),
    );

    if (!banner) {
      return Response.json(
        { error: 'Banner nao encontrado.' },
        { status: 404 },
      );
    }

    return Response.json({ banner });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Nao foi possivel atualizar o banner.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: BannerContext) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  try {
    await deleteBanner(await getBannerId(context));
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Nao foi possivel excluir o banner.' },
      { status: 500 },
    );
  }
}
