import { env } from 'cloudflare:workers';
import {
  ADMIN_ACCESS_CODE,
  PRODUCT_CATEGORIES,
  WHATSAPP_NUMBER,
} from '@/lib/store-config';
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

const demoProducts: Array<Omit<ProductInput, 'sortOrder'> & { slug: string }> =
  [
    {
      name: 'Perfume Ambar Dourado 100ml',
      slug: 'perfume-ambar-dourado-100ml',
      description: 'Fragrancia elegante com notas ambaradas e fundo cremoso.',
      details:
        'Uma escolha marcante para noite, presente especial ou rotina de quem gosta de perfumes com presenca sofisticada.',
      priceCents: 18990,
      category: 'Perfumes',
      imageUrl: '/gk-cuidados.png',
      available: true,
      featured: true,
      bestseller: true,
      giftKit: false,
    },
    {
      name: 'Body Splash Flores Nobres 200ml',
      slug: 'body-splash-flores-nobres-200ml',
      description: 'Toque floral leve para renovar a sensacao de frescor.',
      details:
        'Ideal para uso diario, com fixacao delicada e acabamento confortavel na pele.',
      priceCents: 6990,
      category: 'Cosméticos',
      imageUrl: '/gk-cuidados.png',
      available: true,
      featured: true,
      bestseller: false,
      giftKit: false,
    },
    {
      name: 'Hidratante Vanilla Silk 250g',
      slug: 'hidratante-vanilla-silk-250g',
      description: 'Hidratacao acetinada com aroma quente e envolvente.',
      details:
        'Textura macia, rapida absorcao e fragrancia aconchegante para complementar o perfume favorito.',
      priceCents: 5490,
      category: 'Hidratantes',
      imageUrl: '/gk-cuidados.png',
      available: true,
      featured: false,
      bestseller: true,
      giftKit: false,
    },
    {
      name: 'Desodorante Creme Algodao 80g',
      slug: 'desodorante-creme-algodao-80g',
      description: 'Protecao suave com toque limpo para a rotina.',
      details:
        'Opcao pratica para quem procura conforto, perfume discreto e cuidado diario.',
      priceCents: 3490,
      category: 'Desodorantes',
      imageUrl: '/gk-cuidados.png',
      available: true,
      featured: false,
      bestseller: false,
      giftKit: false,
    },
    {
      name: 'Kit Presente Glow',
      slug: 'kit-presente-glow',
      description: 'Caixa presenteavel com perfume, hidratante e chocolates.',
      details:
        'Montagem pronta para datas especiais, com combinacao equilibrada entre cuidado pessoal e delicadeza.',
      priceCents: 15990,
      category: 'Kits de presente',
      imageUrl: '/gk-kit-presente.png',
      available: true,
      featured: true,
      bestseller: true,
      giftKit: true,
    },
    {
      name: 'Kit Carinho Essencial',
      slug: 'kit-carinho-essencial',
      description: 'Presente compacto com itens selecionados da loja.',
      details:
        'Boa opcao para lembrancas elegantes, amigo secreto ou gesto de agradecimento.',
      priceCents: 8990,
      category: 'Kits de presente',
      imageUrl: '/gk-kit-presente.png',
      available: true,
      featured: false,
      bestseller: false,
      giftKit: true,
    },
    {
      name: 'Carteira Mini Champagne',
      slug: 'carteira-mini-champagne',
      description: 'Acessorio delicado para compor kits e presentes.',
      details:
        'Acabamento elegante, tamanho pratico e tonalidade neutra para uso diario.',
      priceCents: 4990,
      category: 'Acessórios',
      imageUrl: '/gk-kit-presente.png',
      available: true,
      featured: false,
      bestseller: true,
      giftKit: false,
    },
    {
      name: 'Bombons Trufados Premium',
      slug: 'bombons-trufados-premium',
      description: 'Caixa de chocolates para acompanhar presentes especiais.',
      details:
        'Sugestao para complementar kits, lembrancas romanticas e cestas personalizadas.',
      priceCents: 4290,
      category: 'Chocolates',
      imageUrl: '/gk-kit-presente.png',
      available: true,
      featured: false,
      bestseller: false,
      giftKit: false,
    },
    {
      name: 'Perfume Citrus Classico 100ml',
      slug: 'perfume-citrus-classico-100ml',
      description: 'Fragrancia fresca com saida citrica e fundo elegante.',
      details:
        'Versatil para trabalho, encontros e dias quentes, com assinatura limpa e sofisticada.',
      priceCents: 14990,
      category: 'Perfumes',
      imageUrl: '/gk-cuidados.png',
      available: false,
      featured: false,
      bestseller: false,
      giftKit: false,
    },
  ];

const demoBanners: BannerInput[] = [
  {
    title: 'Presentes elegantes para cada ocasiao',
    subtitle:
      'Perfumes, cuidados e kits com acabamento de boutique para transformar escolhas simples em gestos memoraveis.',
    ctaLabel: 'Ver catalogo',
    imageUrl: '/gk-kit-presente.png',
    active: true,
    sortOrder: 1,
  },
  {
    title: 'Perfumaria com curadoria acolhedora',
    subtitle:
      'Produtos selecionados, sacola rapida e atendimento humano pelo WhatsApp antes da confirmacao final.',
    ctaLabel: 'Montar sacola',
    imageUrl: '/gk-cuidados.png',
    active: true,
    sortOrder: 2,
  },
];

function getDatabase() {
  if (!env.DB) {
    throw new Error('DB binding is not available.');
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

function booleanField(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function numberField(value: unknown, fallback: number, min: number, max: number) {
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
    description: textField(input.description, 'Descricao breve do produto.', 240),
    details: textField(
      input.details,
      'Detalhes do produto, uso recomendado e composicao do presente.',
      900,
    ),
    priceCents: numberField(input.priceCents, 0, 0, 99999900),
    category: PRODUCT_CATEGORIES.includes(String(input.category))
      ? String(input.category)
      : 'Outros',
    imageUrl: textField(input.imageUrl, '/gk-cuidados.png', 500),
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
    ctaLabel: textField(input.ctaLabel, 'Ver catalogo', 40),
    imageUrl: textField(input.imageUrl, '/gk-kit-presente.png', 500),
    active: booleanField(input.active, true),
    sortOrder: numberField(input.sortOrder, 100, 0, 9999),
  };
}

export function requireAdmin(request: Request) {
  const provided = request.headers.get('x-admin-key')?.trim();
  const expected = env.ADMIN_ACCESS_CODE || ADMIN_ACCESS_CODE;

  if (!provided || provided !== expected) {
    return Response.json(
      { error: 'Codigo administrativo invalido.' },
      { status: 401 },
    );
  }

  return null;
}

export async function ensureSeedData() {
  const db = getDatabase();
  const timestamp = now();
  const productCount = await db
    .prepare('SELECT COUNT(*) AS count FROM products')
    .first<{ count: number }>();

  if ((productCount?.count ?? 0) === 0) {
    await db.batch(
      demoProducts.map((product, index) =>
        db
          .prepare(
            `INSERT INTO products (
              id, name, slug, description, details, price_cents, category,
              image_url, available, featured, bestseller, gift_kit, sort_order,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            product.name,
            product.slug,
            product.description,
            product.details,
            product.priceCents,
            product.category,
            product.imageUrl,
            product.available ? 1 : 0,
            product.featured ? 1 : 0,
            product.bestseller ? 1 : 0,
            product.giftKit ? 1 : 0,
            (index + 1) * 10,
            timestamp,
            timestamp,
          ),
      ),
    );
  }

  const bannerCount = await db
    .prepare('SELECT COUNT(*) AS count FROM banners')
    .first<{ count: number }>();

  if ((bannerCount?.count ?? 0) === 0) {
    await db.batch(
      demoBanners.map((banner) =>
        db
          .prepare(
            `INSERT INTO banners (
              id, title, subtitle, cta_label, image_url, active, sort_order,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            banner.title,
            banner.subtitle,
            banner.ctaLabel,
            banner.imageUrl,
            banner.active ? 1 : 0,
            banner.sortOrder,
            timestamp,
            timestamp,
          ),
      ),
    );
  }

  await db
    .prepare(
      `INSERT INTO store_settings (setting_key, setting_value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(setting_key) DO NOTHING`,
    )
    .bind('WHATSAPP_NUMBER', env.WHATSAPP_NUMBER || WHATSAPP_NUMBER, timestamp)
    .run();
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
    WHATSAPP_NUMBER:
      String(values.WHATSAPP_NUMBER || env.WHATSAPP_NUMBER || WHATSAPP_NUMBER),
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
  await ensureSeedData();

  const [products, banners, settings] = await Promise.all([
    listProducts(),
    listBanners(),
    getSettings(),
  ]);

  return { products, banners, settings };
}

export async function createProduct(rawInput: unknown) {
  await ensureSeedData();

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
  await ensureSeedData();

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
  await ensureSeedData();

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
  await ensureSeedData();

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
  await ensureSeedData();

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
  await ensureSeedData();

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
