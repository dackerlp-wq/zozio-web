-- ─────────────────────────────────────────────────────────────────────────────
-- Migrace: tabulka plemen + strukturované záznamy očkování a léků
-- Spustit v Supabase → SQL Editor
-- Bezpečné opakované spuštění díky IF NOT EXISTS / DO $$ BEGIN
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Tabulka plemen (animal_breeds) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS animal_breeds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id      UUID NOT NULL REFERENCES animal_species(id) ON DELETE CASCADE,
  name_cs         TEXT NOT NULL,
  name_sk         TEXT,
  origin_country  TEXT,
  size_category   TEXT CHECK (size_category IN ('small','medium','large','xlarge')),
  energy_level    TEXT CHECK (energy_level IN ('low','medium','high','very_high')),
  hypoallergenic  BOOLEAN DEFAULT false,
  description     TEXT,
  institution_id  UUID REFERENCES institutions(id) ON DELETE SET NULL,
  is_custom       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_animal_breeds_species ON animal_breeds (species_id);
CREATE INDEX IF NOT EXISTS idx_animal_breeds_institution ON animal_breeds (institution_id) WHERE institution_id IS NOT NULL;

-- RLS
ALTER TABLE animal_breeds ENABLE ROW LEVEL SECURITY;

-- Policies (bezpečné opakování přes DO $$)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='animal_breeds' AND policyname='breeds_select') THEN
    CREATE POLICY "breeds_select" ON animal_breeds
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='animal_breeds' AND policyname='breeds_insert') THEN
    CREATE POLICY "breeds_insert" ON animal_breeds
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='animal_breeds' AND policyname='breeds_update') THEN
    CREATE POLICY "breeds_update" ON animal_breeds
      FOR UPDATE USING (
        institution_id IS NULL
        OR institution_id IN (
          SELECT institution_id FROM institution_members WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='animal_breeds' AND policyname='breeds_delete') THEN
    CREATE POLICY "breeds_delete" ON animal_breeds
      FOR DELETE USING (
        institution_id IS NULL
        OR institution_id IN (
          SELECT institution_id FROM institution_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── 2. Strukturovaná data na tabulce animals ──────────────────────────────────

-- Záznamy očkování: [{type, label, last_date}]
ALTER TABLE animals ADD COLUMN IF NOT EXISTS vaccination_records JSONB DEFAULT '[]'::jsonb;

-- Léky (strukturované): [{name, dosage, frequency}]
ALTER TABLE animals ADD COLUMN IF NOT EXISTS medications_data JSONB DEFAULT '[]'::jsonb;

-- ID plemene (odkaz na animal_breeds)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS breed_id UUID REFERENCES animal_breeds(id) ON DELETE SET NULL;

-- Vlastní plemeno (text, pokud není v číselníku)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS breed_custom TEXT;

-- ── 3. Seed: základní česká/slovenská plemena psů ─────────────────────────────
-- Spustit jen jednou — ošetřeno přes ON CONFLICT

DO $$
DECLARE
  dog_id UUID;
  cat_id UUID;
BEGIN
  SELECT id INTO dog_id FROM animal_species WHERE name_cs ILIKE '%pes%' OR name_cs ILIKE '%psi%' LIMIT 1;
  SELECT id INTO cat_id FROM animal_species WHERE name_cs ILIKE '%kočk%' LIMIT 1;

  IF dog_id IS NOT NULL THEN
    INSERT INTO animal_breeds (species_id, name_cs, size_category, energy_level, is_custom)
    VALUES
      (dog_id, 'Bez plemene / kříženec', NULL, NULL, false),
      (dog_id, 'Německý ovčák', 'large', 'high', false),
      (dog_id, 'Labrador retrievér', 'large', 'high', false),
      (dog_id, 'Zlatý retrievér', 'large', 'medium', false),
      (dog_id, 'Buldok', 'medium', 'low', false),
      (dog_id, 'Pudl', 'small', 'medium', false),
      (dog_id, 'Čivava', 'small', 'medium', false),
      (dog_id, 'Rotvajler', 'large', 'medium', false),
      (dog_id, 'Yorkshire teriér', 'small', 'medium', false),
      (dog_id, 'Boxer', 'large', 'high', false),
      (dog_id, 'Husky', 'large', 'very_high', false),
      (dog_id, 'Bígl', 'medium', 'high', false),
      (dog_id, 'Dachshund (jezevčík)', 'small', 'medium', false),
      (dog_id, 'Bišonek', 'small', 'medium', false),
      (dog_id, 'Shih tzu', 'small', 'low', false),
      (dog_id, 'Australský ovčák', 'medium', 'very_high', false),
      (dog_id, 'Border kolie', 'medium', 'very_high', false),
      (dog_id, 'Malinois', 'medium', 'very_high', false),
      (dog_id, 'Dalmatin', 'large', 'very_high', false),
      (dog_id, 'Cocker španěl', 'medium', 'medium', false),
      (dog_id, 'Špicl', 'small', 'medium', false),
      (dog_id, 'Dobrman', 'large', 'high', false),
      (dog_id, 'Americký pitbul teriér', 'medium', 'high', false),
      (dog_id, 'Staffordshire bullteriér', 'medium', 'high', false),
      (dog_id, 'Jack Russell teriér', 'small', 'very_high', false),
      (dog_id, 'Maltézský psík', 'small', 'low', false),
      (dog_id, 'Cane corso', 'xlarge', 'medium', false),
      (dog_id, 'Irský setr', 'large', 'very_high', false),
      (dog_id, 'Bernský salašnický pes', 'xlarge', 'medium', false),
      (dog_id, 'Novofundlandský pes', 'xlarge', 'low', false)
    ON CONFLICT DO NOTHING;
  END IF;

  IF cat_id IS NOT NULL THEN
    INSERT INTO animal_breeds (species_id, name_cs, size_category, energy_level, hypoallergenic, is_custom)
    VALUES
      (cat_id, 'Bez plemene / kříženec', NULL, NULL, false, false),
      (cat_id, 'Mainská mývalí kočka', 'large', 'medium', false, false),
      (cat_id, 'Perská kočka', 'medium', 'low', false, false),
      (cat_id, 'Britská krátkosrstá', 'medium', 'low', false, false),
      (cat_id, 'Ragdoll', 'large', 'low', false, false),
      (cat_id, 'Siamská kočka', 'medium', 'high', false, false),
      (cat_id, 'Norská lesní kočka', 'large', 'medium', false, false),
      (cat_id, 'Ruská modrá', 'medium', 'medium', false, false),
      (cat_id, 'Bengálská kočka', 'medium', 'very_high', false, false),
      (cat_id, 'Sphynx', 'medium', 'high', true, false),
      (cat_id, 'Abyssinská kočka', 'medium', 'very_high', false, false),
      (cat_id, 'Skotská přivěska', 'medium', 'low', false, false),
      (cat_id, 'Burmská kočka', 'medium', 'high', false, false),
      (cat_id, 'Orientální kočka', 'medium', 'high', false, false),
      (cat_id, 'Exotická krátkosrstá', 'medium', 'low', false, false)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
