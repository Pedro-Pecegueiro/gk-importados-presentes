import {
  deleteProduct,
  requireAdmin,
  updateProduct,
} from '@/lib/store-data';

export const dynamic = 'force-dynamic';

type ProductContext = {
  params: { id: string } | Promise<{ id: string }>;
};

async function getProductId(context: ProductContext) {
  return (await context.params).id;
}

export async function PATCH(request: Request, context: ProductContext) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  try {
    const product = await updateProduct(
      await getProductId(context),
      await request.json(),
    );

    if (!product) {
      return Response.json(
        { error: 'Produto nao encontrado.' },
        { status: 404 },
      );
    }

    return Response.json({ product });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Nao foi possivel atualizar o produto.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: ProductContext) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  try {
    await deleteProduct(await getProductId(context));
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Nao foi possivel excluir o produto.' },
      { status: 500 },
    );
  }
}
