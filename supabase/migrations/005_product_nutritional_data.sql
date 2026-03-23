-- Migration 005: Add nutritional data, serving weights, and label columns to products

-- Nutritional values (stored per-serving as canonical basis)
ALTER TABLE products ADD COLUMN IF NOT EXISTS calories integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS protein_g decimal(5,1);
ALTER TABLE products ADD COLUMN IF NOT EXISTS carbs_g decimal(5,1);
ALTER TABLE products ADD COLUMN IF NOT EXISTS fat_g decimal(5,1);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sugar_g decimal(5,1);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sodium_mg integer;

-- Serving size info for unit conversion (per-scoop, per-100g)
ALTER TABLE products ADD COLUMN IF NOT EXISTS scoop_weight_g decimal(5,1);
ALTER TABLE products ADD COLUMN IF NOT EXISTS serving_weight_g decimal(5,1);

-- Label data (arrays for ingredient lists)
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients text[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS sweeteners text[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS chemicals text[];
