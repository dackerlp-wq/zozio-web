-- ──────────────────────────────────────────────────────────────────────────
-- Zozio Ads — rozšíření cílení v2
-- Spustit v Supabase SQL Editoru
-- ──────────────────────────────────────────────────────────────────────────

-- Cílení na konkrétní útulky (boost, ne omezení)
-- Prázdné pole = všechny útulky
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS target_institutions uuid[] NOT NULL DEFAULT '{}';

-- Cílení na kategorie článků
-- Hodnoty: 'story' | 'rescue' | 'tips' | 'news'
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS target_article_categories text[] NOT NULL DEFAULT '{}';

-- GIN indexy pro efektivní filtrování
CREATE INDEX IF NOT EXISTS ads_institutions_gin
  ON ads USING gin(target_institutions);

CREATE INDEX IF NOT EXISTS ads_article_categories_gin
  ON ads USING gin(target_article_categories);

-- Komentáře
COMMENT ON COLUMN ads.target_institutions IS
  'UUID útulků kde je reklama preferována. Prázdné = všechny útulky.';

COMMENT ON COLUMN ads.target_article_categories IS
  'Kategorie článků kde je reklama preferována. Prázdné = všechny kategorie.';
