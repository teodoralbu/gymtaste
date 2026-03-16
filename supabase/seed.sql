-- =============================================================================
-- GymTaste — Seed Data
-- Run AFTER 001_initial_schema.sql
-- =============================================================================
-- NOTE: Demo users (Section 7) require real Supabase Auth accounts.
-- Create them first via Supabase Auth Dashboard or the signup page,
-- then update the UUIDs below to match. Alternatively, temporarily
-- disable the FK constraint on users.id → auth.users.id for local dev.
-- =============================================================================

-- =============================================================================
-- SECTION 1: Categories
-- =============================================================================
INSERT INTO categories (id, name, slug, icon, is_active) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Pre-Workout',    'pre-workout',    '⚡', true),
  ('c1000000-0000-0000-0000-000000000002', 'Protein Powder', 'protein-powder', '💪', false),
  ('c1000000-0000-0000-0000-000000000003', 'Energy Drinks',  'energy-drinks',  '🔋', false)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 2: Category Rating Dimensions (Pre-Workout only)
-- =============================================================================
INSERT INTO category_rating_dimensions (id, category_id, name, weight, display_order) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Taste',       0.4, 1),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Sweetness',   0.2, 2),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Mixability',  0.2, 3),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'Aftertaste',  0.2, 4)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 3: Flavor Tags
-- =============================================================================
INSERT INTO flavor_tags (id, name, slug) VALUES
  ('a3000000-0000-0000-0000-000000000001', 'fruity',      'fruity'),
  ('a3000000-0000-0000-0000-000000000002', 'sour',        'sour'),
  ('a3000000-0000-0000-0000-000000000003', 'candy-like',  'candy-like'),
  ('a3000000-0000-0000-0000-000000000004', 'natural',     'natural'),
  ('a3000000-0000-0000-0000-000000000005', 'earthy',      'earthy'),
  ('a3000000-0000-0000-0000-000000000006', 'citrus',      'citrus'),
  ('a3000000-0000-0000-0000-000000000007', 'tropical',    'tropical'),
  ('a3000000-0000-0000-0000-000000000008', 'minty',       'minty'),
  ('a3000000-0000-0000-0000-000000000009', 'berry',       'berry'),
  ('a3000000-0000-0000-0000-000000000010', 'sweet',       'sweet'),
  ('a3000000-0000-0000-0000-000000000011', 'chocolate',   'chocolate'),
  ('a3000000-0000-0000-0000-000000000012', 'vanilla',     'vanilla'),
  ('a3000000-0000-0000-0000-000000000013', 'refreshing',  'refreshing')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 4: Brands
-- =============================================================================
INSERT INTO brands (id, name, slug) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Transparent Labs', 'transparent-labs'),
  ('b1000000-0000-0000-0000-000000000002', 'Cellucor',         'cellucor'),
  ('b1000000-0000-0000-0000-000000000003', 'Ghost',            'ghost'),
  ('b1000000-0000-0000-0000-000000000004', 'Legion Athletics', 'legion-athletics'),
  ('b1000000-0000-0000-0000-000000000005', 'Gorilla Mind',     'gorilla-mind'),
  ('b1000000-0000-0000-0000-000000000006', 'Ryse Supps',       'ryse-supps'),
  ('b1000000-0000-0000-0000-000000000007', 'Raw Nutrition',    'raw-nutrition'),
  ('b1000000-0000-0000-0000-000000000008', 'Alani Nu',         'alani-nu'),
  ('b1000000-0000-0000-0000-000000000009', 'JNX Sports',       'jnx-sports'),
  ('b1000000-0000-0000-0000-000000000010', 'Bucked Up',        'bucked-up')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 5: Products
-- =============================================================================
INSERT INTO products (id, brand_id, category_id, name, slug, caffeine_mg, citrulline_g, beta_alanine_g, price_per_serving, servings_per_container, is_approved) VALUES
  -- Transparent Labs
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
   'BULK Pre-Workout', 'transparent-labs-bulk', 200, 8.0, 4.0, 1.67, 30, true),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
   'BULK Black', 'transparent-labs-bulk-black', 275, 8.0, 4.0, 1.83, 30, true),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
   'Stim-Free BULK', 'transparent-labs-stim-free-bulk', 0, 8.0, 4.0, 1.67, 30, true),
  -- Cellucor
  ('a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'C4 Original', 'cellucor-c4-original', 150, 0, 1.6, 0.83, 60, true),
  ('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'C4 Ultimate', 'cellucor-c4-ultimate', 300, 6.0, 3.2, 1.67, 20, true),
  ('a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'C4 Ripped', 'cellucor-c4-ripped', 150, 0, 1.6, 1.00, 30, true),
  -- Ghost
  ('a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001',
   'GHOST Legend', 'ghost-legend', 250, 4.5, 3.2, 1.67, 30, true),
  ('a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001',
   'GHOST Legend V3', 'ghost-legend-v3', 250, 4.5, 3.2, 1.83, 30, true),
  -- Legion Athletics
  ('a1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001',
   'Pulse Pre-Workout', 'legion-pulse', 350, 8.0, 4.8, 1.75, 20, true),
  -- Gorilla Mind
  ('a1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001',
   'Gorilla Mode', 'gorilla-mind-gorilla-mode', 175, 9.0, 0, 1.50, 40, true),
  ('a1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001',
   'Gorilla Mode Nitric', 'gorilla-mind-gorilla-mode-nitric', 0, 10.0, 0, 1.50, 40, true),
  -- Ryse
  ('a1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001',
   'Godzilla Pre-Workout', 'ryse-godzilla', 350, 10.0, 3.2, 2.25, 20, true),
  ('a1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001',
   'Ryse Pre-Workout', 'ryse-pre-workout', 200, 4.5, 3.2, 1.33, 30, true),
  -- Raw Nutrition
  ('a1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001',
   'CBUM Thavage Pre-Workout', 'raw-cbum-thavage', 200, 8.0, 3.2, 1.83, 40, true),
  ('a1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001',
   'RAW Pre-Workout', 'raw-pre-workout', 200, 6.0, 3.2, 1.17, 30, true),
  -- Alani Nu
  ('a1000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000001',
   'Alani Nu Pre-Workout', 'alani-nu-pre-workout', 200, 6.0, 1.6, 1.50, 30, true),
  -- JNX Sports
  ('a1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000001',
   'The Curse!', 'jnx-the-curse', 125, 0, 1.5, 0.67, 50, true),
  -- Bucked Up
  ('a1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001',
   'BAMF Pre-Workout', 'bucked-up-bamf', 333, 6.0, 3.2, 1.50, 30, true),
  ('a1000000-0000-0000-0000-000000000019', 'b1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001',
   'WOKE AF Pre-Workout', 'bucked-up-woke-af', 333, 6.0, 3.2, 1.67, 30, true),
  ('a1000000-0000-0000-0000-000000000020', 'b1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001',
   'Bucked Up Pre-Workout', 'bucked-up-original', 200, 6.0, 2.0, 1.17, 30, true)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 6: Flavors
-- =============================================================================
INSERT INTO flavors (id, product_id, name, slug) VALUES
  -- Transparent Labs BULK
  ('f1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Blue Raspberry',      'tl-bulk-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Strawberry Lemonade', 'tl-bulk-strawberry-lemonade'),
  ('f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Tropical Punch',      'tl-bulk-tropical-punch'),
  ('f1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Watermelon',          'tl-bulk-watermelon'),
  ('f1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Peach Mango',         'tl-bulk-peach-mango'),
  -- Transparent Labs BULK Black
  ('f1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'Black Cherry',   'tl-bulk-black-black-cherry'),
  ('f1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', 'Peach Rings',    'tl-bulk-black-peach-rings'),
  ('f1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000002', 'Sour Grape',     'tl-bulk-black-sour-grape'),
  ('f1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000002', 'Cherry Kiwi',    'tl-bulk-black-cherry-kiwi'),
  -- TL Stim-Free BULK
  ('f1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000003', 'Tropical Punch',      'tl-stim-free-tropical-punch'),
  ('f1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000003', 'Strawberry Lemonade', 'tl-stim-free-strawberry-lemonade'),
  -- C4 Original
  ('f1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000004', 'Fruit Punch',      'c4-original-fruit-punch'),
  ('f1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000004', 'Icy Blue Razz',    'c4-original-icy-blue-razz'),
  ('f1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000004', 'Watermelon',       'c4-original-watermelon'),
  ('f1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000004', 'Pink Lemonade',    'c4-original-pink-lemonade'),
  ('f1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000004', 'Orange Burst',     'c4-original-orange-burst'),
  ('f1000000-0000-0000-0000-000000000017', 'a1000000-0000-0000-0000-000000000004', 'Cherry Limeade',   'c4-original-cherry-limeade'),
  -- C4 Ultimate
  ('f1000000-0000-0000-0000-000000000018', 'a1000000-0000-0000-0000-000000000005', 'Icy Blue Razz',          'c4-ultimate-icy-blue-razz'),
  ('f1000000-0000-0000-0000-000000000019', 'a1000000-0000-0000-0000-000000000005', 'Orange Mango',           'c4-ultimate-orange-mango'),
  ('f1000000-0000-0000-0000-000000000020', 'a1000000-0000-0000-0000-000000000005', 'Strawberry Watermelon',  'c4-ultimate-strawberry-watermelon'),
  -- C4 Ripped
  ('f1000000-0000-0000-0000-000000000021', 'a1000000-0000-0000-0000-000000000006', 'Fruit Punch',    'c4-ripped-fruit-punch'),
  ('f1000000-0000-0000-0000-000000000022', 'a1000000-0000-0000-0000-000000000006', 'Watermelon',     'c4-ripped-watermelon'),
  ('f1000000-0000-0000-0000-000000000023', 'a1000000-0000-0000-0000-000000000006', 'Orange',         'c4-ripped-orange'),
  -- Ghost Legend
  ('f1000000-0000-0000-0000-000000000024', 'a1000000-0000-0000-0000-000000000007', 'Sour Patch Kids Redberry',   'ghost-legend-sour-patch-redberry'),
  ('f1000000-0000-0000-0000-000000000025', 'a1000000-0000-0000-0000-000000000007', 'Sour Patch Kids Watermelon', 'ghost-legend-sour-patch-watermelon'),
  ('f1000000-0000-0000-0000-000000000026', 'a1000000-0000-0000-0000-000000000007', 'Warheads Sour Watermelon',   'ghost-legend-warheads-watermelon'),
  ('f1000000-0000-0000-0000-000000000027', 'a1000000-0000-0000-0000-000000000007', 'Swedish Fish',               'ghost-legend-swedish-fish'),
  ('f1000000-0000-0000-0000-000000000028', 'a1000000-0000-0000-0000-000000000007', 'Peach',                      'ghost-legend-peach'),
  -- Ghost Legend V3
  ('f1000000-0000-0000-0000-000000000029', 'a1000000-0000-0000-0000-000000000008', 'Welchs Grape',        'ghost-legend-v3-welchs-grape'),
  ('f1000000-0000-0000-0000-000000000030', 'a1000000-0000-0000-0000-000000000008', 'Tropical Mango',      'ghost-legend-v3-tropical-mango'),
  ('f1000000-0000-0000-0000-000000000031', 'a1000000-0000-0000-0000-000000000008', 'Lemon Crush',         'ghost-legend-v3-lemon-crush'),
  -- Legion Pulse
  ('f1000000-0000-0000-0000-000000000032', 'a1000000-0000-0000-0000-000000000009', 'Blue Raspberry',  'legion-pulse-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000033', 'a1000000-0000-0000-0000-000000000009', 'Green Apple',     'legion-pulse-green-apple'),
  ('f1000000-0000-0000-0000-000000000034', 'a1000000-0000-0000-0000-000000000009', 'Fruit Punch',     'legion-pulse-fruit-punch'),
  ('f1000000-0000-0000-0000-000000000035', 'a1000000-0000-0000-0000-000000000009', 'Tropical Punch',  'legion-pulse-tropical-punch'),
  ('f1000000-0000-0000-0000-000000000036', 'a1000000-0000-0000-0000-000000000009', 'Watermelon',      'legion-pulse-watermelon'),
  -- Gorilla Mode
  ('f1000000-0000-0000-0000-000000000037', 'a1000000-0000-0000-0000-000000000010', 'Mango Peach',     'gorilla-mode-mango-peach'),
  ('f1000000-0000-0000-0000-000000000038', 'a1000000-0000-0000-0000-000000000010', 'Strawberry Kiwi', 'gorilla-mode-strawberry-kiwi'),
  ('f1000000-0000-0000-0000-000000000039', 'a1000000-0000-0000-0000-000000000010', 'Orange Rush',     'gorilla-mode-orange-rush'),
  ('f1000000-0000-0000-0000-000000000040', 'a1000000-0000-0000-0000-000000000010', 'Bombsicle',       'gorilla-mode-bombsicle'),
  ('f1000000-0000-0000-0000-000000000041', 'a1000000-0000-0000-0000-000000000010', 'Watermelon',      'gorilla-mode-watermelon'),
  -- Gorilla Mode Nitric
  ('f1000000-0000-0000-0000-000000000042', 'a1000000-0000-0000-0000-000000000011', 'Mango Peach',  'gorilla-mode-nitric-mango-peach'),
  ('f1000000-0000-0000-0000-000000000043', 'a1000000-0000-0000-0000-000000000011', 'Watermelon',   'gorilla-mode-nitric-watermelon'),
  -- Ryse Godzilla
  ('f1000000-0000-0000-0000-000000000044', 'a1000000-0000-0000-0000-000000000012', 'Gummy Worm',             'ryse-godzilla-gummy-worm'),
  ('f1000000-0000-0000-0000-000000000045', 'a1000000-0000-0000-0000-000000000012', 'Tigers Blood',           'ryse-godzilla-tigers-blood'),
  ('f1000000-0000-0000-0000-000000000046', 'a1000000-0000-0000-0000-000000000012', 'Ring Pop Cherry',        'ryse-godzilla-ring-pop-cherry'),
  ('f1000000-0000-0000-0000-000000000047', 'a1000000-0000-0000-0000-000000000012', 'Smarties',               'ryse-godzilla-smarties'),
  ('f1000000-0000-0000-0000-000000000048', 'a1000000-0000-0000-0000-000000000012', 'Kool-Aid Tropical Punch','ryse-godzilla-koolaid-tropical'),
  -- Ryse Pre-Workout
  ('f1000000-0000-0000-0000-000000000049', 'a1000000-0000-0000-0000-000000000013', 'Blackberry',    'ryse-pre-blackberry'),
  ('f1000000-0000-0000-0000-000000000050', 'a1000000-0000-0000-0000-000000000013', 'Strawberry Kiwi','ryse-pre-strawberry-kiwi'),
  -- CBUM Thavage
  ('f1000000-0000-0000-0000-000000000051', 'a1000000-0000-0000-0000-000000000014', 'Cherry Berry',       'cbum-thavage-cherry-berry'),
  ('f1000000-0000-0000-0000-000000000052', 'a1000000-0000-0000-0000-000000000014', 'Rocket Candy',       'cbum-thavage-rocket-candy'),
  ('f1000000-0000-0000-0000-000000000053', 'a1000000-0000-0000-0000-000000000014', 'Orange Burst',       'cbum-thavage-orange-burst'),
  ('f1000000-0000-0000-0000-000000000054', 'a1000000-0000-0000-0000-000000000014', 'Strawberry Mango',   'cbum-thavage-strawberry-mango'),
  -- RAW Pre-Workout
  ('f1000000-0000-0000-0000-000000000055', 'a1000000-0000-0000-0000-000000000015', 'Strawberry Watermelon', 'raw-pre-strawberry-watermelon'),
  ('f1000000-0000-0000-0000-000000000056', 'a1000000-0000-0000-0000-000000000015', 'Blue Raspberry',        'raw-pre-blue-raspberry'),
  -- Alani Nu
  ('f1000000-0000-0000-0000-000000000057', 'a1000000-0000-0000-0000-000000000016', 'Hawaiian Shaved Ice',    'alani-hawaiian-shaved-ice'),
  ('f1000000-0000-0000-0000-000000000058', 'a1000000-0000-0000-0000-000000000016', 'Galaxy Lemonade',        'alani-galaxy-lemonade'),
  ('f1000000-0000-0000-0000-000000000059', 'a1000000-0000-0000-0000-000000000016', 'Carnival Candy Grape',   'alani-carnival-candy-grape'),
  ('f1000000-0000-0000-0000-000000000060', 'a1000000-0000-0000-0000-000000000016', 'Breezeberry',            'alani-breezeberry'),
  ('f1000000-0000-0000-0000-000000000061', 'a1000000-0000-0000-0000-000000000016', 'Arctic White',           'alani-arctic-white'),
  -- JNX The Curse!
  ('f1000000-0000-0000-0000-000000000062', 'a1000000-0000-0000-0000-000000000017', 'Blue Raspberry', 'curse-blue-raspberry'),
  ('f1000000-0000-0000-0000-000000000063', 'a1000000-0000-0000-0000-000000000017', 'Grape',          'curse-grape'),
  ('f1000000-0000-0000-0000-000000000064', 'a1000000-0000-0000-0000-000000000017', 'Orange',         'curse-orange'),
  ('f1000000-0000-0000-0000-000000000065', 'a1000000-0000-0000-0000-000000000017', 'Watermelon',     'curse-watermelon'),
  ('f1000000-0000-0000-0000-000000000066', 'a1000000-0000-0000-0000-000000000017', 'Fruit Punch',    'curse-fruit-punch'),
  -- Bucked Up BAMF
  ('f1000000-0000-0000-0000-000000000067', 'a1000000-0000-0000-0000-000000000018', 'Blue Raz',    'bamf-blue-raz'),
  ('f1000000-0000-0000-0000-000000000068', 'a1000000-0000-0000-0000-000000000018', 'Watermelon',  'bamf-watermelon'),
  ('f1000000-0000-0000-0000-000000000069', 'a1000000-0000-0000-0000-000000000018', 'Grape Gainz', 'bamf-grape-gainz'),
  ('f1000000-0000-0000-0000-000000000070', 'a1000000-0000-0000-0000-000000000018', 'Miami',       'bamf-miami'),
  -- Bucked Up WOKE AF
  ('f1000000-0000-0000-0000-000000000071', 'a1000000-0000-0000-0000-000000000019', 'Blood Raz',          'woke-af-blood-raz'),
  ('f1000000-0000-0000-0000-000000000072', 'a1000000-0000-0000-0000-000000000019', 'Grape',              'woke-af-grape'),
  ('f1000000-0000-0000-0000-000000000073', 'a1000000-0000-0000-0000-000000000019', 'Pink Lemonade',      'woke-af-pink-lemonade'),
  ('f1000000-0000-0000-0000-000000000074', 'a1000000-0000-0000-0000-000000000019', 'Strawberry Margarita','woke-af-strawberry-margarita'),
  -- Bucked Up Original
  ('f1000000-0000-0000-0000-000000000075', 'a1000000-0000-0000-0000-000000000020', 'Blue Raz',      'bucked-up-blue-raz'),
  ('f1000000-0000-0000-0000-000000000076', 'a1000000-0000-0000-0000-000000000020', 'Watermelon',    'bucked-up-watermelon'),
  ('f1000000-0000-0000-0000-000000000077', 'a1000000-0000-0000-0000-000000000020', 'Gym N Juice',   'bucked-up-gym-n-juice')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 7: Flavor Tag Assignments
-- =============================================================================
INSERT INTO flavor_tag_assignments (flavor_id, tag_id) VALUES
  -- TL BULK Blue Raspberry → fruity, berry, sweet, candy-like
  ('f1000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000009'),
  ('f1000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000010'),
  ('f1000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000003'),
  -- TL BULK Strawberry Lemonade → fruity, citrus, sweet, refreshing
  ('f1000000-0000-0000-0000-000000000002','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000002','a3000000-0000-0000-0000-000000000006'),
  ('f1000000-0000-0000-0000-000000000002','a3000000-0000-0000-0000-000000000010'),
  ('f1000000-0000-0000-0000-000000000002','a3000000-0000-0000-0000-000000000013'),
  -- TL BULK Tropical Punch → fruity, tropical, sweet
  ('f1000000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000007'),
  ('f1000000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000010'),
  -- TL BULK Watermelon → fruity, sweet, refreshing
  ('f1000000-0000-0000-0000-000000000004','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000004','a3000000-0000-0000-0000-000000000010'),
  ('f1000000-0000-0000-0000-000000000004','a3000000-0000-0000-0000-000000000013'),
  -- TL BULK Peach Mango → fruity, tropical, sweet
  ('f1000000-0000-0000-0000-000000000005','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000005','a3000000-0000-0000-0000-000000000007'),
  ('f1000000-0000-0000-0000-000000000005','a3000000-0000-0000-0000-000000000010'),
  -- BULK Black Black Cherry → fruity, berry, sweet
  ('f1000000-0000-0000-0000-000000000006','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000006','a3000000-0000-0000-0000-000000000009'),
  ('f1000000-0000-0000-0000-000000000006','a3000000-0000-0000-0000-000000000010'),
  -- BULK Black Peach Rings → fruity, candy-like, sweet
  ('f1000000-0000-0000-0000-000000000007','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000007','a3000000-0000-0000-0000-000000000003'),
  ('f1000000-0000-0000-0000-000000000007','a3000000-0000-0000-0000-000000000010'),
  -- BULK Black Sour Grape → sour, fruity, berry
  ('f1000000-0000-0000-0000-000000000008','a3000000-0000-0000-0000-000000000002'),
  ('f1000000-0000-0000-0000-000000000008','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000008','a3000000-0000-0000-0000-000000000009'),
  -- C4 Original Fruit Punch → fruity, sweet
  ('f1000000-0000-0000-0000-000000000012','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000012','a3000000-0000-0000-0000-000000000010'),
  -- C4 Original Icy Blue Razz → fruity, berry, sweet, candy-like
  ('f1000000-0000-0000-0000-000000000013','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000013','a3000000-0000-0000-0000-000000000009'),
  ('f1000000-0000-0000-0000-000000000013','a3000000-0000-0000-0000-000000000010'),
  ('f1000000-0000-0000-0000-000000000013','a3000000-0000-0000-0000-000000000003'),
  -- C4 Original Pink Lemonade → citrus, sweet, refreshing
  ('f1000000-0000-0000-0000-000000000015','a3000000-0000-0000-0000-000000000006'),
  ('f1000000-0000-0000-0000-000000000015','a3000000-0000-0000-0000-000000000010'),
  ('f1000000-0000-0000-0000-000000000015','a3000000-0000-0000-0000-000000000013'),
  -- Ghost Sour Patch Kids Redberry → sour, fruity, candy-like, berry
  ('f1000000-0000-0000-0000-000000000024','a3000000-0000-0000-0000-000000000002'),
  ('f1000000-0000-0000-0000-000000000024','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000024','a3000000-0000-0000-0000-000000000003'),
  ('f1000000-0000-0000-0000-000000000024','a3000000-0000-0000-0000-000000000009'),
  -- Ghost Sour Patch Kids Watermelon → sour, fruity, candy-like, sweet
  ('f1000000-0000-0000-0000-000000000025','a3000000-0000-0000-0000-000000000002'),
  ('f1000000-0000-0000-0000-000000000025','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000025','a3000000-0000-0000-0000-000000000003'),
  ('f1000000-0000-0000-0000-000000000025','a3000000-0000-0000-0000-000000000010'),
  -- Ghost Warheads Sour Watermelon → sour, fruity, candy-like
  ('f1000000-0000-0000-0000-000000000026','a3000000-0000-0000-0000-000000000002'),
  ('f1000000-0000-0000-0000-000000000026','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000026','a3000000-0000-0000-0000-000000000003'),
  -- Ghost Swedish Fish → candy-like, sweet, fruity
  ('f1000000-0000-0000-0000-000000000027','a3000000-0000-0000-0000-000000000003'),
  ('f1000000-0000-0000-0000-000000000027','a3000000-0000-0000-0000-000000000010'),
  ('f1000000-0000-0000-0000-000000000027','a3000000-0000-0000-0000-000000000001'),
  -- Ghost Peach → fruity, natural, sweet
  ('f1000000-0000-0000-0000-000000000028','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000028','a3000000-0000-0000-0000-000000000004'),
  ('f1000000-0000-0000-0000-000000000028','a3000000-0000-0000-0000-000000000010'),
  -- Legion Green Apple → fruity, sour, citrus
  ('f1000000-0000-0000-0000-000000000033','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000033','a3000000-0000-0000-0000-000000000002'),
  ('f1000000-0000-0000-0000-000000000033','a3000000-0000-0000-0000-000000000006'),
  -- Gorilla Mode Mango Peach → fruity, tropical, sweet
  ('f1000000-0000-0000-0000-000000000037','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000037','a3000000-0000-0000-0000-000000000007'),
  ('f1000000-0000-0000-0000-000000000037','a3000000-0000-0000-0000-000000000010'),
  -- Gorilla Mode Strawberry Kiwi → fruity, berry, sweet
  ('f1000000-0000-0000-0000-000000000038','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000038','a3000000-0000-0000-0000-000000000009'),
  ('f1000000-0000-0000-0000-000000000038','a3000000-0000-0000-0000-000000000010'),
  -- Ryse Godzilla Gummy Worm → candy-like, sweet, fruity
  ('f1000000-0000-0000-0000-000000000044','a3000000-0000-0000-0000-000000000003'),
  ('f1000000-0000-0000-0000-000000000044','a3000000-0000-0000-0000-000000000010'),
  ('f1000000-0000-0000-0000-000000000044','a3000000-0000-0000-0000-000000000001'),
  -- CBUM Thavage Cherry Berry → fruity, berry, sweet
  ('f1000000-0000-0000-0000-000000000051','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000051','a3000000-0000-0000-0000-000000000009'),
  ('f1000000-0000-0000-0000-000000000051','a3000000-0000-0000-0000-000000000010'),
  -- Alani Hawaiian Shaved Ice → sweet, refreshing, fruity
  ('f1000000-0000-0000-0000-000000000057','a3000000-0000-0000-0000-000000000010'),
  ('f1000000-0000-0000-0000-000000000057','a3000000-0000-0000-0000-000000000013'),
  ('f1000000-0000-0000-0000-000000000057','a3000000-0000-0000-0000-000000000001'),
  -- Alani Galaxy Lemonade → citrus, sweet, refreshing
  ('f1000000-0000-0000-0000-000000000058','a3000000-0000-0000-0000-000000000006'),
  ('f1000000-0000-0000-0000-000000000058','a3000000-0000-0000-0000-000000000010'),
  ('f1000000-0000-0000-0000-000000000058','a3000000-0000-0000-0000-000000000013'),
  -- JNX Blue Raspberry → fruity, berry, sweet, candy-like
  ('f1000000-0000-0000-0000-000000000062','a3000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000062','a3000000-0000-0000-0000-000000000009'),
  ('f1000000-0000-0000-0000-000000000062','a3000000-0000-0000-0000-000000000010'),
  ('f1000000-0000-0000-0000-000000000062','a3000000-0000-0000-0000-000000000003'),
  -- WOKE AF Pink Lemonade → citrus, sweet, refreshing
  ('f1000000-0000-0000-0000-000000000073','a3000000-0000-0000-0000-000000000006'),
  ('f1000000-0000-0000-0000-000000000073','a3000000-0000-0000-0000-000000000010'),
  ('f1000000-0000-0000-0000-000000000073','a3000000-0000-0000-0000-000000000013')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 8: Demo Users
-- NOTE: These UUIDs must match real Supabase Auth user IDs.
-- Create auth accounts first, then replace IDs below.
-- For local dev only, you can temporarily drop the FK to auth.users.
-- =============================================================================
INSERT INTO users (id, username, email, bio, badge_tier) VALUES
  ('a4000000-0000-0000-0000-000000000001', 'swolepatrol',    'swolepatrol@demo.gymtaste.com',    'Chasing PRs and protein. Rated 400+ supplements.', 'gym_rat'),
  ('a4000000-0000-0000-0000-000000000002', 'flavorgod',      'flavorgod@demo.gymtaste.com',      'If it tastes bad, I will tell you.',               'connoisseur'),
  ('a4000000-0000-0000-0000-000000000003', 'gainz_garcia',   'gainz_garcia@demo.gymtaste.com',   'Supplement nerd. Ghost fan boy.',                  'flavor_hunter'),
  ('a4000000-0000-0000-0000-000000000004', 'lifting_luna',   'lifting_luna@demo.gymtaste.com',   'Just here for the flavors tbh.',                   'taster'),
  ('a4000000-0000-0000-0000-000000000005', 'preworkout_pete','preworkout_pete@demo.gymtaste.com','Never missed a scoop.',                            'connoisseur')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 9: Demo Ratings
-- overall_score = taste*0.4 + sweetness*0.2 + mixability*0.2 + aftertaste*0.2
-- =============================================================================
INSERT INTO ratings (id, user_id, flavor_id, scores, overall_score, would_buy_again, context_tags, review_text, created_at) VALUES
  -- swolepatrol (gym_rat, ~20 ratings)
  ('a2000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000001',
   '{"taste":9,"sweetness":7,"mixability":9,"aftertaste":8}', 8.60, true, ARRAY['mixed_with_water'], 'TL BULK Blue Razz is the GOAT. Tastes like a real blue raspberry, not that fake chemical garbage. Mixes perfect.', NOW() - INTERVAL '5 months'),
  ('a2000000-0000-0000-0000-000000000002','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000024',
   '{"taste":9,"sweetness":8,"mixability":8,"aftertaste":7}', 8.40, true, ARRAY['empty_stomach','mixed_with_water'], 'Ghost Redberry is elite. SPK collab was a W.', NOW() - INTERVAL '4 months'),
  ('a2000000-0000-0000-0000-000000000003','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000037',
   '{"taste":8,"sweetness":6,"mixability":9,"aftertaste":7}', 7.80, true, ARRAY['mixed_with_water'], 'Gorilla Mode Mango Peach is solid. Not too sweet which I appreciate. Mixes easy.', NOW() - INTERVAL '4 months'),
  ('a2000000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000012',
   '{"taste":6,"sweetness":7,"mixability":8,"aftertaste":5}', 6.40, false, ARRAY['mixed_with_water'], 'C4 Fruit Punch tastes like medicine. Classics stay classic but the flavor hasnt aged well.', NOW() - INTERVAL '3 months'),
  ('a2000000-0000-0000-0000-000000000005','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000044',
   '{"taste":9,"sweetness":8,"mixability":8,"aftertaste":8}', 8.60, true, ARRAY['empty_stomach'], 'Ryse Godzilla Gummy Worm is the most unique pre-workout flavor Ive ever had. Tastes like actual gummy worms.', NOW() - INTERVAL '3 months'),
  ('a2000000-0000-0000-0000-000000000006','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000051',
   '{"taste":8,"sweetness":7,"mixability":9,"aftertaste":7}', 7.80, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '2 months'),
  ('a2000000-0000-0000-0000-000000000007','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000057',
   '{"taste":8,"sweetness":6,"mixability":8,"aftertaste":7}', 7.60, true, ARRAY['mixed_with_water'], 'Alani Hawaiian Shaved Ice is clean. Low sweetness which is rare. Great for morning sessions.', NOW() - INTERVAL '2 months'),
  ('a2000000-0000-0000-0000-000000000008','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000025',
   '{"taste":8,"sweetness":7,"mixability":8,"aftertaste":7}', 7.80, true, ARRAY['empty_stomach','mixed_with_water'], NULL, NOW() - INTERVAL '1 month'),
  ('a2000000-0000-0000-0000-000000000009','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000067',
   '{"taste":7,"sweetness":8,"mixability":7,"aftertaste":6}', 7.20, true, ARRAY['mixed_with_water'], 'BAMF Blue Raz is decent. Nothing special but gets the job done.', NOW() - INTERVAL '1 month'),
  ('a2000000-0000-0000-0000-000000000010','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000062',
   '{"taste":7,"sweetness":6,"mixability":8,"aftertaste":6}', 6.80, false, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '3 weeks'),
  ('a2000000-0000-0000-0000-000000000011','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000032',
   '{"taste":7,"sweetness":5,"mixability":9,"aftertaste":7}', 7.00, true, ARRAY['mixed_with_water'], 'Legion Blue Razz is natural tasting. Not as sweet as other brands which I like.', NOW() - INTERVAL '2 weeks'),
  ('a2000000-0000-0000-0000-000000000012','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000004',
   '{"taste":8,"sweetness":5,"mixability":9,"aftertaste":7}', 7.40, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '1 week'),
  ('a2000000-0000-0000-0000-000000000013','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000027',
   '{"taste":8,"sweetness":9,"mixability":8,"aftertaste":7}', 8.00, true, ARRAY['empty_stomach'], 'Ghost Swedish Fish absolutely SLAPS. If you like candy flavors this is for you.', NOW() - INTERVAL '5 days'),
  ('a2000000-0000-0000-0000-000000000014','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000045',
   '{"taste":8,"sweetness":6,"mixability":8,"aftertaste":7}', 7.60, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '3 days'),
  ('a2000000-0000-0000-0000-000000000015','a4000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000052',
   '{"taste":7,"sweetness":7,"mixability":8,"aftertaste":6}', 7.00, true, ARRAY['empty_stomach','mixed_with_water'], NULL, NOW() - INTERVAL '1 day'),

  -- flavorgod (connoisseur, ~18 ratings)
  ('a2000000-0000-0000-0000-000000000016','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000026',
   '{"taste":10,"sweetness":6,"mixability":9,"aftertaste":9}', 9.00, true, ARRAY['empty_stomach','mixed_with_water'], 'Warheads Sour Watermelon is a MASTERPIECE. Extreme sour upfront then mellows into watermelon. Ghost cooked.', NOW() - INTERVAL '5 months'),
  ('a2000000-0000-0000-0000-000000000017','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000002',
   '{"taste":9,"sweetness":7,"mixability":9,"aftertaste":8}', 8.60, true, ARRAY['mixed_with_water'], 'TL Strawberry Lemonade is consistently the best lemonade pre. Bright, clean, no weird aftertaste.', NOW() - INTERVAL '4 months'),
  ('a2000000-0000-0000-0000-000000000018','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000048',
   '{"taste":9,"sweetness":7,"mixability":8,"aftertaste":8}', 8.60, true, ARRAY['mixed_with_water'], 'Ryse Godzilla Kool-Aid collab is insane. Tastes exactly like Kool-Aid tropical punch. Unreal.', NOW() - INTERVAL '3 months'),
  ('a2000000-0000-0000-0000-000000000019','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000013',
   '{"taste":5,"sweetness":8,"mixability":7,"aftertaste":4}', 5.80, false, ARRAY['mixed_with_water'], 'C4 Icy Blue Razz is way too sweet and the aftertaste is rough. Beta alanine crash taste is real.', NOW() - INTERVAL '3 months'),
  ('a2000000-0000-0000-0000-000000000020','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000060',
   '{"taste":7,"sweetness":4,"mixability":8,"aftertaste":7}', 6.80, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '2 months'),
  ('a2000000-0000-0000-0000-000000000021','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000006',
   '{"taste":8,"sweetness":6,"mixability":9,"aftertaste":7}', 7.80, true, ARRAY['empty_stomach'], 'BULK Black Black Cherry has an authentic cherry flavor. Rich, not medicinal. Top tier.', NOW() - INTERVAL '2 months'),
  ('a2000000-0000-0000-0000-000000000022','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000024',
   '{"taste":9,"sweetness":7,"mixability":8,"aftertaste":8}', 8.40, true, ARRAY['empty_stomach','mixed_with_water'], NULL, NOW() - INTERVAL '6 weeks'),
  ('a2000000-0000-0000-0000-000000000023','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000033',
   '{"taste":8,"sweetness":4,"mixability":9,"aftertaste":8}', 7.60, true, ARRAY['mixed_with_water'], 'Legion Green Apple is for people who hate sweet pre-workouts. Tart, crisp, refreshing. Underrated.', NOW() - INTERVAL '5 weeks'),
  ('a2000000-0000-0000-0000-000000000024','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000038',
   '{"taste":8,"sweetness":6,"mixability":8,"aftertaste":7}', 7.60, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '4 weeks'),
  ('a2000000-0000-0000-0000-000000000025','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000057',
   '{"taste":9,"sweetness":5,"mixability":9,"aftertaste":8}', 8.20, true, ARRAY['mixed_with_water'], 'Alani Hawaiian Shaved Ice is the most refreshing pre I have ever had. Light, not overwhelming.', NOW() - INTERVAL '3 weeks'),
  ('a2000000-0000-0000-0000-000000000026','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000071',
   '{"taste":7,"sweetness":6,"mixability":7,"aftertaste":6}', 6.80, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '2 weeks'),
  ('a2000000-0000-0000-0000-000000000027','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000003',
   '{"taste":7,"sweetness":6,"mixability":8,"aftertaste":7}', 7.00, true, ARRAY['mixed_with_juice'], NULL, NOW() - INTERVAL '10 days'),
  ('a2000000-0000-0000-0000-000000000028','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000028',
   '{"taste":7,"sweetness":5,"mixability":8,"aftertaste":7}', 6.80, true, ARRAY['mixed_with_water'], 'Ghost Peach is subtle and clean. Not for candy lovers but great if you want something natural.', NOW() - INTERVAL '7 days'),
  ('a2000000-0000-0000-0000-000000000029','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000047',
   '{"taste":8,"sweetness":8,"mixability":8,"aftertaste":7}', 7.80, true, ARRAY['empty_stomach'], NULL, NOW() - INTERVAL '4 days'),
  ('a2000000-0000-0000-0000-000000000030','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000001',
   '{"taste":8,"sweetness":6,"mixability":9,"aftertaste":8}', 7.80, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '2 days'),
  ('a2000000-0000-0000-0000-000000000031','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000058',
   '{"taste":8,"sweetness":6,"mixability":9,"aftertaste":7}', 7.80, true, ARRAY['mixed_with_water'], 'Alani Galaxy Lemonade is underrated. Clean lemon flavor that doesnt fake. Daily driver material.', NOW() - INTERVAL '1 day'),
  ('a2000000-0000-0000-0000-000000000032','a4000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000044',
   '{"taste":9,"sweetness":7,"mixability":8,"aftertaste":8}', 8.40, true, ARRAY['empty_stomach'], NULL, NOW() - INTERVAL '6 hours'),

  -- gainz_garcia (flavor_hunter, ~17 ratings)
  ('a2000000-0000-0000-0000-000000000033','a4000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000025',
   '{"taste":9,"sweetness":7,"mixability":8,"aftertaste":7}', 8.20, true, ARRAY['empty_stomach'], 'Sour Patch Watermelon Ghost is my pre of choice. Hits the sour note without being overwhelming.', NOW() - INTERVAL '4 months'),
  ('a2000000-0000-0000-0000-000000000034','a4000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000026',
   '{"taste":8,"sweetness":5,"mixability":8,"aftertaste":7}', 7.40, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '3 months'),
  ('a2000000-0000-0000-0000-000000000035','a4000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000005',
   '{"taste":8,"sweetness":7,"mixability":9,"aftertaste":7}', 7.80, true, ARRAY['after_meal','mixed_with_water'], 'TL Peach Mango is smooth. Best tropical pre on the market rn.', NOW() - INTERVAL '3 months'),
  ('a2000000-0000-0000-0000-000000000036','a4000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000029',
   '{"taste":8,"sweetness":8,"mixability":8,"aftertaste":7}', 7.80, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '2 months'),
  ('a2000000-0000-0000-0000-000000000037','a4000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000039',
   '{"taste":7,"sweetness":6,"mixability":8,"aftertaste":7}', 7.00, true, ARRAY['mixed_with_water'], 'Gorilla Mode Orange Rush is decent. Not my favorite but solid option.', NOW() - INTERVAL '2 months'),
  ('a2000000-0000-0000-0000-000000000038','a4000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000053',
   '{"taste":8,"sweetness":6,"mixability":8,"aftertaste":7}', 7.60, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '6 weeks'),
  ('a2000000-0000-0000-0000-000000000039','a4000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000059',
   '{"taste":8,"sweetness":8,"mixability":8,"aftertaste":7}', 7.80, true, ARRAY['mixed_with_water'], 'Alani Carnival Candy Grape is too sweet for me but objectively it tastes like candy. Grape lovers eat.', NOW() - INTERVAL '5 weeks'),
  ('a2000000-0000-0000-0000-000000000040','a4000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000027',
   '{"taste":9,"sweetness":9,"mixability":8,"aftertaste":7}', 8.40, true, ARRAY['empty_stomach'], NULL, NOW() - INTERVAL '4 weeks'),
  ('a2000000-0000-0000-0000-000000000041','a4000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000046',
   '{"taste":8,"sweetness":7,"mixability":8,"aftertaste":7}', 7.60, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '3 weeks'),
  ('a2000000-0000-0000-0000-000000000042','a4000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000019',
   '{"taste":7,"sweetness":7,"mixability":7,"aftertaste":6}', 6.80, true, ARRAY['mixed_with_water'], 'C4 Ultimate Orange Mango. Decent flavor, solid formula. C4 has finally figured out mango.', NOW() - INTERVAL '2 weeks'),
  ('a2000000-0000-0000-0000-000000000043','a4000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000063',
   '{"taste":5,"sweetness":7,"mixability":7,"aftertaste":4}', 5.40, false, ARRAY['mixed_with_water'], 'The Curse Grape tastes like grape medicine. Artificial and rough aftertaste.', NOW() - INTERVAL '10 days'),
  ('a2000000-0000-0000-0000-000000000044','a4000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000040',
   '{"taste":7,"sweetness":5,"mixability":9,"aftertaste":6}', 6.80, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '5 days'),
  ('a2000000-0000-0000-0000-000000000045','a4000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000036',
   '{"taste":7,"sweetness":5,"mixability":9,"aftertaste":7}', 7.00, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '2 days'),

  -- lifting_luna (taster, ~13 ratings)
  ('a2000000-0000-0000-0000-000000000046','a4000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000057',
   '{"taste":10,"sweetness":6,"mixability":9,"aftertaste":9}', 9.00, true, ARRAY['mixed_with_water'], 'Alani Hawaiian Shaved Ice is EVERYTHING. I drink it before AND after gym. Life changing honestly.', NOW() - INTERVAL '3 months'),
  ('a2000000-0000-0000-0000-000000000047','a4000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000058',
   '{"taste":9,"sweetness":6,"mixability":9,"aftertaste":8}', 8.40, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '2 months'),
  ('a2000000-0000-0000-0000-000000000048','a4000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000059',
   '{"taste":8,"sweetness":9,"mixability":8,"aftertaste":7}', 7.80, true, ARRAY['mixed_with_water'], 'Carnival Candy Grape. If you like grape candy this is literally perfect. I love it.', NOW() - INTERVAL '2 months'),
  ('a2000000-0000-0000-0000-000000000049','a4000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000002',
   '{"taste":8,"sweetness":7,"mixability":9,"aftertaste":7}', 7.80, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '6 weeks'),
  ('a2000000-0000-0000-0000-000000000050','a4000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000024',
   '{"taste":9,"sweetness":8,"mixability":8,"aftertaste":8}', 8.60, true, ARRAY['empty_stomach'], 'Ghost Redberry. Tastes exactly like Sour Patch Kids. I was shocked.', NOW() - INTERVAL '5 weeks'),
  ('a2000000-0000-0000-0000-000000000051','a4000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000015',
   '{"taste":7,"sweetness":7,"mixability":8,"aftertaste":6}', 7.00, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '4 weeks'),
  ('a2000000-0000-0000-0000-000000000052','a4000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000060',
   '{"taste":5,"sweetness":3,"mixability":8,"aftertaste":5}', 5.00, false, ARRAY['mixed_with_water'], 'Alani Breezeberry is too mild for me. Barely any flavor.', NOW() - INTERVAL '3 weeks'),
  ('a2000000-0000-0000-0000-000000000053','a4000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000044',
   '{"taste":9,"sweetness":8,"mixability":8,"aftertaste":8}', 8.60, true, ARRAY['empty_stomach'], NULL, NOW() - INTERVAL '2 weeks'),
  ('a2000000-0000-0000-0000-000000000054','a4000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000045',
   '{"taste":8,"sweetness":6,"mixability":8,"aftertaste":7}', 7.60, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '10 days'),
  ('a2000000-0000-0000-0000-000000000055','a4000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000073',
   '{"taste":8,"sweetness":6,"mixability":8,"aftertaste":7}', 7.60, true, ARRAY['mixed_with_water'], 'WOKE AF Pink Lemonade is refreshing. Strong without being super sour.', NOW() - INTERVAL '5 days'),
  ('a2000000-0000-0000-0000-000000000056','a4000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000030',
   '{"taste":8,"sweetness":7,"mixability":8,"aftertaste":7}', 7.60, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '2 days'),
  ('a2000000-0000-0000-0000-000000000057','a4000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000031',
   '{"taste":7,"sweetness":5,"mixability":8,"aftertaste":7}', 6.80, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '1 day'),
  ('a2000000-0000-0000-0000-000000000058','a4000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000061',
   '{"taste":4,"sweetness":2,"mixability":8,"aftertaste":4}', 4.00, false, ARRAY['mixed_with_water'], 'Alani Arctic White has no flavor. Just tastes like cold water with a weird chemical note. Skip.', NOW() - INTERVAL '12 hours'),

  -- preworkout_pete (connoisseur, ~17 ratings)
  ('a2000000-0000-0000-0000-000000000059','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000001',
   '{"taste":9,"sweetness":7,"mixability":9,"aftertaste":8}', 8.60, true, ARRAY['empty_stomach','mixed_with_water'], 'TL BULK Blue Raspberry is my daily driver. Consistent, tastes great, mixes clean. Year 3 and counting.', NOW() - INTERVAL '5 months'),
  ('a2000000-0000-0000-0000-000000000060','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000006',
   '{"taste":8,"sweetness":6,"mixability":9,"aftertaste":8}', 7.80, true, ARRAY['empty_stomach'], NULL, NOW() - INTERVAL '4 months'),
  ('a2000000-0000-0000-0000-000000000061','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000032',
   '{"taste":7,"sweetness":5,"mixability":9,"aftertaste":7}', 7.00, true, ARRAY['mixed_with_water'], 'Legion Blue Razz tastes natural. Not candy-like at all. For purists.', NOW() - INTERVAL '4 months'),
  ('a2000000-0000-0000-0000-000000000062','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000048',
   '{"taste":10,"sweetness":7,"mixability":8,"aftertaste":9}', 9.00, true, ARRAY['mixed_with_water'], 'Ryse Godzilla Kool-Aid Tropical Punch may be the best flavored pre ever made. I said what I said.', NOW() - INTERVAL '3 months'),
  ('a2000000-0000-0000-0000-000000000063','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000044',
   '{"taste":9,"sweetness":8,"mixability":8,"aftertaste":8}', 8.60, true, ARRAY['empty_stomach'], NULL, NOW() - INTERVAL '3 months'),
  ('a2000000-0000-0000-0000-000000000064','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000014',
   '{"taste":5,"sweetness":8,"mixability":7,"aftertaste":4}', 5.60, false, ARRAY['mixed_with_water'], 'C4 Watermelon is way too sweet. Aftertaste is rough. Skip this one.', NOW() - INTERVAL '2 months'),
  ('a2000000-0000-0000-0000-000000000065','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000007',
   '{"taste":8,"sweetness":8,"mixability":8,"aftertaste":7}', 7.80, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '2 months'),
  ('a2000000-0000-0000-0000-000000000066','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000040',
   '{"taste":7,"sweetness":4,"mixability":9,"aftertaste":7}', 6.80, true, ARRAY['mixed_with_water'], 'Gorilla Mode Bombsicle is interesting. Not for everyone but creative flavor execution.', NOW() - INTERVAL '6 weeks'),
  ('a2000000-0000-0000-0000-000000000067','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000026',
   '{"taste":9,"sweetness":5,"mixability":8,"aftertaste":8}', 8.00, true, ARRAY['empty_stomach','mixed_with_water'], NULL, NOW() - INTERVAL '5 weeks'),
  ('a2000000-0000-0000-0000-000000000068','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000054',
   '{"taste":8,"sweetness":7,"mixability":8,"aftertaste":7}', 7.60, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '4 weeks'),
  ('a2000000-0000-0000-0000-000000000069','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000018',
   '{"taste":7,"sweetness":6,"mixability":8,"aftertaste":6}', 6.80, true, ARRAY['mixed_with_water'], 'C4 Ultimate Icy Blue Razz. Better than C4 Original version but still too artificial.', NOW() - INTERVAL '3 weeks'),
  ('a2000000-0000-0000-0000-000000000070','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000072',
   '{"taste":4,"sweetness":8,"mixability":7,"aftertaste":3}', 4.80, false, ARRAY['mixed_with_water'], 'WOKE AF Grape is rough. Chemical grape taste that lingers. Avoid.', NOW() - INTERVAL '2 weeks'),
  ('a2000000-0000-0000-0000-000000000071','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000037',
   '{"taste":8,"sweetness":6,"mixability":9,"aftertaste":7}', 7.60, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '10 days'),
  ('a2000000-0000-0000-0000-000000000072','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000055',
   '{"taste":7,"sweetness":6,"mixability":8,"aftertaste":6}', 6.80, true, ARRAY['mixed_with_water'], NULL, NOW() - INTERVAL '5 days'),
  ('a2000000-0000-0000-0000-000000000073','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000003',
   '{"taste":8,"sweetness":6,"mixability":9,"aftertaste":7}', 7.60, true, ARRAY['mixed_with_water'], 'TL BULK Tropical Punch is reliable. Not flashy but consistently good.', NOW() - INTERVAL '2 days'),
  ('a2000000-0000-0000-0000-000000000074','a4000000-0000-0000-0000-000000000005','f1000000-0000-0000-0000-000000000025',
   '{"taste":9,"sweetness":7,"mixability":8,"aftertaste":8}', 8.40, true, ARRAY['empty_stomach'], NULL, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 10: Demo Follows
-- =============================================================================
INSERT INTO follows (follower_id, following_id, created_at) VALUES
  ('a4000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000002', NOW() - INTERVAL '4 months'),
  ('a4000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000003', NOW() - INTERVAL '3 months'),
  ('a4000000-0000-0000-0000-000000000002','a4000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 months'),
  ('a4000000-0000-0000-0000-000000000002','a4000000-0000-0000-0000-000000000005', NOW() - INTERVAL '3 months'),
  ('a4000000-0000-0000-0000-000000000003','a4000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 months'),
  ('a4000000-0000-0000-0000-000000000003','a4000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 months'),
  ('a4000000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 months'),
  ('a4000000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 month'),
  ('a4000000-0000-0000-0000-000000000005','a4000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 months'),
  ('a4000000-0000-0000-0000-000000000005','a4000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 months')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 11: Demo Review Likes
-- =============================================================================
INSERT INTO review_likes (user_id, rating_id, created_at) VALUES
  -- swolepatrol likes flavorgod's reviews
  ('a4000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000016', NOW() - INTERVAL '4 months'),
  ('a4000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000017', NOW() - INTERVAL '3 months'),
  ('a4000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000018', NOW() - INTERVAL '2 months'),
  -- gainz_garcia likes swolepatrol's reviews
  ('a4000000-0000-0000-0000-000000000003','a2000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 months'),
  ('a4000000-0000-0000-0000-000000000003','a2000000-0000-0000-0000-000000000005', NOW() - INTERVAL '2 months'),
  ('a4000000-0000-0000-0000-000000000003','a2000000-0000-0000-0000-000000000013', NOW() - INTERVAL '3 weeks'),
  -- lifting_luna likes various
  ('a4000000-0000-0000-0000-000000000004','a2000000-0000-0000-0000-000000000016', NOW() - INTERVAL '3 months'),
  ('a4000000-0000-0000-0000-000000000004','a2000000-0000-0000-0000-000000000025', NOW() - INTERVAL '2 months'),
  ('a4000000-0000-0000-0000-000000000004','a2000000-0000-0000-0000-000000000062', NOW() - INTERVAL '2 months'),
  -- preworkout_pete likes
  ('a4000000-0000-0000-0000-000000000005','a2000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 months'),
  ('a4000000-0000-0000-0000-000000000005','a2000000-0000-0000-0000-000000000016', NOW() - INTERVAL '4 months'),
  ('a4000000-0000-0000-0000-000000000005','a2000000-0000-0000-0000-000000000018', NOW() - INTERVAL '2 months'),
  -- flavorgod likes preworkout_pete
  ('a4000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000059', NOW() - INTERVAL '4 months'),
  ('a4000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000062', NOW() - INTERVAL '2 months'),
  ('a4000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000005', NOW() - INTERVAL '2 months')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 12: Demo Comments
-- =============================================================================
INSERT INTO review_comments (id, rating_id, user_id, text, created_at) VALUES
  ('cm000000-0000-0000-0000-000000000001',
   'a2000000-0000-0000-0000-000000000016',
   'a4000000-0000-0000-0000-000000000003',
   'The Warheads collab is elite. Ghost really understood the assignment.', NOW() - INTERVAL '4 months'),
  ('cm000000-0000-0000-0000-000000000002',
   'a2000000-0000-0000-0000-000000000016',
   'a4000000-0000-0000-0000-000000000001',
   'Been on this for a month. Still tastes incredible every time.', NOW() - INTERVAL '4 months'),
  ('cm000000-0000-0000-0000-000000000003',
   'a2000000-0000-0000-0000-000000000001',
   'a4000000-0000-0000-0000-000000000005',
   'Blue Razz BULK is my go-to too. TL never misses on this one.', NOW() - INTERVAL '4 months'),
  ('cm000000-0000-0000-0000-000000000004',
   'a2000000-0000-0000-0000-000000000062',
   'a4000000-0000-0000-0000-000000000001',
   'Had to try this after reading your review. You were not lying bro.', NOW() - INTERVAL '2 months'),
  ('cm000000-0000-0000-0000-000000000005',
   'a2000000-0000-0000-0000-000000000046',
   'a4000000-0000-0000-0000-000000000002',
   'Finally someone reviewing Alani properly. Hawaiian Shaved Ice is slept on.', NOW() - INTERVAL '2 months'),
  ('cm000000-0000-0000-0000-000000000006',
   'a2000000-0000-0000-0000-000000000019',
   'a4000000-0000-0000-0000-000000000005',
   'Agree 100%. The aftertaste on C4 Icy Blue Razz is brutal. Moved on long ago.', NOW() - INTERVAL '2 months'),
  ('cm000000-0000-0000-0000-000000000007',
   'a2000000-0000-0000-0000-000000000013',
   'a4000000-0000-0000-0000-000000000003',
   'Swedish Fish Ghost hits different. Great pre-workout for candy fans.', NOW() - INTERVAL '3 weeks')
ON CONFLICT DO NOTHING;
