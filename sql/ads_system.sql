CREATE TABLE ads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Inzerent
  company_name  text NOT NULL,
  contact_email text,

  -- Kreativa
  logo_url      text,
  image_url     text,
  headline      text NOT NULL,
  description   text,
  cta_label     text NOT NULL DEFAULT 'Více info',
  cta_url       text NOT NULL,

  -- Zobrazení
  slots         text[] NOT NULL DEFAULT '{}',
  -- možné hodnoty: 'inline_grid' | 'sidebar' | 'banner_adopt' | 'banner_home' | 'banner_animal' | 'newsletter'

  -- Targeting
  target_species  uuid,   -- FK na animal_species.id, NULL = vše

  -- Trvání
  active_from   date NOT NULL,
  active_to     date NOT NULL,

  -- Tier & stav
  tier          text NOT NULL DEFAULT 'supporter',
  -- 'friend' | 'supporter' | 'partner' | 'main'
  active        boolean NOT NULL DEFAULT true,
  notes         text,   -- interní poznámka pro Dana

  -- Statistiky (agregované)
  impressions   bigint NOT NULL DEFAULT 0,
  clicks        bigint NOT NULL DEFAULT 0,

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index pro rychlé dotazy na aktivní reklamy
CREATE INDEX ads_active_slots_idx ON ads (active, active_from, active_to) WHERE active = true;

-- Tabulka pro detailní eventy (volitelná, pro budoucí analytics)
CREATE TABLE ad_events (
  id         bigserial PRIMARY KEY,
  ad_id      uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'impression' | 'click'
  slot       text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ad_events_ad_id_idx ON ad_events (ad_id, event_type, created_at);

-- RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads_public_read" ON ads FOR SELECT USING (true);
CREATE POLICY "ads_service_all" ON ads USING (true) WITH CHECK (true);

ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad_events_service_all" ON ad_events USING (true) WITH CHECK (true);
