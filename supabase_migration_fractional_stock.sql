-- Add fractional stock conversion support
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_unit TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_conversion_factor DECIMAL(10,3) DEFAULT 1;
