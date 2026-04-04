-- ─────────────────────────────────────────────────────────────────────────────
-- Migrace: nové sloupce pro přepracovaný formulář zvířete
-- Spustit v Supabase → SQL Editor
-- Bezpečné opakované spuštění díky IF NOT EXISTS
-- ─────────────────────────────────────────────────────────────────────────────

-- Zdravotní stav
ALTER TABLE animals ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'unknown'
  CHECK (health_status IN ('healthy','in_treatment','post_surgery','chronic','unknown'));

-- Původ zvířete
ALTER TABLE animals ADD COLUMN IF NOT EXISTS origin TEXT
  CHECK (origin IN ('municipal_capture','seized','found','surrendered','transferred','other'));

-- Datum příjmu
ALTER TABLE animals ADD COLUMN IF NOT EXISTS intake_date DATE DEFAULT CURRENT_DATE;

-- Věk v měsících (pro mláďata < 1 rok)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS age_months INTEGER;

-- Vztah k dospělým / cizím lidem (shelter)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS good_with_adults TEXT DEFAULT 'unknown'
  CHECK (good_with_adults IN ('friendly','shy','fearful','distrustful','unknown'));

-- Záchranná stanice — druh nálezu
ALTER TABLE animals ADD COLUMN IF NOT EXISTS rescue_find_type TEXT;

-- Záchranná stanice — prognóza
ALTER TABLE animals ADD COLUMN IF NOT EXISTS rescue_prognosis TEXT
  CHECK (rescue_prognosis IN ('release','permanent_handicap','unknown'));

-- Záchranná stanice — veřejný popis případu
ALTER TABLE animals ADD COLUMN IF NOT EXISTS rescue_public_description TEXT;

-- Příběh zvířete (shelter — zobrazí se na webu)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS story TEXT;

-- Požadavky na adoptéra (shelter)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS adopter_requirements TEXT;

-- Rozšíření adoption_status CHECK aby pokrylo i rescue statusy
-- (bezpečné jen pokud constraint existuje pod tímto názvem)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'animals_adoption_status_check'
  ) THEN
    ALTER TABLE animals DROP CONSTRAINT animals_adoption_status_check;
  END IF;
  ALTER TABLE animals ADD CONSTRAINT animals_adoption_status_check
    CHECK (adoption_status IN (
      'available','reserved','adopted','foster',
      'intake','treatment','rehabilitation','released','deceased'
    ));
END $$;

-- Index pro rychlé načítání podle data příjmu
CREATE INDEX IF NOT EXISTS idx_animals_intake_date ON animals (institution_id, intake_date DESC);
