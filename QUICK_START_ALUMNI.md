# Alumni System - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Run Database Setup (Required)
```sql
-- Open Supabase SQL Editor and run:
-- File: create-alumni-system-schema-fixed.sql
```
This creates the alumni tables, functions, and views.

**IMPORTANT**: Use the `-fixed.sql` file, not the original one!

### Step 2: Graduate a Student
1. Go to **Student Promotion** page
2. Select a student
3. Click **Promote**
4. Choose **"Graduated"** option
5. Add optional notes
6. Click **Promote Student**
7. ✅ Student moves to Alumni list!

### Step 3: View Alumni
1. Click **"Alumni"** in sidebar (🎓 icon)
2. See two tabs:
   - **Alumni (Graduated)** - All graduated students
   - **Left School** - Students who left before completing

## 📋 What You Can Do

### Mark Student as Graduated
- From promotion modal, select "Graduated"
- Student status changes to 'graduated'
- Appears in Alumni tab
- Historical record preserved

### Mark Student as Left School
- From promotion modal, select "Left School"
- Add reason in notes field
- Student status changes to 'left_school'
- Appears in Left School tab

### View Alumni
- Search by name or roll number
- See graduation date and final class
- View statistics (total alumni, total left school)
- Filter by academic year (future enhancement)

## 🎯 Key Features

✅ Preserve complete student history
✅ Separate graduated from left school students
✅ Search and filter capabilities
✅ Modern, responsive UI
✅ Automatic status management
✅ Secure with RLS policies

## 📊 Alumni Page Features

- **Statistics Cards**: Total alumni and left school count
- **Search Bar**: Find students by name or roll number
- **Tabs**: Switch between Alumni and Left School
- **Student Cards**: Show key information:
  - Name and roll number
  - Graduation/exit date
  - Final/last class
  - Exit reason (for left school)
  - Current occupation (for alumni)

## 🔄 Student Status Flow

```
Active Student
    ↓
Promotion Modal
    ├─ Promoted → Next standard (active)
    ├─ Repeated → Same standard (active)
    ├─ Graduated → Alumni list (graduated)
    └─ Left School → Left School list (left_school)
```

## 📁 Files to Know

- `create-alumni-system-schema-fixed.sql` - Database setup (USE THIS ONE!)
- `create-alumni-system-schema.sql` - Original (has bug, don't use)
- `src/pages/Students/AlumniPage.jsx` - Alumni page
- `src/api/alumni.api.js` - API functions
- `src/components/shared/PromotionModal.jsx` - Handles graduation

## ⚠️ Important Notes

1. **Must run database schema first** - System won't work without it
2. **Graduated students cannot be edited** - They're historical records
3. **Left school requires reason** - Add in notes field
4. **Status is permanent** - Cannot undo graduation/left school easily

## 🐛 Troubleshooting

**Problem**: "input parameters after one with a default value must also have defaults" error
**Solution**: You're using the wrong file! Use `create-alumni-system-schema-fixed.sql` instead

**Problem**: "Function does not exist" error
**Solution**: Run `create-alumni-system-schema-fixed.sql` in Supabase

**Problem**: Alumni page shows empty
**Solution**: Graduate a student first using promotion modal

**Problem**: Cannot see Alumni menu
**Solution**: Check user role (admin, finance, or staff required)

## 📞 Need Help?

Check these files for details:
- `ALUMNI_SYSTEM_COMPLETE.md` - Full implementation details
- `ALUMNI_SYSTEM_IMPLEMENTATION.md` - Original requirements
- `create-alumni-system-schema.sql` - Database schema with comments

---

**Ready to use!** Just run the database schema and start graduating students. 🎓
