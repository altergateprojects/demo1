# 🔧 Troubleshooting Guide

## 🚨 **Current Issues & Solutions**

### **Issue 1: No Fee Configurations Showing**
**Symptoms**: "View Configurations" shows empty or no data

**Solutions**:
1. **Run Essential Tables Setup**:
   ```sql
   -- Copy and paste this file into Supabase SQL Editor:
   essential-tables-setup.sql
   ```

2. **Check Database Connection**:
   ```sql
   -- Run this to test your database:
   test-database-connection.sql
   ```

3. **Add Your User Profile**:
   - Get your user ID: `SELECT auth.uid();`
   - Add to user_profiles table:
   ```sql
   INSERT INTO user_profiles (id, full_name, email, role)
   VALUES ('YOUR_USER_ID_HERE', 'Your Name', 'your@email.com', 'admin');
   ```

### **Issue 2: Students Data Not Showing**
**Symptoms**: Students page shows empty or loading forever

**Solutions**:
1. **Check if tables exist**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('students', 'academic_years', 'standards');
   ```

2. **Add sample data**:
   ```sql
   -- The essential-tables-setup.sql includes sample data
   ```

3. **Check browser console** for error messages

### **Issue 3: Database Connection Problems**
**Symptoms**: All pages show empty data, console errors

**Solutions**:
1. **Verify Supabase connection**:
   - Check your `.env.local` file
   - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct

2. **Check RLS policies**:
   ```sql
   -- Run essential-tables-setup.sql to fix RLS policies
   ```

3. **Verify authentication**:
   - Make sure you're logged in
   - Check if your user has proper role (admin/finance)

## 📋 **Step-by-Step Fix Process**

### **Step 1: Database Setup**
```sql
-- 1. Run this first (creates basic tables):
essential-tables-setup.sql

-- 2. Then run this (adds advanced features):
complete-student-dues-setup.sql

-- 3. Test connection:
test-database-connection.sql
```

### **Step 2: Add Your User Profile**
```sql
-- Get your user ID
SELECT auth.uid();

-- Add your profile (replace YOUR_USER_ID_HERE)
INSERT INTO user_profiles (id, full_name, email, role)
VALUES ('YOUR_USER_ID_HERE', 'Admin User', 'admin@school.com', 'admin')
ON CONFLICT (id) DO UPDATE SET
full_name = EXCLUDED.full_name,
email = EXCLUDED.email,
role = EXCLUDED.role;
```

### **Step 3: Add Sample Data**
```sql
-- Add a sample student
INSERT INTO students (
    roll_number, full_name, gender, 
    academic_year_id, standard_id,
    annual_fee_paise, fee_paid_paise, pocket_money_paise
)
SELECT 
    '001', 'Test Student', 'male',
    ay.id, s.id,
    1000000, 0, 0
FROM academic_years ay, standards s
WHERE ay.year_label = '2024-25' AND s.name = '1st'
ON CONFLICT (academic_year_id, roll_number) DO NOTHING;
```

### **Step 4: Test the System**
1. **Refresh all pages**
2. **Check fee configurations**: Should show sample configs
3. **Check students**: Should show sample student
4. **Add new fee configuration**: Test the modal

## 🔍 **Debugging Commands**

### **Check What Tables Exist**:
```sql
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### **Check Data in Tables**:
```sql
-- Check academic years
SELECT * FROM academic_years;

-- Check standards  
SELECT * FROM standards;

-- Check students
SELECT COUNT(*) as student_count FROM students;

-- Check fee configurations
SELECT COUNT(*) as config_count FROM fee_configurations;

-- Check user profiles
SELECT * FROM user_profiles;
```

### **Check RLS Policies**:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 🎯 **Quick Fixes**

### **Fix 1: Empty Fee Configurations**
```sql
-- Add a sample fee configuration
INSERT INTO fee_configurations (academic_year_id, standard_id, gender, annual_fee_paise)
SELECT ay.id, s.id, 'all', 1000000
FROM academic_years ay, standards s
WHERE ay.year_label = '2024-25' AND s.name = '1st'
ON CONFLICT (academic_year_id, standard_id, gender) DO NOTHING;
```

### **Fix 2: Empty Students List**
```sql
-- Add sample students
INSERT INTO students (roll_number, full_name, gender, academic_year_id, standard_id, annual_fee_paise)
SELECT 
    LPAD(generate_series(1,5)::text, 3, '0'),
    'Student ' || generate_series(1,5),
    CASE WHEN generate_series(1,5) % 2 = 0 THEN 'female' ELSE 'male' END,
    ay.id,
    s.id,
    1000000
FROM academic_years ay, standards s
WHERE ay.year_label = '2024-25' AND s.name = '1st'
ON CONFLICT (academic_year_id, roll_number) DO NOTHING;
```

### **Fix 3: Permission Issues**
```sql
-- Grant all permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
```

## 📞 **Still Having Issues?**

1. **Check browser console** for JavaScript errors
2. **Check Supabase logs** for database errors  
3. **Verify your .env.local** file has correct credentials
4. **Try incognito mode** to rule out caching issues
5. **Run the essential setup script** again

## ✅ **Success Indicators**

You'll know it's working when:
- ✅ Fee configurations page shows data or setup instructions
- ✅ Students page shows data or proper empty state
- ✅ No console errors in browser
- ✅ Can add new fee configurations
- ✅ Can navigate between pages without errors

The system is designed to be resilient and provide helpful error messages. Follow this guide step by step and you should have everything working! 🚀