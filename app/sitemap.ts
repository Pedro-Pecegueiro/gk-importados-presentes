import type { MetadataRoute } from 'next';
import { getInitialStorePayload } from '@/lib/store-initial';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gkpresentes.com.br';
  const payload = await getInitialStorePayload();
  const products = payload?.products ?? [];

  return [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/catalogo`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...products.map((product) => ({
      url: `${baseUrl}/produto/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
