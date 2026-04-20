-- ─────────────────────────────────────────────────────────────────────────────
-- Adopční formulář — rozšíření o lokalitu, záložní péči, důvod a samostatnost
-- Bezpečné opakované spuštění (IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE adoption_applications
  ADD COLUMN IF NOT EXISTS applicant_city       TEXT,
  ADD COLUMN IF NOT EXISTS backup_caregiver     TEXT,
  ADD COLUMN IF NOT EXISTS purpose              TEXT,
  ADD COLUMN IF NOT EXISTS hours_alone_weekday  INTEGER,
  ADD COLUMN IF NOT EXISTS hours_alone_weekend  INTEGER;

-- Enum-like check pro důvod pořízení
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'adoption_applications_purpose_check'
  ) THEN
    ALTER TABLE adoption_applications
      ADD CONSTRAINT adoption_applications_purpose_check
      CHECK (purpose IS NULL OR purpose IN ('family', 'sport', 'guard', 'other'));
  END IF;
END $$;

-- Sanity range pro hodiny (0-24)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'adoption_applications_hours_weekday_check'
  ) THEN
    ALTER TABLE adoption_applications
      ADD CONSTRAINT adoption_applications_hours_weekday_check
      CHECK (hours_alone_weekday IS NULL OR (hours_alone_weekday >= 0 AND hours_alone_weekday <= 24));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'adoption_applications_hours_weekend_check'
  ) THEN
    ALTER TABLE adoption_applications
      ADD CONSTRAINT adoption_applications_hours_weekend_check
      CHECK (hours_alone_weekend IS NULL OR (hours_alone_weekend >= 0 AND hours_alone_weekend <= 24));
  END IF;
END $$;
