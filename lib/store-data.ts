import { env } from 'cloudflare:workers';
import { PRODUCT_CATEGORIES, WHATSAPP_NUMBER } from '@/lib/store-config';
import type {
  Banner,
  BannerInput,
  Product,
  ProductInput,
  StorePayload,
  StoreSettings,
} from '@/lib/store-types';

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: string;
  price_cents: number;
  category: string;
  image_url: string;
  available: number;
  featured: number;
  bestseller: number;
  gift_kit: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type BannerRow = {
  id: string;
  title: string;
  subtitle: string;
  cta_label: string;
  image_url: string;
  active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type SettingRow = {
  setting_key: string;
  setting_value: string;
};

function getDatabase() {
  if (!env.DB) {
    throw new Error('Banco de dados indisponível.');
  }

  return env.DB;
}

function now() {
  return new Date().toISOString();
}

function toBool(value: number | boolean) {
  return value === true || value === 1;
}

function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    details: row.details,
    priceCents: row.price_cents,
    category: row.category,
    imageUrl: row.image_url,
    available: toBool(row.available),
    featured: toBool(row.featured),
    bestseller: toBool(row.bestseller),
    giftKit: toBool(row.gift_kit),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function bannerFromRow(row: BannerRow): Banner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    ctaLabel: row.cta_label,
    imageUrl: row.image_url,
    active: toBool(row.active),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function slugify(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return slug || `produto-${Date.now()}`;
}

function textField(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return (trimmed || fallback).slice(0, maxLength);
}

function imageUrlField(value: unknown, fallback: string) {
  const candidate = textField(value, fallback, 500);

  if (candidate.startsWith('/') && !candidate.startsWith('//')) {
    return candidate;
  }

  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function booleanField(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function numberField(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(Math.round(parsed), min), max);
}

export function sanitizeProductInput(value: unknown): ProductInput {
  const input = (value ?? {}) as Partial<ProductInput>;

  return {
    name: textField(input.name, 'Novo produto', 120),
    description: textField(
      input.description,
      'Descrição breve do produto.',
      240,
    ),
    details: textField(
      input.details,
      'Detalhes do produto, uso recomendado e composição do presente.',
      900,
    ),
    priceCents: numberField(input.priceCents, 0, 0, 99999900),
    category: PRODUCT_CATEGORIES.includes(String(input.category))
      ? String(input.category)
      : 'Outros',
    imageUrl: imageUrlField(input.imageUrl, '/gk-cuidados.png'),
    available: booleanField(input.available, true),
    featured: booleanField(input.featured, false),
    bestseller: booleanField(input.bestseller, false),
    giftKit: booleanField(input.giftKit, false),
    sortOrder: numberField(input.sortOrder, 100, 0, 9999),
  };
}

export function sanitizeBannerInput(value: unknown): BannerInput {
  const input = (value ?? {}) as Partial<BannerInput>;

  return {
    title: textField(input.title, 'Nova campanha', 120),
    subtitle: textField(input.subtitle, 'Mensagem principal do banner.', 280),
    ctaLabel: textField(input.ctaLabel, 'Ver catálogo', 40),
    imageUrl: imageUrlField(input.imageUrl, '/gk-kit-presente.png'),
    active: booleanField(input.active, true),
    sortOrder: numberField(input.sortOrder, 100, 0, 9999),
  };
}

export async function getSettings(): Promise<StoreSettings> {
  const db = getDatabase();
  const rows = await db
    .prepare('SELECT setting_key, setting_value FROM store_settings')
    .all<SettingRow>();
  const values = Object.fromEntries(
    (rows.results ?? []).map((row) => [row.setting_key, row.setting_value]),
  );

  return {
    WHATSAPP_NUMBER: String(
      values.WHATSAPP_NUMBER || env.WHATSAPP_NUMBER || WHATSAPP_NUMBER,
    ),
  };
}

export async function updateSettings(settings: Partial<StoreSettings>) {
  const db = getDatabase();
  const timestamp = now();
  const whatsapp = textField(
    settings.WHATSAPP_NUMBER,
    env.WHATSAPP_NUMBER || WHATSAPP_NUMBER,
    24,
  ).replace(/\D/g, '');

  await db
    .prepare(
      `INSERT INTO store_settings (setting_key, setting_value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(setting_key) DO UPDATE SET
         setting_value = excluded.setting_value,
         updated_at = excluded.updated_at`,
    )
    .bind('WHATSAPP_NUMBER', whatsapp || WHATSAPP_NUMBER, timestamp)
    .run();

  return getSettings();
}

export async function listProducts() {
  const db = getDatabase();
  const rows = await db
    .prepare(
      `SELECT id, name, slug, description, details, price_cents, category,
        image_url, available, featured, bestseller, gift_kit, sort_order,
        created_at, updated_at
       FROM products
       ORDER BY sort_order ASC, name ASC`,
    )
    .all<ProductRow>();

  return (rows.results ?? []).map(productFromRow);
}

export async function listBanners() {
  const db = getDatabase();
  const rows = await db
    .prepare(
      `SELECT id, title, subtitle, cta_label, image_url, active, sort_order,
        created_at, updated_at
       FROM banners
       ORDER BY sort_order ASC, created_at ASC`,
    )
    .all<BannerRow>();

  return (rows.results ?? []).map(bannerFromRow);
}

export async function getStorePayload(): Promise<StorePayload> {
  const [products, banners, settings] = await Promise.all([
    listProducts(),
    listBanners(),
    getSettings(),
  ]);

  return { products, banners, settings };
}

export async function createProduct(rawInput: unknown) {
  const db = getDatabase();
  const input = sanitizeProductInput(rawInput);
  const timestamp = now();
  let slug = slugify(input.name);
  let suffix = 2;

  while (
    await db
      .prepare('SELECT id FROM products WHERE slug = ?')
      .bind(slug)
      .first<{ id: string }>()
  ) {
    slug = `${slugify(input.name)}-${suffix}`;
    suffix += 1;
  }

  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO products (
        id, name, slug, description, details, price_cents, category, image_url,
        available, featured, bestseller, gift_kit, sort_order, created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.name,
      slug,
      input.description,
      input.details,
      input.priceCents,
      input.category,
      input.imageUrl,
      input.available ? 1 : 0,
      input.featured ? 1 : 0,
      input.bestseller ? 1 : 0,
      input.giftKit ? 1 : 0,
      input.sortOrder,
      timestamp,
      timestamp,
    )
    .run();

  return getProductById(id);
}

export async function updateProduct(id: string, rawInput: unknown) {
  const db = getDatabase();
  const input = sanitizeProductInput(rawInput);
  const timestamp = now();

  await db
    .prepare(
      `UPDATE products SET
        name = ?, description = ?, details = ?, price_cents = ?,
        category = ?, image_url = ?, available = ?, featured = ?,
        bestseller = ?, gift_kit = ?, sort_order = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      input.name,
      input.description,
      input.details,
      input.priceCents,
      input.category,
      input.imageUrl,
      input.available ? 1 : 0,
      input.featured ? 1 : 0,
      input.bestseller ? 1 : 0,
      input.giftKit ? 1 : 0,
      input.sortOrder,
      timestamp,
      id,
    )
    .run();

  return getProductById(id);
}

export async function deleteProduct(id: string) {
  const db = getDatabase();
  await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
}

export async function getProductById(id: string) {
  const db = getDatabase();
  const row = await db
    .prepare(
      `SELECT id, name, slug, description, details, price_cents, category,
        image_url, available, featured, bestseller, gift_kit, sort_order,
        created_at, updated_at
       FROM products
       WHERE id = ?`,
    )
    .bind(id)
    .first<ProductRow>();

  return row ? productFromRow(row) : null;
}

export async function createBanner(rawInput: unknown) {
  const db = getDatabase();
  const input = sanitizeBannerInput(rawInput);
  const timestamp = now();
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO banners (
        id, title, subtitle, cta_label, image_url, active, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.title,
      input.subtitle,
      input.ctaLabel,
      input.imageUrl,
      input.active ? 1 : 0,
      input.sortOrder,
      timestamp,
      timestamp,
    )
    .run();

  return getBannerById(id);
}

export async function updateBanner(id: string, rawInput: unknown) {
  const db = getDatabase();
  const input = sanitizeBannerInput(rawInput);
  const timestamp = now();

  await db
    .prepare(
      `UPDATE banners SET
        title = ?, subtitle = ?, cta_label = ?, image_url = ?,
        active = ?, sort_order = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      input.title,
      input.subtitle,
      input.ctaLabel,
      input.imageUrl,
      input.active ? 1 : 0,
      input.sortOrder,
      timestamp,
      id,
    )
    .run();

  return getBannerById(id);
}

export async function deleteBanner(id: string) {
  const db = getDatabase();
  await db.prepare('DELETE FROM banners WHERE id = ?').bind(id).run();
}

export async function getBannerById(id: string) {
  const db = getDatabase();
  const row = await db
    .prepare(
      `SELECT id, title, subtitle, cta_label, image_url, active, sort_order,
        created_at, updated_at
       FROM banners
       WHERE id = ?`,
    )
    .bind(id)
    .first<BannerRow>();

  return row ? bannerFromRow(row) : null;
}
