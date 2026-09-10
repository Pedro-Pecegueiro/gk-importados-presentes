export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: string;
  priceCents: number;
  category: string;
  imageUrl: string;
  available: boolean;
  featured: boolean;
  bestseller: boolean;
  giftKit: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  name: string;
  description: string;
  details: string;
  priceCents: number;
  category: string;
  imageUrl: string;
  available: boolean;
  featured: boolean;
  bestseller: boolean;
  giftKit: boolean;
  sortOrder: number;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BannerInput = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
};

export type StoreSettings = {
  WHATSAPP_NUMBER: string;
};

export type StorePayload = {
  products: Product[];
  banners: Banner[];
  settings: StoreSettings;
};
