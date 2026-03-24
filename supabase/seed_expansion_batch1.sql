-- =============================================================================
-- FitFlavor — Seed Expansion Batch 1: Mainstream US
-- Run AFTER seed.sql
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING
-- Brands:   b1000000-...-000000000011 → 000000000015
-- Products: a1000000-...-000000000021 → 000000000058
-- Flavors:  f1000000-...-000000000078 → 000000000172
-- =============================================================================

BEGIN;

-- =============================================================================
-- SECTION 1: New Brands
-- =============================================================================
INSERT INTO brands (id, name, slug) VALUES
  ('b1000000-0000-0000-0000-000000000011', 'Kaged',              'kaged'),
  ('b1000000-0000-0000-0000-000000000012', 'Optimum Nutrition',  'optimum-nutrition'),
  ('b1000000-0000-0000-0000-000000000013', 'BSN',                'bsn'),
  ('b1000000-0000-0000-0000-000000000014', 'MuscleTech',         'muscletech'),
  ('b1000000-0000-0000-0000-000000000015', 'MusclePharm',        'musclepharm')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 2: New Products
-- =============================================================================
INSERT INTO products (id, brand_id, category_id, name, slug, caffeine_mg, citrulline_g, beta_alanine_g, price_per_serving, servings_per_container, is_approved) VALUES

  -- ── Cellucor C4 line (brand b2) ──────────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000021', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'C4 Sport', 'cellucor-c4-sport', 135, 0, 1.6, 0.83, 60, true),
  ('a1000000-0000-0000-0000-000000000022', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'C4 Sport Ripped', 'cellucor-c4-sport-ripped', 135, 0, 1.6, 0.93, 30, true),
  ('a1000000-0000-0000-0000-000000000023', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'C4 Sport Strength', 'cellucor-c4-sport-strength', 135, 0, 1.6, 0.93, 30, true),
  ('a1000000-0000-0000-0000-000000000024', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'C4 Ultimate Shred', 'cellucor-c4-ultimate-shred', 300, 6.0, 3.2, 1.83, 20, true),
  ('a1000000-0000-0000-0000-000000000025', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'C4 Ultimate Strength', 'cellucor-c4-ultimate-strength', 300, 0, 3.2, 1.83, 20, true),
  ('a1000000-0000-0000-0000-000000000026', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'C4 Extreme', 'cellucor-c4-extreme', 200, 0, 3.2, 1.17, 30, true),
  ('a1000000-0000-0000-0000-000000000027', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'C4 Dynasty', 'cellucor-c4-dynasty', 300, 6.0, 3.2, 2.50, 20, true),
  ('a1000000-0000-0000-0000-000000000028', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'C4 Smart Energy', 'cellucor-c4-smart-energy', 200, 0, 0, 1.00, 30, true),

  -- ── Ghost (brand b3) ─────────────────────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000029', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001',
   'GHOST Legend All Out', 'ghost-legend-all-out', 300, 6.0, 3.2, 2.00, 20, true),
  ('a1000000-0000-0000-0000-000000000030', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001',
   'GHOST Pump', 'ghost-pump', 0, 7.0, 0, 1.50, 20, true),
  ('a1000000-0000-0000-0000-000000000031', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001',
   'GHOST Size', 'ghost-size', 0, 0, 3.2, 1.50, 30, true),

  -- ── Gorilla Mind (brand b5) ───────────────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000032', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001',
   'Gorilla Mode Base', 'gorilla-mind-gorilla-mode-base', 175, 6.0, 0, 1.25, 40, true),
  ('a1000000-0000-0000-0000-000000000033', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001',
   'Gorilla Mode Lightning', 'gorilla-mind-gorilla-mode-lightning', 350, 0, 0, 1.50, 40, true),

  -- ── Ryse Supps (brand b6) ─────────────────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000034', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001',
   'Ryse Loaded Pre', 'ryse-loaded-pre', 250, 4.5, 3.2, 1.50, 30, true),
  ('a1000000-0000-0000-0000-000000000035', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001',
   'Ryse Loaded Pre MAX', 'ryse-loaded-pre-max', 350, 8.0, 3.2, 2.00, 20, true),
  ('a1000000-0000-0000-0000-000000000036', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001',
   'Ryse Pump Daddy V2', 'ryse-pump-daddy-v2', 0, 8.0, 0, 1.50, 20, true),
  ('a1000000-0000-0000-0000-000000000037', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001',
   'Ryse Jay''s Half & Half Pre', 'ryse-jays-half-and-half', 150, 0, 0, 1.17, 30, true),
  ('a1000000-0000-0000-0000-000000000038', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001',
   'Ryse CEO Pre', 'ryse-ceo-pre', 200, 4.0, 3.2, 1.50, 30, true),

  -- ── Raw Nutrition / CBUM (brand b7) ──────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000039', 'b1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001',
   'Thuper Thavage', 'raw-thuper-thavage', 300, 8.0, 3.2, 2.00, 40, true),

  -- ── Bucked Up (brand b10) ─────────────────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000040', 'b1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001',
   'Woke AF Black', 'bucked-up-woke-af-black', 333, 6.0, 3.2, 2.00, 30, true),
  ('a1000000-0000-0000-0000-000000000041', 'b1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001',
   'Mother Bucker', 'bucked-up-mother-bucker', 400, 8.0, 3.2, 2.17, 30, true),
  ('a1000000-0000-0000-0000-000000000042', 'b1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001',
   'LFG Burn', 'bucked-up-lfg-burn', 200, 0, 1.6, 1.67, 30, true),
  ('a1000000-0000-0000-0000-000000000043', 'b1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001',
   'Bucked Up 100 Series', 'bucked-up-100-series', 100, 0, 0, 1.00, 30, true),
  ('a1000000-0000-0000-0000-000000000044', 'b1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001',
   'Bucked Up Non-Stim', 'bucked-up-non-stim', 0, 6.0, 3.2, 1.50, 30, true),
  ('a1000000-0000-0000-0000-000000000045', 'b1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001',
   'Bucked Up BLACK Series', 'bucked-up-black-series', 300, 6.0, 3.2, 1.83, 30, true),

  -- ── Kaged (brand b11) ─────────────────────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000046', 'b1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000001',
   'Pre-Kaged', 'kaged-pre-kaged', 274, 6.5, 1.6, 2.00, 20, true),
  ('a1000000-0000-0000-0000-000000000047', 'b1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000001',
   'Pre-Kaged Sport', 'kaged-pre-kaged-sport', 185, 0, 1.6, 1.17, 30, true),
  ('a1000000-0000-0000-0000-000000000048', 'b1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000001',
   'Pre-Kaged Stim-Free', 'kaged-pre-kaged-stim-free', 0, 6.5, 1.6, 1.67, 20, true),
  ('a1000000-0000-0000-0000-000000000049', 'b1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000001',
   'Pre-Workout Elite', 'kaged-pre-workout-elite', 300, 7.0, 3.2, 2.50, 20, true),
  ('a1000000-0000-0000-0000-000000000050', 'b1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000001',
   'Pre-Workout Elite Stim-Free', 'kaged-pre-workout-elite-stim-free', 0, 7.0, 3.2, 2.50, 20, true),

  -- ── Optimum Nutrition (brand b12) ─────────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000051', 'b1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000001',
   'Gold Standard Pre-Workout', 'on-gold-standard-pre', 175, 0, 1.5, 1.17, 30, true),
  ('a1000000-0000-0000-0000-000000000052', 'b1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000001',
   'Gold Standard Pre-Workout 2X', 'on-gold-standard-pre-2x', 350, 0, 3.0, 1.67, 20, true),
  ('a1000000-0000-0000-0000-000000000053', 'b1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000001',
   'Amino Energy', 'on-amino-energy', 100, 0, 0, 0.60, 30, true),

  -- ── BSN (brand b13) ───────────────────────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000054', 'b1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000001',
   'N.O.-XPLODE', 'bsn-no-xplode', 200, 0, 2.5, 1.33, 30, true),
  ('a1000000-0000-0000-0000-000000000055', 'b1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000001',
   'N.O.-XPLODE VASO', 'bsn-no-xplode-vaso', 200, 4.0, 0, 1.33, 30, true),

  -- ── MuscleTech (brand b14) ────────────────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000056', 'b1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000001',
   'VaporX5 Next Gen', 'muscletech-vaporx5', 200, 0, 1.6, 1.00, 30, true),
  ('a1000000-0000-0000-0000-000000000057', 'b1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000001',
   'Platinum Pre-Workout', 'muscletech-platinum-pre', 200, 0, 1.6, 0.83, 30, true),

  -- ── MusclePharm (brand b15) ───────────────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000058', 'b1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000001',
   'Assault Sport', 'musclepharm-assault-sport', 150, 0, 1.6, 0.83, 30, true)

ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 3: Region + Stim Type
-- =============================================================================
-- C4 Sport line (mainstream, widely available)
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000021'; -- C4 Sport
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000022'; -- C4 Sport Ripped
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000023'; -- C4 Sport Strength
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000024'; -- C4 Ultimate Shred
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000025'; -- C4 Ultimate Strength
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000026'; -- C4 Extreme
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000027'; -- C4 Dynasty
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000028'; -- C4 Smart Energy
-- Ghost
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000029'; -- Ghost Legend All Out
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim-free' WHERE id = 'a1000000-0000-0000-0000-000000000030'; -- Ghost Pump
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim-free' WHERE id = 'a1000000-0000-0000-0000-000000000031'; -- Ghost Size
-- Gorilla Mind
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000032'; -- Gorilla Mode Base
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000033'; -- Gorilla Mode Lightning
-- Ryse
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000034'; -- Loaded Pre
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000035'; -- Loaded Pre MAX
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim-free' WHERE id = 'a1000000-0000-0000-0000-000000000036'; -- Pump Daddy V2
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000037'; -- Jay's Half & Half
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000038'; -- CEO Pre
-- Raw Nutrition
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000039'; -- Thuper Thavage
-- Bucked Up
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000040'; -- Woke AF Black
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000041'; -- Mother Bucker
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000042'; -- LFG Burn
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000043'; -- 100 Series
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim-free' WHERE id = 'a1000000-0000-0000-0000-000000000044'; -- Non-Stim
UPDATE products SET region = ARRAY['US'],      stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000045'; -- BLACK Series
-- Kaged
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000046'; -- Pre-Kaged
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000047'; -- Pre-Kaged Sport
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim-free' WHERE id = 'a1000000-0000-0000-0000-000000000048'; -- Pre-Kaged Stim-Free
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000049'; -- Pre-Workout Elite
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim-free' WHERE id = 'a1000000-0000-0000-0000-000000000050'; -- Pre-Workout Elite SF
-- Optimum Nutrition
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000051'; -- Gold Standard Pre
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000052'; -- Gold Standard Pre 2X
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000053'; -- Amino Energy
-- BSN
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000054'; -- N.O.-XPLODE
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000055'; -- N.O.-XPLODE VASO
-- MuscleTech
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000056'; -- VaporX5
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000057'; -- Platinum Pre
-- MusclePharm
UPDATE products SET region = ARRAY['US','EU'], stim_type = 'stim'      WHERE id = 'a1000000-0000-0000-0000-000000000058'; -- Assault Sport

-- =============================================================================
-- SECTION 4: Flavors
-- =============================================================================
INSERT INTO flavors (id, product_id, name, slug) VALUES

  -- C4 Sport (a21)
  ('f1000000-0000-0000-0000-000000000078', 'a1000000-0000-0000-0000-000000000021', 'Blue Raspberry Ice',   'c4-sport-blue-raspberry-ice'),
  ('f1000000-0000-0000-0000-000000000079', 'a1000000-0000-0000-0000-000000000021', 'Watermelon',           'c4-sport-watermelon'),
  ('f1000000-0000-0000-0000-000000000080', 'a1000000-0000-0000-0000-000000000021', 'Fruit Punch',          'c4-sport-fruit-punch'),
  ('f1000000-0000-0000-0000-000000000081', 'a1000000-0000-0000-0000-000000000021', 'Orange',               'c4-sport-orange'),

  -- C4 Sport Ripped (a22)
  ('f1000000-0000-0000-0000-000000000082', 'a1000000-0000-0000-0000-000000000022', 'Blue Raspberry',       'c4-sport-ripped-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000083', 'a1000000-0000-0000-0000-000000000022', 'Strawberry Watermelon','c4-sport-ripped-strawberry-watermelon'),

  -- C4 Sport Strength (a23)
  ('f1000000-0000-0000-0000-000000000084', 'a1000000-0000-0000-0000-000000000023', 'Blue Raspberry',       'c4-sport-strength-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000085', 'a1000000-0000-0000-0000-000000000023', 'Tropical Burst',       'c4-sport-strength-tropical-burst'),

  -- C4 Ultimate Shred (a24)
  ('f1000000-0000-0000-0000-000000000086', 'a1000000-0000-0000-0000-000000000024', 'Arctic Snow Cone',     'c4-ultimate-shred-arctic-snow-cone'),
  ('f1000000-0000-0000-0000-000000000087', 'a1000000-0000-0000-0000-000000000024', 'Cherry Limeade',       'c4-ultimate-shred-cherry-limeade'),
  ('f1000000-0000-0000-0000-000000000088', 'a1000000-0000-0000-0000-000000000024', 'Orange Mango',         'c4-ultimate-shred-orange-mango'),

  -- C4 Ultimate Strength (a25)
  ('f1000000-0000-0000-0000-000000000089', 'a1000000-0000-0000-0000-000000000025', 'Blue Raspberry',       'c4-ultimate-strength-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000090', 'a1000000-0000-0000-0000-000000000025', 'Strawberry Watermelon','c4-ultimate-strength-strawberry-watermelon'),

  -- C4 Extreme (a26)
  ('f1000000-0000-0000-0000-000000000091', 'a1000000-0000-0000-0000-000000000026', 'Blue Raspberry',       'c4-extreme-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000092', 'a1000000-0000-0000-0000-000000000026', 'Icy Blue Razz',        'c4-extreme-icy-blue-razz'),
  ('f1000000-0000-0000-0000-000000000093', 'a1000000-0000-0000-0000-000000000026', 'Strawberry Margarita', 'c4-extreme-strawberry-margarita'),

  -- C4 Dynasty (a27)
  ('f1000000-0000-0000-0000-000000000094', 'a1000000-0000-0000-0000-000000000027', 'Blue Raspberry',       'c4-dynasty-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000095', 'a1000000-0000-0000-0000-000000000027', 'Watermelon',           'c4-dynasty-watermelon'),
  ('f1000000-0000-0000-0000-000000000096', 'a1000000-0000-0000-0000-000000000027', 'Pink Lemonade',        'c4-dynasty-pink-lemonade'),

  -- C4 Smart Energy (a28)
  ('f1000000-0000-0000-0000-000000000097', 'a1000000-0000-0000-0000-000000000028', 'Cherry Lime',          'c4-smart-energy-cherry-lime'),
  ('f1000000-0000-0000-0000-000000000098', 'a1000000-0000-0000-0000-000000000028', 'Strawberry Watermelon','c4-smart-energy-strawberry-watermelon'),

  -- GHOST Legend All Out (a29)
  ('f1000000-0000-0000-0000-000000000099', 'a1000000-0000-0000-0000-000000000029', 'Sour Strips Redberry',  'ghost-legend-all-out-sour-strips-redberry'),
  ('f1000000-0000-0000-0000-000000000100', 'a1000000-0000-0000-0000-000000000029', 'Welchs Grape',          'ghost-legend-all-out-welchs-grape'),
  ('f1000000-0000-0000-0000-000000000101', 'a1000000-0000-0000-0000-000000000029', 'Peach',                 'ghost-legend-all-out-peach'),

  -- GHOST Pump (a30)
  ('f1000000-0000-0000-0000-000000000102', 'a1000000-0000-0000-0000-000000000030', 'Blue Raspberry',        'ghost-pump-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000103', 'a1000000-0000-0000-0000-000000000030', 'Warheads Sour Watermelon','ghost-pump-warheads-sour-watermelon'),
  ('f1000000-0000-0000-0000-000000000104', 'a1000000-0000-0000-0000-000000000030', 'Peach',                 'ghost-pump-peach'),

  -- GHOST Size (a31)
  ('f1000000-0000-0000-0000-000000000105', 'a1000000-0000-0000-0000-000000000031', 'Lemon Crush',           'ghost-size-lemon-crush'),
  ('f1000000-0000-0000-0000-000000000106', 'a1000000-0000-0000-0000-000000000031', 'Tropical Mango',        'ghost-size-tropical-mango'),

  -- Gorilla Mode Base (a32)
  ('f1000000-0000-0000-0000-000000000107', 'a1000000-0000-0000-0000-000000000032', 'Mango Peach',           'gorilla-mode-base-mango-peach'),
  ('f1000000-0000-0000-0000-000000000108', 'a1000000-0000-0000-0000-000000000032', 'Watermelon',            'gorilla-mode-base-watermelon'),
  ('f1000000-0000-0000-0000-000000000109', 'a1000000-0000-0000-0000-000000000032', 'Strawberry Kiwi',       'gorilla-mode-base-strawberry-kiwi'),

  -- Gorilla Mode Lightning (a33)
  ('f1000000-0000-0000-0000-000000000110', 'a1000000-0000-0000-0000-000000000033', 'Tiger''s Blood',        'gorilla-mode-lightning-tigers-blood'),
  ('f1000000-0000-0000-0000-000000000111', 'a1000000-0000-0000-0000-000000000033', 'Mango Peach',           'gorilla-mode-lightning-mango-peach'),

  -- Ryse Loaded Pre (a34)
  ('f1000000-0000-0000-0000-000000000112', 'a1000000-0000-0000-0000-000000000034', 'Kool-Aid Tropical Punch','ryse-loaded-pre-koolaid-tropical'),
  ('f1000000-0000-0000-0000-000000000113', 'a1000000-0000-0000-0000-000000000034', 'Smarties',              'ryse-loaded-pre-smarties'),
  ('f1000000-0000-0000-0000-000000000114', 'a1000000-0000-0000-0000-000000000034', 'Strawberry Kiwi',       'ryse-loaded-pre-strawberry-kiwi'),

  -- Ryse Loaded Pre MAX (a35)
  ('f1000000-0000-0000-0000-000000000115', 'a1000000-0000-0000-0000-000000000035', 'Blue Raspberry',        'ryse-loaded-pre-max-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000116', 'a1000000-0000-0000-0000-000000000035', 'Watermelon',            'ryse-loaded-pre-max-watermelon'),

  -- Ryse Pump Daddy V2 (a36)
  ('f1000000-0000-0000-0000-000000000117', 'a1000000-0000-0000-0000-000000000036', 'Blackberry Lemonade',   'ryse-pump-daddy-v2-blackberry-lemonade'),
  ('f1000000-0000-0000-0000-000000000118', 'a1000000-0000-0000-0000-000000000036', 'Strawberry Kiwi',       'ryse-pump-daddy-v2-strawberry-kiwi'),

  -- Ryse Jay's Half & Half (a37)
  ('f1000000-0000-0000-0000-000000000119', 'a1000000-0000-0000-0000-000000000037', 'Arnold Palmer',         'ryse-jays-half-arnold-palmer'),
  ('f1000000-0000-0000-0000-000000000120', 'a1000000-0000-0000-0000-000000000037', 'Strawberry Lemonade',   'ryse-jays-half-strawberry-lemonade'),

  -- Ryse CEO Pre (a38)
  ('f1000000-0000-0000-0000-000000000121', 'a1000000-0000-0000-0000-000000000038', 'Blue Raspberry',        'ryse-ceo-pre-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000122', 'a1000000-0000-0000-0000-000000000038', 'Watermelon',            'ryse-ceo-pre-watermelon'),

  -- Thuper Thavage (a39)
  ('f1000000-0000-0000-0000-000000000123', 'a1000000-0000-0000-0000-000000000039', 'Cherry Berry',          'thuper-thavage-cherry-berry'),
  ('f1000000-0000-0000-0000-000000000124', 'a1000000-0000-0000-0000-000000000039', 'Strawberry Mango',      'thuper-thavage-strawberry-mango'),
  ('f1000000-0000-0000-0000-000000000125', 'a1000000-0000-0000-0000-000000000039', 'Blue Raspberry',        'thuper-thavage-blue-raspberry'),

  -- Woke AF Black (a40)
  ('f1000000-0000-0000-0000-000000000126', 'a1000000-0000-0000-0000-000000000040', 'Blood Raz',             'woke-af-black-blood-raz'),
  ('f1000000-0000-0000-0000-000000000127', 'a1000000-0000-0000-0000-000000000040', 'Grape Gainz',           'woke-af-black-grape-gainz'),
  ('f1000000-0000-0000-0000-000000000128', 'a1000000-0000-0000-0000-000000000040', 'Miami',                 'woke-af-black-miami'),

  -- Mother Bucker (a41)
  ('f1000000-0000-0000-0000-000000000129', 'a1000000-0000-0000-0000-000000000041', 'Blood Raz',             'mother-bucker-blood-raz'),
  ('f1000000-0000-0000-0000-000000000130', 'a1000000-0000-0000-0000-000000000041', 'Killa OJ',              'mother-bucker-killa-oj'),
  ('f1000000-0000-0000-0000-000000000131', 'a1000000-0000-0000-0000-000000000041', 'Watermelon',            'mother-bucker-watermelon'),

  -- LFG Burn (a42)
  ('f1000000-0000-0000-0000-000000000132', 'a1000000-0000-0000-0000-000000000042', 'Blue Raz',              'lfg-burn-blue-raz'),
  ('f1000000-0000-0000-0000-000000000133', 'a1000000-0000-0000-0000-000000000042', 'Watermelon',            'lfg-burn-watermelon'),

  -- Bucked Up 100 Series (a43)
  ('f1000000-0000-0000-0000-000000000134', 'a1000000-0000-0000-0000-000000000043', 'Blue Raspberry',        'bucked-up-100-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000135', 'a1000000-0000-0000-0000-000000000043', 'Strawberry Kiwi',       'bucked-up-100-strawberry-kiwi'),

  -- Bucked Up Non-Stim (a44)
  ('f1000000-0000-0000-0000-000000000136', 'a1000000-0000-0000-0000-000000000044', 'Blue Raz',              'bucked-up-non-stim-blue-raz'),
  ('f1000000-0000-0000-0000-000000000137', 'a1000000-0000-0000-0000-000000000044', 'Pink Lemonade',         'bucked-up-non-stim-pink-lemonade'),

  -- Bucked Up BLACK Series (a45)
  ('f1000000-0000-0000-0000-000000000138', 'a1000000-0000-0000-0000-000000000045', 'Blood Raz',             'bucked-up-black-blood-raz'),
  ('f1000000-0000-0000-0000-000000000139', 'a1000000-0000-0000-0000-000000000045', 'Grape',                 'bucked-up-black-grape'),

  -- Pre-Kaged (a46)
  ('f1000000-0000-0000-0000-000000000140', 'a1000000-0000-0000-0000-000000000046', 'Berry Blast',           'kaged-pre-kaged-berry-blast'),
  ('f1000000-0000-0000-0000-000000000141', 'a1000000-0000-0000-0000-000000000046', 'Fruit Punch',           'kaged-pre-kaged-fruit-punch'),
  ('f1000000-0000-0000-0000-000000000142', 'a1000000-0000-0000-0000-000000000046', 'Pink Lemonade',         'kaged-pre-kaged-pink-lemonade'),

  -- Pre-Kaged Sport (a47)
  ('f1000000-0000-0000-0000-000000000143', 'a1000000-0000-0000-0000-000000000047', 'Orange Krush',          'kaged-pre-kaged-sport-orange-krush'),
  ('f1000000-0000-0000-0000-000000000144', 'a1000000-0000-0000-0000-000000000047', 'Strawberry Lemonade',   'kaged-pre-kaged-sport-strawberry-lemonade'),

  -- Pre-Kaged Stim-Free (a48)
  ('f1000000-0000-0000-0000-000000000145', 'a1000000-0000-0000-0000-000000000048', 'Berry Blast',           'kaged-pre-kaged-sf-berry-blast'),
  ('f1000000-0000-0000-0000-000000000146', 'a1000000-0000-0000-0000-000000000048', 'Fruit Punch',           'kaged-pre-kaged-sf-fruit-punch'),

  -- Pre-Workout Elite (a49)
  ('f1000000-0000-0000-0000-000000000147', 'a1000000-0000-0000-0000-000000000049', 'Cherry Limeade',        'kaged-elite-cherry-limeade'),
  ('f1000000-0000-0000-0000-000000000148', 'a1000000-0000-0000-0000-000000000049', 'Tropical Fruit Punch',  'kaged-elite-tropical-fruit-punch'),
  ('f1000000-0000-0000-0000-000000000149', 'a1000000-0000-0000-0000-000000000049', 'Orange Krush',          'kaged-elite-orange-krush'),

  -- Pre-Workout Elite Stim-Free (a50)
  ('f1000000-0000-0000-0000-000000000150', 'a1000000-0000-0000-0000-000000000050', 'Fruit Punch',           'kaged-elite-sf-fruit-punch'),
  ('f1000000-0000-0000-0000-000000000151', 'a1000000-0000-0000-0000-000000000050', 'Cherry Limeade',        'kaged-elite-sf-cherry-limeade'),

  -- Gold Standard Pre (a51)
  ('f1000000-0000-0000-0000-000000000152', 'a1000000-0000-0000-0000-000000000051', 'Fruit Punch',           'on-gold-pre-fruit-punch'),
  ('f1000000-0000-0000-0000-000000000153', 'a1000000-0000-0000-0000-000000000051', 'Green Apple',           'on-gold-pre-green-apple'),
  ('f1000000-0000-0000-0000-000000000154', 'a1000000-0000-0000-0000-000000000051', 'Watermelon',            'on-gold-pre-watermelon'),
  ('f1000000-0000-0000-0000-000000000155', 'a1000000-0000-0000-0000-000000000051', 'Blue Raspberry',        'on-gold-pre-blue-raspberry'),

  -- Gold Standard Pre 2X (a52)
  ('f1000000-0000-0000-0000-000000000156', 'a1000000-0000-0000-0000-000000000052', 'Strawberry Burst',      'on-gold-pre-2x-strawberry-burst'),
  ('f1000000-0000-0000-0000-000000000157', 'a1000000-0000-0000-0000-000000000052', 'Blue Raspberry',        'on-gold-pre-2x-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000158', 'a1000000-0000-0000-0000-000000000052', 'Fruit Punch',           'on-gold-pre-2x-fruit-punch'),

  -- Amino Energy (a53)
  ('f1000000-0000-0000-0000-000000000159', 'a1000000-0000-0000-0000-000000000053', 'Watermelon',            'on-amino-energy-watermelon'),
  ('f1000000-0000-0000-0000-000000000160', 'a1000000-0000-0000-0000-000000000053', 'Blueberry Lemonade',    'on-amino-energy-blueberry-lemonade'),
  ('f1000000-0000-0000-0000-000000000161', 'a1000000-0000-0000-0000-000000000053', 'Grape',                 'on-amino-energy-grape'),
  ('f1000000-0000-0000-0000-000000000162', 'a1000000-0000-0000-0000-000000000053', 'Orange Cooler',         'on-amino-energy-orange-cooler'),

  -- N.O.-XPLODE (a54)
  ('f1000000-0000-0000-0000-000000000163', 'a1000000-0000-0000-0000-000000000054', 'Fruit Punch',           'bsn-noxplode-fruit-punch'),
  ('f1000000-0000-0000-0000-000000000164', 'a1000000-0000-0000-0000-000000000054', 'Blue Raspberry',        'bsn-noxplode-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000165', 'a1000000-0000-0000-0000-000000000054', 'Watermelon',            'bsn-noxplode-watermelon'),

  -- N.O.-XPLODE VASO (a55)
  ('f1000000-0000-0000-0000-000000000166', 'a1000000-0000-0000-0000-000000000055', 'Fruit Punch',           'bsn-noxplode-vaso-fruit-punch'),
  ('f1000000-0000-0000-0000-000000000167', 'a1000000-0000-0000-0000-000000000055', 'Blue Raspberry',        'bsn-noxplode-vaso-blue-raspberry'),

  -- VaporX5 (a56)
  ('f1000000-0000-0000-0000-000000000168', 'a1000000-0000-0000-0000-000000000056', 'Blue Raspberry',        'muscletech-vaporx5-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000169', 'a1000000-0000-0000-0000-000000000056', 'Fruit Punch Blast',     'muscletech-vaporx5-fruit-punch-blast'),

  -- Platinum Pre-Workout (a57)
  ('f1000000-0000-0000-0000-000000000170', 'a1000000-0000-0000-0000-000000000057', 'Fruit Punch',           'muscletech-platinum-pre-fruit-punch'),
  ('f1000000-0000-0000-0000-000000000171', 'a1000000-0000-0000-0000-000000000057', 'Watermelon',            'muscletech-platinum-pre-watermelon'),

  -- Assault Sport (a58)
  ('f1000000-0000-0000-0000-000000000172', 'a1000000-0000-0000-0000-000000000058', 'Blue Raspberry',        'musclepharm-assault-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000173', 'a1000000-0000-0000-0000-000000000058', 'Fruit Punch',           'musclepharm-assault-fruit-punch')

ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================================================
-- Summary
-- Brands added:    5  (Kaged, Optimum Nutrition, BSN, MuscleTech, MusclePharm)
-- Products added: 38  (a21–a58)
-- Flavors added:  96  (f78–f173)
-- Next batch starts:
--   Brands:   b1000000-0000-0000-0000-000000000016
--   Products: a1000000-0000-0000-0000-000000000059
--   Flavors:  f1000000-0000-0000-0000-000000000174
-- =============================================================================
