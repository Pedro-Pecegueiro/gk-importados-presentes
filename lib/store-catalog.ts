import { normalizeText } from '@/lib/store-format';
import type { Product } from '@/lib/store-types';

export function countProductsByCategory(products: Product[]) {
  const counts = new Map<string, number>();

  for (const product of products) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }

  return counts;
}

export function filterCatalogProducts(
  products: Product[],
  search: string,
  category: string,
) {
  const term = normalizeText(search.trim());

  return products.filter((product) => {
    if (category !== 'Todos' && product.category !== category) {
      return false;
    }

    if (!term) {
      return true;
    }

    const searchableText = normalizeText(
      `${product.name} ${product.description} ${product.category}`,
    );

    return searchableText.includes(term);
  });
}
