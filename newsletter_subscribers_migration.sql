-- Newsletter subscribers table
-- Run in Supabase SQL Editor before deploying the newsletter feature

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email              TEXT        NOT NULL,
  name               TEXT,
  institution_id     UUID        REFERENCES institutions(id) ON DELETE CASCADE,
  subscribed_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  unsubscribe_token  TEXT        UNIQUE DEFAULT gen_random_uuid()::text NOT NULL,

  -- NULL institution_id = Zozio global newsletter
  -- Non-null = institution-specific newsletter
  UNIQUE(email, institution_id)
);

-- Index pro rychlé vyhledání dle tokenu při odhlašování
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_token ON newsletter_subscribers(unsubscribe_token);

-- RLS: veřejné čtení zakázáno, zápisová práva přes service role (API routes)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Service role (API routes) může vše — bez policy = plný přístup jen pro service role
-- Anon/authed users nemají žádný přístup

-- Volitelně: superadmin může číst
CREATE POLICY "superadmin_read_newsletter_subscribers"
  ON newsletter_subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'superadmin'
    )
  );
