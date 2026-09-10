import { createProduct, listProducts, requireAdmin } from '@/lib/store-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json({ products: await listProducts() });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Nao foi possivel listar os produtos.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  try {
    const product = await createProduct(await request.json());
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Nao foi possivel cadastrar o produto.' },
      { status: 500 },
    );
  }
}
