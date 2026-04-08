-- Add meeting_options (proposed dates from admin) and institution_note (shown in emails) to adoption_applications
ALTER TABLE adoption_applications
  ADD COLUMN IF NOT EXISTS meeting_options JSONB,
  ADD COLUMN IF NOT EXISTS institution_note TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
