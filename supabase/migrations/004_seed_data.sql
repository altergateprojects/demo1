-- Insert demo users (these would normally be created via Supabase Auth)
-- Note: In production, users are created via supabase.auth.signUp() or admin.createUser()

-- Insert demo academic years
INSERT INTO academic_years (year_label, start_date, end_date, is_current) VALUES
  ('2023-24', '2023-06-01', '2024-05-31', false),
  ('2025-26', '2025-06-01', '2026-05-31', false);

-- Get standard IDs for fee configurations
DO $$
DECLARE
  std_nursery UUID;
  std_lkg UUID;
  std_ukg UUID;
  std_1 UUID;
  std_2 UUID;
  std_3 UUID;
  std_4 UUID;
  std_5 UUID;
  current_year UUID;
BEGIN
  -- Get standard IDs
  SELECT id INTO std_nursery FROM standards WHERE name = 'Nursery';
  SELECT id INTO std_lkg FROM standards WHERE name = 'LKG';
  SELECT id INTO std_ukg FROM standards WHERE name = 'UKG';
  SELECT id INTO std_1 FROM standards WHERE name = 'I';
  SELECT id INTO std_2 FROM standards WHERE name = 'II';
  SELECT id INTO std_3 FROM standards WHERE name = 'III';
  SELECT id INTO std_4 FROM standards WHERE name = 'IV';
  SELECT id INTO std_5 FROM standards WHERE name = 'V';
  
  -- Get current academic year
  SELECT id INTO current_year FROM academic_years WHERE is_current = true;
  
  -- Insert fee configurations for current year
  INSERT INTO fee_configurations (academic_year_id, standard_id, gender, annual_fee_paise) VALUES
    (current_year, std_nursery, 'all', 800000),  -- ₹8,000
    (current_year, std_lkg, 'all', 900000),      -- ₹9,000
    (current_year, std_ukg, 'all', 1000000),     -- ₹10,000
    (current_year, std_1, 'all', 1100000),       -- ₹11,000
    (current_year, std_2, 'all', 1100000),       -- ₹11,000
    (current_year, std_3, 'all', 1200000),       -- ₹12,000
    (current_year, std_4, 'all', 1200000),       -- ₹12,000
    (current_year, std_5, 'all', 1300000);       -- ₹13,000
    
  -- Insert demo students
  INSERT INTO students (
    academic_year_id, standard_id, roll_number, full_name, guardian_name, 
    phone, gender, dob, address, admission_date, annual_fee_paise, 
    fee_paid_paise, status
  ) VALUES
    (current_year, std_5, '001', 'Rahul Sharma', 'Mr. Rajesh Sharma', '+91 98765 43210', 'male', '2010-05-15', '123 Main Street, Mumbai, Maharashtra 400001', '2020-06-01', 1300000, 800000, 'active'),
    (current_year, std_3, '002', 'Priya Patel', 'Mrs. Sunita Patel', '+91 87654 32109', 'female', '2012-08-22', '456 Park Avenue, Delhi 110001', '2022-06-01', 1200000, 1200000, 'active'),
    (current_year, std_1, '003', 'Amit Kumar', 'Mr. Suresh Kumar', '+91 76543 21098', 'male', '2014-12-10', '789 Garden Road, Bangalore 560001', '2023-06-01', 1100000, 600000, 'active'),
    (current_year, std_2, '004', 'Sneha Singh', 'Mr. Vikram Singh', '+91 65432 10987', 'female', '2013-03-18', '321 Lake View, Chennai 600001', '2022-06-01', 1100000, 550000, 'active'),
    (current_year, std_4, '005', 'Ravi Gupta', 'Mrs. Meera Gupta', '+91 54321 09876', 'male', '2011-09-05', '654 Hill Station, Pune 411001', '2021-06-01', 1200000, 400000, 'suspended');
    
  -- Insert demo teachers
  INSERT INTO teachers (
    employee_code, full_name, gender, phone, email, designation, 
    joining_date, status, monthly_salary_paise, subjects
  ) VALUES
    ('TCH-001', 'Mrs. Kavita Sharma', 'female', '+91 99887 76655', 'kavita@school.edu', 'Senior Teacher', '2015-06-01', 'active', 4500000, ARRAY['Mathematics', 'Science']),
    ('TCH-002', 'Mr. Rajesh Kumar', 'male', '+91 88776 65544', 'rajesh@school.edu', 'Head Teacher', '2012-06-01', 'active', 5500000, ARRAY['English', 'Social Studies']),
    ('TCH-003', 'Ms. Pooja Verma', 'female', '+91 77665 54433', 'pooja@school.edu', 'Junior Teacher', '2020-06-01', 'active', 3500000, ARRAY['Hindi', 'Art']),
    ('TCH-004', 'Mr. Sunil Yadav', 'male', '+91 66554 43322', 'sunil@school.edu', 'Sports Teacher', '2018-06-01', 'active', 4000000, ARRAY['Physical Education']);
    
  -- Insert demo expenses
  INSERT INTO expenses (
    academic_year_id, expense_date, category, description, vendor_name, 
    amount_paise, type, payment_method, recorded_by, is_approved
  ) VALUES
    (current_year, CURRENT_DATE - INTERVAL '5 days', 'stationery', 'Notebooks and pens for students', 'ABC Stationery', 550000, 'debit', 'cash', (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1), true),
    (current_year, CURRENT_DATE - INTERVAL '10 days', 'utilities', 'Electricity bill for March 2024', 'State Electricity Board', 1250000, 'debit', 'bank_transfer', (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1), true),
    (current_year, CURRENT_DATE - INTERVAL '15 days', 'cleaning_sanitation', 'Cleaning supplies and sanitizers', 'Clean & Fresh Supplies', 320000, 'debit', 'upi', (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1), true);
    
END $$;