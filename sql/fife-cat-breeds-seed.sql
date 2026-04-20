-- ─────────────────────────────────────────────────────────────────────────────
-- FIFe plemena koček — rozšíření číselníku animal_breeds
-- Ukládá skupinu (I.–IV.) i neuznaná do sloupce fci_group (sdílený s psy).
-- Labely skupin rozlišuje UI podle druhu (FCI vs. FIFe).
-- Bezpečné opakované spuštění (IF NOT EXISTS, ON CONFLICT DO UPDATE).
-- ─────────────────────────────────────────────────────────────────────────────

-- Sloupce fci_group / original_name / official_abbreviation přidává už FCI seed
-- pro psy. Zde předpokládáme, že existují; pokud ne, přidá je tato migrace.
ALTER TABLE animal_breeds ADD COLUMN IF NOT EXISTS fci_group              TEXT;
ALTER TABLE animal_breeds ADD COLUMN IF NOT EXISTS original_name          TEXT;
ALTER TABLE animal_breeds ADD COLUMN IF NOT EXISTS official_abbreviation  TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_animal_breeds_species_name
  ON animal_breeds (species_id, name_cs);

-- Seed
DO $$
DECLARE
  cat_id UUID;
BEGIN
  SELECT id INTO cat_id
    FROM animal_species
   WHERE name_cs ILIKE '%kočk%' OR name_cs ILIKE '%kocka%'
   LIMIT 1;

  IF cat_id IS NULL THEN
    RAISE NOTICE 'Druh "kočka" nenalezen v animal_species, seed přeskočen.';
    RETURN;
  END IF;

  INSERT INTO animal_breeds (species_id, name_cs, fci_group) VALUES
  -- ── I. Perské a exotické kočky ────────────────────────────────────────────
  (cat_id, 'Perská kočka',                          'I'),
  (cat_id, 'Exotická kočka',                        'I'),

  -- ── II. Polodlouhosrsté kočky ─────────────────────────────────────────────
  (cat_id, 'Americký curl krátkosrstý',             'II'),
  (cat_id, 'Americký curl dlouhosrstý',             'II'),
  (cat_id, 'Birma',                                 'II'),
  (cat_id, 'La Perm',                               'II'),
  (cat_id, 'Mainská mývalí kočka',                  'II'),
  (cat_id, 'Něvská maškaráda',                      'II'),
  (cat_id, 'Norská lesní kočka',                    'II'),
  (cat_id, 'Ragdoll',                               'II'),
  (cat_id, 'Selkirk rex dlouhosrstý',               'II'),
  (cat_id, 'Selkirk rex krátkosrstý',               'II'),
  (cat_id, 'Sibiřská kočka',                        'II'),
  (cat_id, 'Turecká angora',                        'II'),
  (cat_id, 'Turecká van',                           'II'),

  -- ── III. Krátkosrsté a somálské kočky ─────────────────────────────────────
  (cat_id, 'Bengálská kočka',                       'III'),
  (cat_id, 'Britská kočka',                         'III'),
  (cat_id, 'Barmská kočka',                         'III'),
  (cat_id, 'Burmilla',                              'III'),
  (cat_id, 'Habešská kočka',                        'III'),
  (cat_id, 'Kartouzská kočka',                      'III'),
  (cat_id, 'Cornish rex',                           'III'),
  (cat_id, 'Devon rex',                             'III'),
  (cat_id, 'Donský sphynx',                         'III'),
  (cat_id, 'Egyptská mau',                          'III'),
  (cat_id, 'Evropská krátkosrstá kočka',            'III'),
  (cat_id, 'Německý rex',                           'III'),
  (cat_id, 'Japonský bobtail',                      'III'),
  (cat_id, 'Korat',                                 'III'),
  (cat_id, 'Kurilský bobtail dlouhosrstý',          'III'),
  (cat_id, 'Kurilský bobtail krátkosrstý',          'III'),
  (cat_id, 'Kymerská kočka',                        'III'),
  (cat_id, 'Manská kočka',                          'III'),
  (cat_id, 'Ocicat',                                'III'),
  (cat_id, 'Ruská modrá kočka',                     'III'),
  (cat_id, 'Snowshoe',                              'III'),
  (cat_id, 'Sokoke',                                'III'),
  (cat_id, 'Somálská kočka',                        'III'),
  (cat_id, 'Sphynx',                                'III'),
  (cat_id, 'Singapurská kočka',                     'III'),

  -- ── IV. Siamské a orientální kočky ────────────────────────────────────────
  (cat_id, 'Balinéská kočka',                       'IV'),
  (cat_id, 'Orientální kočka dlouhosrstá',          'IV'),
  (cat_id, 'Orientální kočka krátkosrstá',          'IV'),
  (cat_id, 'Peterbald',                             'IV'),
  (cat_id, 'Siamská kočka',                         'IV'),
  (cat_id, 'Seychelská kočka dlouhosrstá',          'IV'),
  (cat_id, 'Seychelská kočka krátkosrstá',          'IV'),
  (cat_id, 'Thajská kočka',                         'IV'),

  -- ── Neuznaná plemena FIFe ─────────────────────────────────────────────────
  (cat_id, 'Americký bobtail',                      'unrecognized'),
  (cat_id, 'Americká kočka krátkosrstá',            'unrecognized'),
  (cat_id, 'Americká kočka hrubosrstá',             'unrecognized'),
  (cat_id, 'Asijská kočka',                         'unrecognized'),
  (cat_id, 'Australská mist',                       'unrecognized'),
  (cat_id, 'Bombajská kočka',                       'unrecognized'),
  (cat_id, 'California spangled',                   'unrecognized'),
  (cat_id, 'Cejlonská kočka',                       'unrecognized'),
  (cat_id, 'Česká kadeřavá kočka',                  'unrecognized'),
  (cat_id, 'Munchkin',                              'unrecognized'),
  (cat_id, 'Nebelung',                              'unrecognized'),
  (cat_id, 'Pixiebob',                              'unrecognized'),
  (cat_id, 'Ragamuffin',                            'unrecognized'),
  (cat_id, 'Skotská klapouchá kočka',               'unrecognized'),
  (cat_id, 'Sterling',                              'unrecognized'),
  (cat_id, 'Tiffany',                               'unrecognized'),
  (cat_id, 'Tonkinská kočka',                       'unrecognized'),
  (cat_id, 'Ukrajinský levkoy',                     'unrecognized')

  ON CONFLICT (species_id, name_cs) DO UPDATE SET
    fci_group = EXCLUDED.fci_group;
END $$;
