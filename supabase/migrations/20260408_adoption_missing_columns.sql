-- Chybějící sloupce v adoption_applications
-- application_message: zpráva žadatele pro útulek
-- meeting_at: potvrzený termín schůzky (žadatel vybere z navrhovaných)

ALTER TABLE adoption_applications
  ADD COLUMN IF NOT EXISTS application_message TEXT,
  ADD COLUMN IF NOT EXISTS meeting_at TIMESTAMPTZ;
