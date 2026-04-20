-- ══════════════════════════════════════════════════════════════════════════
-- Zozio — Zákonné požadavky (§25b zák. 246/1992 Sb., Vyhl. 342/2012 Sb.,
--          §13 zák. 166/1999 Sb., §54 zák. 114/1992 Sb., VZ 255/2012 Sb.)
-- Migration: 20260411_legal_compliance
-- ══════════════════════════════════════════════════════════════════════════

-- ── Evidenční číslo (§25b zák. 246/1992 Sb.) ──────────────────────────────
ALTER TABLE animals ADD COLUMN IF NOT EXISTS evidence_number TEXT;

-- Auto-generate: ZOZ-YYYY-NNN (unique per institution per year)
CREATE SEQUENCE IF NOT EXISTS animals_evidence_seq;

-- ── Příjem — čas + pracovník ───────────────────────────────────────────────
ALTER TABLE animals ADD COLUMN IF NOT EXISTS intake_time        TIME;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS intake_worker      TEXT;

-- ── Nálezce / předávající (§25b odst. 2 zák. 246/1992 Sb.) ───────────────
ALTER TABLE animals ADD COLUMN IF NOT EXISTS intake_finder_name    TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS intake_finder_phone   TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS intake_finder_address TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS intake_finder_email   TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS intake_finder_id      TEXT; -- číslo OP

-- ── Karanténa (Vyhláška 342/2012 Sb.) ─────────────────────────────────────
ALTER TABLE animals ADD COLUMN IF NOT EXISTS quarantine_start  DATE;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS quarantine_end    DATE;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS quarantine_vet    TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS quarantine_result TEXT CHECK (
  quarantine_result IS NULL OR quarantine_result IN ('negative','positive','inconclusive')
);
ALTER TABLE animals ADD COLUMN IF NOT EXISTS quarantine_box    TEXT; -- číslo boxu

-- ── Identifikace — rozšíření (§13 zák. 166/1999 Sb.) ─────────────────────
ALTER TABLE animals ADD COLUMN IF NOT EXISTS chip_implanter    TEXT; -- kdo čipoval
ALTER TABLE animals ADD COLUMN IF NOT EXISTS chip_location     TEXT; -- místo vpichu
ALTER TABLE animals ADD COLUMN IF NOT EXISTS passport_issued   DATE;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS crz_registered    BOOLEAN DEFAULT FALSE;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS crz_reg_date      DATE;

-- ── Odchod ze zařízení ────────────────────────────────────────────────────
ALTER TABLE animals ADD COLUMN IF NOT EXISTS exit_type         TEXT CHECK (
  exit_type IS NULL OR exit_type IN ('adopted','returned','transferred','deceased','escaped')
);
ALTER TABLE animals ADD COLUMN IF NOT EXISTS exit_date         DATE;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS exit_notes        TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS exit_worker       TEXT; -- kdo propustil

-- ── Adoptér (§25b odst. 4 zák. 246/1992 Sb.) ─────────────────────────────
ALTER TABLE animals ADD COLUMN IF NOT EXISTS adopter_name          TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS adopter_address       TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS adopter_phone         TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS adopter_email         TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS adopter_id_number     TEXT; -- číslo OP/pasu
ALTER TABLE animals ADD COLUMN IF NOT EXISTS adoption_contract_num TEXT; -- číslo smlouvy
ALTER TABLE animals ADD COLUMN IF NOT EXISTS adoption_date         DATE;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS adoption_fee          NUMERIC(10,2) DEFAULT 0;

-- ── Uhynutí / eutanazie (VZ 255/2012 Sb.) ─────────────────────────────────
ALTER TABLE animals ADD COLUMN IF NOT EXISTS death_date            DATE;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS death_type            TEXT CHECK (
  death_type IS NULL OR death_type IN ('natural','euthanasia','accident','unknown')
);
ALTER TABLE animals ADD COLUMN IF NOT EXISTS death_cause           TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS death_vet             TEXT; -- veterinář
ALTER TABLE animals ADD COLUMN IF NOT EXISTS disposal_method       TEXT CHECK (
  disposal_method IS NULL OR disposal_method IN (
    'incineration','composting','burial','rendering','other'
  )
);
ALTER TABLE animals ADD COLUMN IF NOT EXISTS disposal_doc_number   TEXT; -- číslo dokladu
ALTER TABLE animals ADD COLUMN IF NOT EXISTS disposal_company      TEXT; -- firma

-- ── Přemístění ────────────────────────────────────────────────────────────
ALTER TABLE animals ADD COLUMN IF NOT EXISTS transfer_institution  TEXT; -- kam přemístěno
ALTER TABLE animals ADD COLUMN IF NOT EXISTS transfer_date         DATE;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS transfer_doc_number   TEXT;

-- ══════════════════════════════════════════════════════════════════════════
-- Funkce pro auto-generaci evidenčního čísla
-- Formát: ZOZ-RRRR-NNNN (dle roku příjmu, sekvenční v rámci instituce)
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION generate_evidence_number(
  p_institution_id UUID,
  p_year INT DEFAULT EXTRACT(YEAR FROM NOW())::INT
) RETURNS TEXT AS $$
DECLARE
  v_count INT;
  v_number TEXT;
BEGIN
  SELECT COUNT(*) + 1
    INTO v_count
    FROM animals
   WHERE institution_id = p_institution_id
     AND EXTRACT(YEAR FROM COALESCE(intake_date, created_at)) = p_year;

  v_number := 'ZOZ-' || p_year || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════════════════
-- Trigger: automaticky přiřadit evidenční číslo při vložení
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION set_evidence_number() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.evidence_number IS NULL OR NEW.evidence_number = '' THEN
    NEW.evidence_number := generate_evidence_number(
      NEW.institution_id,
      EXTRACT(YEAR FROM COALESCE(NEW.intake_date, NOW()))::INT
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_evidence_number ON animals;
CREATE TRIGGER trg_set_evidence_number
  BEFORE INSERT ON animals
  FOR EACH ROW EXECUTE FUNCTION set_evidence_number();

-- ══════════════════════════════════════════════════════════════════════════
-- Index pro rychlé vyhledání dle evidenčního čísla
-- ══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_animals_evidence_number
  ON animals (institution_id, evidence_number);
