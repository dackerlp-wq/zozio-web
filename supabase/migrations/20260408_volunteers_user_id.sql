-- Volunteers: propojení s Supabase auth uživatelem
-- + strukturovaná dostupnost

-- Přidání user_id (nullable pro zpětnou kompatibilitu — starší záznamy bez účtu)
ALTER TABLE volunteers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Přidání availability jako JSONB { days: string[], frequency: string }
ALTER TABLE volunteers
  ADD COLUMN IF NOT EXISTS availability_data JSONB;

-- Index pro rychlé načítání přihlášek konkrétního uživatele (profil stránka)
CREATE INDEX IF NOT EXISTS idx_volunteers_user_id
  ON volunteers (user_id);

-- Index pro vyhledávání institucí (search endpoint)
CREATE INDEX IF NOT EXISTS idx_institutions_name_search
  ON institutions USING gin(to_tsvector('simple', name));
