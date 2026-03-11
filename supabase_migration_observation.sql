-- Run this in the Supabase SQL Editor to add the 'observation' column:
ALTER TABLE products ADD COLUMN IF NOT EXISTS observation TEXT;
