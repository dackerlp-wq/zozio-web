-- ─────────────────────────────────────────────────────────────────────────────
-- Migrace: nové sloupce pro přepracovaný formulář zvířete
-- Spustit v Supabase → SQL Editor
-- Bezpečné opakované spuštění díky IF NOT EXISTS
-- ─────────────────────────────────────────────────────────────────────────────

-- Věk v měsících (pro mláďata < 1 rok)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS age_months INTEGER;

-- Původ zvířete
ALTER TABLE animals ADD COLUMN IF NOT EXISTS origin TEXT
  CHECK (origin IN ('municipal_capture','seized','found','surrendered','transferred','other'));

-- Vztah k dospělým / cizím lidem
ALTER TABLE animals ADD COLUMN IF NOT EXISTS good_with_adults TEXT DEFAULT 'unknown'
  CHECK (good_with_adults IN ('friendly','shy','fearful','distrustful','unknown'));

-- Záchranná stanice — druh nálezu
ALTER TABLE animals ADD COLUMN IF NOT EXISTS rescue_find_type TEXT;

-- Záchranná stanice — prognóza
ALTER TABLE animals ADD COLUMN IF NOT EXISTS rescue_prognosis TEXT
  CHECK (rescue_prognosis IN ('release','permanent_handicap','unknown'));

-- Záchranná stanice — veřejný popis případu
ALTER TABLE animals ADD COLUMN IF NOT EXISTS rescue_public_description TEXT;

-- Příběh zvířete (zobrazí se na webu)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS story TEXT;

-- Požadavky na adoptéra
ALTER TABLE animals ADD COLUMN IF NOT EXISTS adopter_requirements TEXT;

-- Převod good_with_* z boolean na text (více možností: yes/ok/no/unknown)
-- POZOR: tato část změní typ sloupců — spusť pouze pokud jsou všechny hodnoty NULL nebo true/false
ALTER TABLE animals
  ALTER COLUMN good_with_kids          TYPE TEXT USING CASE WHEN good_with_kids          THEN 'yes' WHEN good_with_kids          IS FALSE THEN 'no' ELSE 'unknown' END,
  ALTER COLUMN good_with_dogs          TYPE TEXT USING CASE WHEN good_with_dogs          THEN 'yes' WHEN good_with_dogs          IS FALSE THEN 'no' ELSE 'unknown' END,
  ALTER COLUMN good_with_cats          TYPE TEXT USING CASE WHEN good_with_cats          THEN 'yes' WHEN good_with_cats          IS FALSE THEN 'no' ELSE 'unknown' END,
  ALTER COLUMN good_with_other_animals TYPE TEXT USING CASE WHEN good_with_other_animals THEN 'yes' WHEN good_with_other_animals IS FALSE THEN 'no' ELSE 'unknown' END;

-- Index pro rychlé načítání podle data příjmu
CREATE INDEX IF NOT EXISTS idx_animals_intake_date ON animals (institution_id, intake_date DESC);
