ALTER TABLE animals ADD COLUMN IF NOT EXISTS not_for_adoption_reason TEXT
  CHECK (not_for_adoption_reason IS NULL OR not_for_adoption_reason IN (
    'owner_unresolved', 'behavior', 'legal', 'health', 'protected_species', 'other'
  ));
