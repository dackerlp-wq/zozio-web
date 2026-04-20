-- ──────────────────────────────────────────────────────────────────────────
-- Zozio Ads — rozšířené statistiky v2
-- Spustit v Supabase SQL Editoru
-- ──────────────────────────────────────────────────────────────────────────

-- 1. Statistiky podle slotu (pro detail reklamy)
CREATE OR REPLACE VIEW ad_slot_stats AS
SELECT
  ad_id,
  slot,
  COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
  COUNT(*) FILTER (WHERE event_type = 'click')      AS clicks
FROM ad_events
GROUP BY ad_id, slot;

-- 2. Statistiky podle dne v týdnu (0=Ne, 1=Po, ..., 6=So)
CREATE OR REPLACE VIEW ad_weekday_stats AS
SELECT
  ad_id,
  EXTRACT(DOW FROM created_at AT TIME ZONE 'Europe/Prague')::int AS weekday,
  COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
  COUNT(*) FILTER (WHERE event_type = 'click')      AS clicks
FROM ad_events
GROUP BY ad_id, EXTRACT(DOW FROM created_at AT TIME ZONE 'Europe/Prague')::int;

-- 3. Agregovaná denní statistika přes VŠECHNY sloty firmy (pro dashboard)
--    Použití: .in('ad_id', companyAdIds).gte('day', ...)
--    (tato view ad_daily_stats již existuje — pouze připomínka)

-- 4. Grant pro service_role (pokud chybí)
GRANT SELECT ON ad_slot_stats   TO service_role;
GRANT SELECT ON ad_weekday_stats TO service_role;
