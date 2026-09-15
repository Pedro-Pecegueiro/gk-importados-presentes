import type { Metadata } from 'next';
import StoreApp from '../../store-app';
import { getInitialStorePayload } from '@/lib/store-initial';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getInitialStorePayload();
  const product = payload?.products.find((item) => item.slug === slug);

  if (!product) {
    return {
      title: 'Produto não encontrado | GK Importados e Presentes',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${product.name} | GK Importados e Presentes`,
    description: product.description,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      title: product.name,
      description: product.description,
      images: [{ url: product.imageUrl, alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const initialPayload = await getInitialStorePayload();

  return (
    <StoreApp
      initialView="catalog"
      initialProductSlug={slug}
      initialPayload={initialPayload}
    />
  );
}
