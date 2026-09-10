import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
    details: text('details').notNull(),
    priceCents: integer('price_cents').notNull(),
    category: text('category').notNull(),
    imageUrl: text('image_url').notNull(),
    available: integer('available', { mode: 'boolean' }).notNull(),
    featured: integer('featured', { mode: 'boolean' }).notNull(),
    bestseller: integer('bestseller', { mode: 'boolean' }).notNull(),
    giftKit: integer('gift_kit', { mode: 'boolean' }).notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    idxProductsAvailable: index('idx_products_available').on(table.available),
    idxProductsCategory: index('idx_products_category').on(table.category),
    idxProductsFeatured: index('idx_products_featured').on(table.featured),
  }),
);

export const banners = sqliteTable(
  'banners',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull(),
    ctaLabel: text('cta_label').notNull(),
    imageUrl: text('image_url').notNull(),
    active: integer('active', { mode: 'boolean' }).notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    idxBannersActive: index('idx_banners_active').on(table.active),
  }),
);

export const storeSettings = sqliteTable('store_settings', {
  key: text('setting_key').primaryKey(),
  value: text('setting_value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const adminLoginAttempts = sqliteTable(
  'admin_login_attempts',
  {
    key: text('attempt_key').primaryKey(),
    attempts: integer('attempts').notNull().default(0),
    windowStartedAt: integer('window_started_at').notNull(),
    lockedUntil: integer('locked_until').notNull().default(0),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    idxAdminLoginAttemptsUpdatedAt: index(
      'idx_admin_login_attempts_updated_at',
    ).on(table.updatedAt),
  }),
);
