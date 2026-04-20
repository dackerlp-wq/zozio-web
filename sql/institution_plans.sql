-- Migrace: systém předplatného pro instituce
-- Datum: 2026-04-19
-- Spustit v Supabase SQL editoru

-- 1. Přidat typ (pokud ještě neexistuje)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    CREATE TYPE subscription_plan AS ENUM ('free', 'standard', 'pro');
  END IF;
END $$;

-- 2. Přidat sloupce plan a plan_expires_at (pokud neexistují)
ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS plan subscription_plan NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz DEFAULT NULL;

-- 3. Výchozí hodnota pro existující záznamy (jsou už nastaveny přes DEFAULT)
-- Nic dalšího není potřeba.

-- 4. Index pro rychlé dotazy na plán
CREATE INDEX IF NOT EXISTS institutions_plan_idx ON institutions(plan);

-- 5. Ověření
SELECT id, name, plan, plan_expires_at FROM institutions ORDER BY created_at LIMIT 10;
