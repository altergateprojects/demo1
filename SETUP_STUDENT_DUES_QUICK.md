# Quick Setup - Student Dues Table

## Problem
You're getting a 400 error because the `student_dues` table doesn't exist in your database yet.

## Solution
Run the setup script to create the table.

## Steps

### 1. Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### 2. Copy and Run the Script
1. Open the file: `setup-student-dues-table.sql`
2. Copy ALL the contents
3. Paste into the Supabase SQL Editor
4. Click "Run" button (or press Ctrl+Enter / Cmd+Enter)

### 3. Verify Success
You should see output like:
```
message: "student_dues table created successfully!"
existing_records: 0
```

And a list of columns showing the table structure.

### 4. Refresh Your App
1. Go back to your application
2. Refresh the page (F5 or Cmd+R)
3. Navigate to Student Dues page
4. Click "Add Manual Due" - it should now work!

## What This Script Does

### Creates the `student_dues` Table
```sql
- id: Unique identifier
- student_id: Link to student (can be NULL for past students)
- academic_year_id: Which year the due is from
- due_type: 'fee' or 'pocket_money'
- amount_paise: Amount in paise (₹1 = 100 paise)
- description: Notes and student info for non-enrolled students
- due_date: When the due was recorded
- is_cleared: Whether it's been paid
- cleared_date: When it was paid
- cleared_by: Who marked it as paid
- payment_reference: Payment receipt/reference number
- created_by: Who created the due
- created_at: When it was created
- updated_at: Last update time
```

### Sets Up Indexes
For fast queries on:
- Student ID
- Academic Year
- Cleared status
- Due type
- Creation date

### Enables RLS (Row Level Security)
- Allows authenticated users to read/write
- Protects data from unauthorized access

### Creates Triggers
- Auto-updates `updated_at` timestamp on changes

## Troubleshooting

### Error: "relation already exists"
The table already exists. You can either:
1. Skip this script (table is already there)
2. Uncomment the DROP TABLE line at the top to recreate it

### Error: "permission denied"
You need to be logged in as the database owner or have proper permissions.

### Error: "foreign key constraint"
Make sure these tables exist first:
- `students`
- `academic_years`
- `user_profiles`

If they don't exist, you need to run the main database setup first.

## After Setup

Once the table is created, you can:
1. ✅ Add manual dues for current students
2. ✅ Add manual dues for past students (passed out/left)
3. ✅ Add both fee and pocket money dues at once
4. ✅ View pending and cleared dues
5. ✅ See statistics on total dues

## Next Steps

After the table is created:
1. Test by adding a sample due
2. Verify it appears in the "Pending Dues" tab
3. Check the statistics tab for totals
4. Start migrating your historical dues data

## Need More Tables?

If you need the complete student dues system with promotions and exit tracking, run:
- `student-dues-management-schema.sql` (full system)

But for just the manual due entry feature, this simple script is enough!
