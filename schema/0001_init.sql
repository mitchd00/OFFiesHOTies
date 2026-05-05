-- ============================================================
-- OFFies & HOTies — v1 schema
-- Includes minimal stubs for v2 (ba_buyers), v4 (listings),
-- and v6 (rent_roll) so future versions only need ALTER TABLE.
-- ============================================================

-- AGENTS ------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  role      TEXT NOT NULL CHECK (role IN ('agent', 'director')),
  active    INTEGER NOT NULL DEFAULT 1
);

-- PROPERTIES (shared first-class entity) ----------------------
CREATE TABLE IF NOT EXISTS properties (
  id          TEXT PRIMARY KEY,
  street      TEXT NOT NULL,
  suburb      TEXT NOT NULL,
  postcode    TEXT NOT NULL,
  lat         REAL,
  lng         REAL,
  created_at  TEXT NOT NULL,
  created_by  TEXT NOT NULL REFERENCES agents(id)
);

-- OFFIES ------------------------------------------------------
CREATE TABLE IF NOT EXISTS offies (
  id          TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  price_guide TEXT,
  situation   TEXT NOT NULL CHECK (situation IN (
                'deceased-estate','divorce','downsizing','upgrading',
                'relocating','developer-site','financial-pressure','other'
              )),
  notes       TEXT,
  agent_id    TEXT NOT NULL REFERENCES agents(id),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  deleted_at  TEXT,
  deleted_by  TEXT REFERENCES agents(id)
);

-- HOTIES ------------------------------------------------------
CREATE TABLE IF NOT EXISTS hoties (
  id            TEXT PRIMARY KEY,
  buyer_name    TEXT NOT NULL,
  suburb_focus  TEXT NOT NULL,   -- JSON array of suburb name strings
  budget_band   TEXT NOT NULL CHECK (budget_band IN (
                  'sub-800','800-1m','1m-1.5m','1.5m-2m','2m-3m','3m-plus'
                )),
  brief         TEXT,
  agent_id      TEXT NOT NULL REFERENCES agents(id),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT,
  deleted_by    TEXT REFERENCES agents(id)
);

-- FUTURE TABLE STUBS (no UI in v1) ----------------------------
CREATE TABLE IF NOT EXISTS ba_buyers (
  id         TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS listings (
  id          TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  created_at  TEXT NOT NULL,
  deleted_at  TEXT
);

CREATE TABLE IF NOT EXISTS rent_roll (
  id          TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  created_at  TEXT NOT NULL,
  deleted_at  TEXT
);

-- INDEXES -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_offies_active ON offies(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_hoties_active ON hoties(deleted_at) WHERE deleted_at IS NULL;

-- SEED — seven agents ----------------------------------------
INSERT OR IGNORE INTO agents (id, name, role) VALUES
  ('mitch-lund',        'Mitch Lund',        'director'),
  ('jordan-lund',       'Jordan Lund',       'director'),
  ('minka-jenkins',     'Minka Jenkins',     'agent'),
  ('neill-vissor',      'Neill Vissor',      'agent'),
  ('justin-fitzgibbon', 'Justin Fitzgibbon', 'agent'),
  ('julie-coffee',      'Julie Coffee',      'agent'),
  ('julie-young',       'Julie Young',       'agent');
