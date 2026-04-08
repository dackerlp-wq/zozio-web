-- Přidá user_id do adoption_applications pro propojení s auth.users
ALTER TABLE adoption_applications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_adoption_applications_user_id ON adoption_applications(user_id);
