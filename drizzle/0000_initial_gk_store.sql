CREATE TABLE `products` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `description` text NOT NULL,
  `details` text NOT NULL,
  `price_cents` integer NOT NULL,
  `category` text NOT NULL,
  `image_url` text NOT NULL,
  `available` integer NOT NULL,
  `featured` integer NOT NULL,
  `bestseller` integer NOT NULL,
  `gift_kit` integer NOT NULL,
  `sort_order` integer NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);
CREATE INDEX `idx_products_available` ON `products` (`available`);
CREATE INDEX `idx_products_category` ON `products` (`category`);
CREATE INDEX `idx_products_featured` ON `products` (`featured`);
CREATE TABLE `banners` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `subtitle` text NOT NULL,
  `cta_label` text NOT NULL,
  `image_url` text NOT NULL,
  `active` integer NOT NULL,
  `sort_order` integer NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
CREATE INDEX `idx_banners_active` ON `banners` (`active`);
CREATE TABLE `store_settings` (
  `setting_key` text PRIMARY KEY NOT NULL,
  `setting_value` text NOT NULL,
  `updated_at` text NOT NULL
);
