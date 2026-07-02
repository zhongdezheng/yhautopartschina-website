-- D1 Schema for YH Auto Parts product management
-- Run this in Cloudflare D1 dashboard or via wrangler

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  compatible TEXT NOT NULL,
  features TEXT NOT NULL DEFAULT '[]',  -- JSON array
  image TEXT,
  market_focus TEXT NOT NULL DEFAULT '[]', -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default site config
INSERT OR IGNORE INTO site_config (key, value) VALUES
  ('brand_name', 'YH AUTO PARTS'),
  ('tagline', 'Your Trusted Auto Parts Partner Since 2002'),
  ('whatsapp', '+8618802074040'),
  ('email', 'info@yhautopartschina.com');

-- Index for search
CREATE INDEX IF NOT EXISTS idx_products_title ON products(title);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at DESC);
