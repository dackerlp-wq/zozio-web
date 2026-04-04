-- Widget fields migration
-- Adds legally required intake fields to animals table + adopted_at timestamp

-- ── New columns on animals ────────────────────────────────────────────────────

-- Datum nálezu / příjmu (zákonná povinnost § 25 odst. 4 zák. 246/1992 Sb.)
ALTER TABLE animals
  ADD COLUMN IF NOT EXISTS found_date DATE;

-- Místo nálezu / příjmu (zákonná povinnost)
ALTER TABLE animals
  ADD COLUMN IF NOT EXISTS found_location TEXT;

-- Datum předání novému chovateli (adopce / odchod)
ALTER TABLE animals
  ADD COLUMN IF NOT EXISTS adopted_at TIMESTAMPTZ;

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Composite index for widget queries (institution + status)
CREATE INDEX IF NOT EXISTS idx_animals_institution_status
  ON animals (institution_id, adoption_status);

-- Index for "recently adopted" widget sorting
CREATE INDEX IF NOT EXISTS idx_animals_adopted_at
  ON animals (adopted_at DESC NULLS LAST);

-- ── Auto-set adopted_at via trigger ──────────────────────────────────────────
-- When adoption_status changes to 'adopted', record the timestamp automatically.

CREATE OR REPLACE FUNCTION set_adopted_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.adoption_status = 'adopted' AND
     (OLD.adoption_status IS DISTINCT FROM 'adopted') AND
     NEW.adopted_at IS NULL
  THEN
    NEW.adopted_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_adopted_at ON animals;
CREATE TRIGGER trg_set_adopted_at
  BEFORE UPDATE ON animals
  FOR EACH ROW
  EXECUTE FUNCTION set_adopted_at();
