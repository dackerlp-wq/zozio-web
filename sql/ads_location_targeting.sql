-- ──────────────────────────────────────────────────────────────────────────
-- Zozio Ads — lokální cílení podle krajů
-- Spustit v Supabase SQL Editoru
-- ──────────────────────────────────────────────────────────────────────────

-- Přidáme sloupec target_regions do ads
-- Prázdné pole {} = celá ČR (národní dosah, žádné omezení)
-- Vyplněné pole = zobrazovat pouze v těchto krajích
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS target_regions text[] NOT NULL DEFAULT '{}';

-- GIN index pro rychlé vyhledávání podle regionu (@> operátor)
CREATE INDEX IF NOT EXISTS ads_target_regions_gin
  ON ads USING gin(target_regions);

-- Přidáme sloupec status (pokud ještě neexistuje z ads_company_portal.sql)
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';
-- 'draft' | 'pending_review' | 'approved' | 'rejected' | 'paused'

-- Index pro efektivní dotazy na aktivní schválené reklamy
CREATE INDEX IF NOT EXISTS ads_active_approved_idx
  ON ads (active, status, active_from, active_to)
  WHERE active = true AND status = 'approved';

-- Komentář
COMMENT ON COLUMN ads.target_regions IS
  'Kraje kde se reklama zobrazuje. Prázdné pole = celá ČR. Hodnoty: viz czech-places.ts REGIONS[].name';
