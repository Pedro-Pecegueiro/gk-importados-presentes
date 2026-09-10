CREATE TABLE `admin_login_attempts` (
  `attempt_key` text PRIMARY KEY NOT NULL,
  `attempts` integer NOT NULL DEFAULT 0,
  `window_started_at` integer NOT NULL,
  `locked_until` integer NOT NULL DEFAULT 0,
  `updated_at` integer NOT NULL
);
CREATE INDEX `idx_admin_login_attempts_updated_at`
  ON `admin_login_attempts` (`updated_at`);
