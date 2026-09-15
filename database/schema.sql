CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  author VARCHAR(255),
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  audio_url TEXT,
  document_url TEXT,
  content_type VARCHAR(20) NOT NULL DEFAULT 'audio',
  body JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT materials_has_media CHECK (
    audio_url IS NOT NULL OR document_url IS NOT NULL OR content_type = 'article'
  ),
  CONSTRAINT materials_content_type_check CHECK (content_type IN ('audio', 'article', 'book')),
  CONSTRAINT materials_status_check CHECK (status IN ('published', 'draft', 'archived'))
);

CREATE INDEX IF NOT EXISTS materials_category_id_idx
  ON materials(category_id);

CREATE INDEX IF NOT EXISTS materials_created_at_idx
  ON materials(created_at DESC);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'viewer'))
);
