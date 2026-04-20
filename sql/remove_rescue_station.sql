-- ============================================================
-- Migrace: Odstranění záchranných stanic z Zozio platformy
-- Datum:   2026-04-19
-- Popis:   Platforma bude nadále pouze pro útulky (shelters).
--          Tento skript odstraní vše co se týká rescue stanic.
--
-- POSTUP SPUŠTĚNÍ:
--   1. Nejdřív spusť sekci "1. Záloha" a zkontroluj data
--   2. Spusť sekce 2–7 postupně
--   3. Ověř integritu (sekce 8)
--
-- VAROVÁNÍ: Nevratná operace. Ujisti se, že máš zálohu DB!
-- ============================================================


-- ============================================================
-- 1. ZÁLOHA DAT (volitelné, před spuštěním zbytek)
-- ============================================================

-- Zkontroluj kolik rescue_station institucí existuje
SELECT id, name, type FROM institutions WHERE type = 'rescue_station';

-- Zkontroluj počet záchranných případů
SELECT COUNT(*) AS rescue_cases_count FROM rescue_cases;

-- Zkontroluj wild druhy
SELECT * FROM animal_species WHERE category = 'wild';


-- ============================================================
-- 2. ODSTRANĚNÍ TABULKY rescue_cases
-- ============================================================

-- Nejdřív odstraň foreign keys které odkazují na rescue_cases
ALTER TABLE fundraisers
  DROP COLUMN IF EXISTS rescue_case_id;

ALTER TABLE articles
  DROP COLUMN IF EXISTS rescue_case_id;

ALTER TABLE animal_status_history
  DROP COLUMN IF EXISTS rescue_case_id;

-- Smaž celou tabulku rescue_cases (včetně RLS policies a triggerů)
DROP TABLE IF EXISTS rescue_cases CASCADE;


-- ============================================================
-- 3. ODSTRANĚNÍ RESCUE SLOUPCŮ Z TABULKY animals
-- ============================================================

ALTER TABLE animals
  DROP COLUMN IF EXISTS rescue_find_type,
  DROP COLUMN IF EXISTS rescue_prognosis,
  DROP COLUMN IF EXISTS rescue_public_description;


-- ============================================================
-- 4. OPRAVA ENUMU institution type
-- ============================================================

-- Pokud používáš CHECK constraint (ne PostgreSQL ENUM typ):
-- ALTER TABLE institutions
--   DROP CONSTRAINT IF EXISTS institutions_type_check;
-- ALTER TABLE institutions
--   ADD CONSTRAINT institutions_type_check CHECK (type = 'shelter');

-- Pokud používáš PostgreSQL ENUM typ:
-- (Postgres neumí odebrat hodnotu z ENUM, ale lze přejmenovat nebo nahradit)
-- Alternativa: přejdi na TEXT s CHECK:
--
-- ALTER TABLE institutions
--   ALTER COLUMN type TYPE TEXT;
-- UPDATE institutions SET type = 'shelter' WHERE type = 'rescue_station';
-- ALTER TABLE institutions
--   ADD CONSTRAINT institutions_type_check CHECK (type IN ('shelter'));

-- Pokud je type jen TEXT bez enumu:
UPDATE institutions
  SET type = 'shelter'
  WHERE type = 'rescue_station';


-- ============================================================
-- 5. OPRAVA article_categories ENUMU
-- ============================================================

-- Odeber kategorii 'rescue' z článků (nastav na NULL nebo 'news')
UPDATE articles
  SET category = NULL
  WHERE category = 'rescue';

-- Pokud máš ENUM typ pro category:
-- Postgres neumí přímo odebrat ENUM hodnotu, ale hodnota přestane být používána.
-- Zvažit přechod na TEXT + CHECK constraint v budoucí migraci.


-- ============================================================
-- 6. WILD DRUHY ZVÍŘAT
-- ============================================================

-- Zkontroluj jestli jsou wild druhy napojeny na nějaká zvířata
SELECT s.id, s.name_cs, COUNT(a.id) AS animal_count
FROM animal_species s
LEFT JOIN animals a ON a.species_id = s.id
WHERE s.category = 'wild'
GROUP BY s.id, s.name_cs;

-- Pokud jsou animal_count = 0, smaž je:
DELETE FROM animal_species WHERE category = 'wild';

-- Pokud category sloupec má ENUM, odeber 'wild' (nebo nech být — nebude se používat):
-- ALTER TYPE animal_species_category_enum RENAME VALUE 'wild' TO 'deprecated_wild';
-- Nebo prostě nech 'wild' v enumu — nezpůsobí to problémy.


-- ============================================================
-- 7. ODSTRANĚNÍ RLS POLICIES PRO rescue_cases
-- ============================================================
-- (Automaticky smazány CASCADE při DROP TABLE rescue_cases výše)
-- Pokud existují separátní policies na jiných tabulkách:

DROP POLICY IF EXISTS "rescue_cases_select" ON rescue_cases;
DROP POLICY IF EXISTS "rescue_cases_insert" ON rescue_cases;
DROP POLICY IF EXISTS "rescue_cases_update" ON rescue_cases;
DROP POLICY IF EXISTS "rescue_cases_delete" ON rescue_cases;


-- ============================================================
-- 8. OVĚŘENÍ INTEGRITY
-- ============================================================

-- Zkontroluj žádné rescue reference nezůstaly
SELECT COUNT(*) AS should_be_zero
FROM institutions
WHERE type = 'rescue_station';

SELECT COUNT(*) AS should_be_zero
FROM articles
WHERE category = 'rescue';

-- Ověř sloupce na animals
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'animals'
  AND column_name IN ('rescue_find_type', 'rescue_prognosis', 'rescue_public_description');
-- Výsledek by měl být prázdný

-- Ověř sloupce na fundraisers
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'fundraisers'
  AND column_name = 'rescue_case_id';
-- Výsledek by měl být prázdný

-- Ověř že rescue_cases tabulka neexistuje
SELECT to_regclass('public.rescue_cases');
-- Výsledek by měl být NULL
