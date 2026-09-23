-- 00022: journal posts written by Ooruda Villa.
--
-- The guest site's first journal posts ship as MDX files in the repo. New posts
-- are written in Ooruda Villa and stored here (docs/OORUDA_VILLA_INTEGRATION.md).
-- body is plain Markdown, never MDX: MDX compiles to code, and code must not
-- come from a database row.

CREATE TABLE IF NOT EXISTS journal_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 100),
  title         TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  excerpt       TEXT NOT NULL CHECK (length(excerpt) BETWEEN 1 AND 320),
  category      TEXT NOT NULL CHECK (category IN ('mangalore-guides', 'plan-your-stay')),
  body          TEXT NOT NULL,
  cover_image_url TEXT,
  cover_alt     TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at  DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, slug),
  CHECK (status = 'draft' OR published_at IS NOT NULL),
  CHECK (cover_image_url IS NULL OR cover_alt IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_journal_published
  ON journal_posts(property_id, status, published_at DESC);

CREATE OR REPLACE FUNCTION journal_posts_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_journal_posts_updated_at ON journal_posts;
CREATE TRIGGER trg_journal_posts_updated_at
  BEFORE UPDATE ON journal_posts
  FOR EACH ROW EXECUTE FUNCTION journal_posts_touch_updated_at();

ALTER TABLE journal_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_journal" ON journal_posts;
CREATE POLICY "public_read_journal" ON journal_posts FOR SELECT USING (status = 'published');

GRANT SELECT ON journal_posts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON journal_posts TO service_role;
