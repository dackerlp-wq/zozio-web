-- Přidání cancel_token pro zrušení žádosti bez přihlášení (odkaz v emailu)
-- Slouží i jako sdílený token pro potvrzení termínu schůzky

ALTER TABLE adoption_applications
  ADD COLUMN IF NOT EXISTS cancel_token UUID DEFAULT gen_random_uuid();

-- Unikátní index pro rychlé vyhledávání podle tokenu
CREATE UNIQUE INDEX IF NOT EXISTS idx_adoption_applications_cancel_token
  ON adoption_applications(cancel_token)
  WHERE cancel_token IS NOT NULL;

-- Zajisti, že existující záznamy mají token
UPDATE adoption_applications
  SET cancel_token = gen_random_uuid()
  WHERE cancel_token IS NULL;
