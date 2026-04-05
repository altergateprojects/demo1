-- Add Fee Configurations for Current Academic Year
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  current_year_id UUID;
  std_nursery UUID;
  std_lkg UUID;
  std_ukg UUID;
  std_1 UUID;
  std_2 UUID;
  std_3 UUID;
  std_4 UUID;
  std_5 UUID;
BEGIN
  -- Get current academic year
  SELECT id INTO current_year_id FROM academic_years WHERE is_current = true LIMIT 1;
  
  -- Get standard IDs
  SELECT id INTO std_nursery FROM standards WHERE name = 'Nursery' LIMIT 1;
  SELECT id INTO std_lkg FROM standards WHERE name = 'LKG' LIMIT 1;
  SELECT id INTO std_ukg FROM standards WHERE name = 'UKG' LIMIT 1;
  SELECT id INTO std_1 FROM standards WHERE name = 'I' LIMIT 1;
  SELECT id INTO std_2 FROM standards WHERE name = 'II' LIMIT 1;
  SELECT id INTO std_3 FROM standards WHERE name = 'III' LIMIT 1;
  SELECT id INTO std_4 FROM standards WHERE name = 'IV' LIMIT 1;
  SELECT id INTO std_5 FROM standards WHERE name = 'V' LIMIT 1;
  
  -- Insert fee configurations if they don't exist
  INSERT INTO fee_configurations (academic_year_id, standard_id, gender, annual_fee_paise, is_active)
  VALUES
    (current_year_id, std_nursery, 'all', 800000, true),   -- ₹8,000
    (current_year_id, std_lkg, 'all', 900000, true),       -- ₹9,000
    (current_year_id, std_ukg, 'all', 1000000, true),      -- ₹10,000
    (current_year_id, std_1, 'all', 1100000, true),        -- ₹11,000
    (current_year_id, std_2, 'all', 1200000, true),        -- ₹12,000
    (current_year_id, std_3, 'all', 1300000, true),        -- ₹13,000
    (current_year_id, std_4, 'all', 1400000, true),        -- ₹14,000
    (current_year_id, std_5, 'all', 1500000, true)         -- ₹15,000
  ON CONFLICT (academic_year_id, standard_id, gender) DO NOTHING;
  
  RAISE NOTICE 'Fee configurations added successfully';
END $$;