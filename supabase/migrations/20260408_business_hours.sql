ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS opening_hours_structured JSONB;
