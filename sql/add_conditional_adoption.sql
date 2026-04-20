-- Přidání nového adoption_status hodnoty 'conditional'
-- POZOR: nejdříve zjisti aktuální constraint název a drop/recreate
ALTER TABLE animals DROP CONSTRAINT IF EXISTS animals_adoption_status_check;
ALTER TABLE animals ADD CONSTRAINT animals_adoption_status_check
  CHECK (adoption_status IN (
    'intake', 'available', 'reserved', 'adopted', 'foster',
    'treatment', 'not_for_adoption', 'deceased', 'conditional'
  ));

-- Pole pro podmíněnou adopci
ALTER TABLE animals
  ADD COLUMN IF NOT EXISTS conditional_adopter_name    TEXT,
  ADD COLUMN IF NOT EXISTS conditional_adopter_phone   TEXT,
  ADD COLUMN IF NOT EXISTS conditional_adopter_email   TEXT,
  ADD COLUMN IF NOT EXISTS conditional_adoption_since  DATE,
  ADD COLUMN IF NOT EXISTS conditional_adoption_note   TEXT;
