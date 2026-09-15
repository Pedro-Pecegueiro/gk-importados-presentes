import { PRODUCT_CATEGORIES } from '@/lib/store-config';
import type {
  Banner,
  BannerInput,
  Product,
  ProductInput,
} from '@/lib/store-types';

export type ProductFormState = Omit<ProductInput, 'description'> & {
  id?: string;
};

export type BannerFormState = BannerInput & {
  id?: string;
};

export function createEmptyProductForm(sortOrder = 100): ProductFormState {
  return {
    name: '',
    details: '',
    priceCents: 0,
    category: PRODUCT_CATEGORIES[0],
    imageUrl: '/gk-cuidados.png',
    available: true,
    featured: false,
    bestseller: false,
    giftKit: false,
    sortOrder,
  };
}

export function createEmptyBannerForm(sortOrder = 100): BannerFormState {
  return {
    title: '',
    subtitle: '',
    ctaLabel: 'Ver catálogo',
    imageUrl: '/gk-kit-presente.png',
    active: true,
    sortOrder,
  };
}

export function productToForm(product: Product): ProductFormState {
  return {
    id: product.id,
    name: product.name,
    details: product.details,
    priceCents: product.priceCents,
    category: product.category,
    imageUrl: product.imageUrl,
    available: product.available,
    featured: product.featured,
    bestseller: product.bestseller,
    giftKit: product.giftKit,
    sortOrder: product.sortOrder,
  };
}

export function bannerToForm(banner: Banner): BannerFormState {
  return {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    ctaLabel: banner.ctaLabel,
    imageUrl: banner.imageUrl,
    active: banner.active,
    sortOrder: banner.sortOrder,
  };
}

export function priceInputFromCents(priceCents: number) {
  return priceCents > 0 ? (priceCents / 100).toFixed(2).replace('.', ',') : '';
}

export function priceCentsFromInput(value: string) {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  const amount = Number.parseFloat(normalized);

  return Number.isFinite(amount) ? Math.max(Math.round(amount * 100), 0) : 0;
}

export function productInputFromForm(form: ProductFormState): ProductInput {
  const { id: _id, ...input } = form;
  return { ...input, description: input.details };
}

export function bannerInputFromForm(form: BannerFormState): BannerInput {
  const { id: _id, ...input } = form;
  return input;
}
