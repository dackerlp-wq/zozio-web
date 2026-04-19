-- Firemní profily inzerentů
CREATE TABLE ad_companies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name  text NOT NULL,
  contact_name  text,
  contact_email text NOT NULL,
  phone         text,
  website       text,
  ico           text,          -- IČO pro fakturaci
  billing_name  text,          -- fakturační jméno
  billing_address text,
  notes         text,          -- interní poznámka superadmina
  approved      boolean NOT NULL DEFAULT false,  -- Dan schvaluje firmu
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Přidat sloupce do ads
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES ad_companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  -- 'draft' | 'pending_review' | 'approved' | 'rejected' | 'paused'
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- View pro denní statistiky
CREATE OR REPLACE VIEW ad_daily_stats AS
SELECT
  ad_id,
  DATE(created_at) AS day,
  COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
  COUNT(*) FILTER (WHERE event_type = 'click')      AS clicks
FROM ad_events
GROUP BY ad_id, DATE(created_at);

-- RLS
ALTER TABLE ad_companies ENABLE ROW LEVEL SECURITY;
-- Firma vidí jen svoje záznamy
CREATE POLICY "company_own" ON ad_companies
  FOR ALL USING (auth.uid() = user_id);
-- Service role vše
CREATE POLICY "company_service" ON ad_companies
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Firma vidí jen svoje reklamy přes ad_companies
CREATE POLICY "ads_company_own" ON ads
  FOR ALL USING (
    company_id IN (SELECT id FROM ad_companies WHERE user_id = auth.uid())
  );
