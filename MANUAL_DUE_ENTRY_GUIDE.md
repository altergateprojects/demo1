# Manual Due Entry Guide

## Overview
The Manual Due Entry feature allows you to record historical dues from before the system was implemented. This is essential when deploying the system to an existing school with students who have pending fees from previous years.

## When to Use Manual Due Entry

### 1. **System Implementation in Existing School**
When you give this system to a school that's already running, they will have:
- Students with unpaid fees from previous academic years
- Students with negative pocket money balances from before
- Historical dues that need to be tracked

### 2. **Data Migration**
- Moving from a previous manual or digital system
- Importing historical financial records
- Correcting or adjusting existing due amounts

### 3. **Special Cases**
- Recording dues discovered during audits
- Adjusting dues for special circumstances
- Correcting errors in previous records

## How to Add Manual Dues

### Step 1: Navigate to Student Dues Page
Go to **Navigation Menu → Student Dues** (`/students/dues`)

### Step 2: Click "Add Manual Due" Button
Located in the top-right corner of the page

### Step 3: Fill in the Form

#### Required Fields:

**1. Student** (Required)
- Select the student who owes the due
- Shows: Roll Number - Full Name (Standard)
- Example: "001 - Rahul Kumar (5th)"

**2. Academic Year** (Required)
- Select the year when this due originated
- Usually a previous year (not current)
- Example: "2023-24" for dues from last year
- Shows "(Current)" for the current academic year

**3. Due Type** (Required)
- **Fee Due**: Unpaid annual fees
- **Pocket Money Due**: Negative pocket money balance (overdraft)

**4. Amount** (Required)
- Enter the amount owed in rupees
- System automatically converts to paise for storage
- Example: ₹5,000.00

#### Optional Fields:

**5. Due Date**
- Date when this due was recorded
- Defaults to today's date
- Can be set to a past date for historical records

**6. Description / Notes**
- Add context about this due
- Recommended to mention it's a historical due
- Example: "Pending fees from 2023-24 academic year before system implementation"

### Step 4: Submit
Click "Add Due" button to save the entry

## Use Case Examples

### Example 1: School Starting Fresh with System

**Scenario:**
- School has been running for 5 years
- Implementing this system in 2024-25
- Student "Priya Sharma" has ₹8,000 pending from 2023-24

**Steps:**
1. Click "Add Manual Due"
2. Select Student: "Priya Sharma"
3. Select Academic Year: "2023-24"
4. Select Due Type: "Fee Due"
5. Enter Amount: ₹8,000.00
6. Add Description: "Historical fee due from 2023-24 before system implementation"
7. Click "Add Due"

**Result:**
- Due is recorded and linked to 2023-24
- Shows in "Pending Dues" tab
- Can be cleared when payment is received
- Maintains complete audit trail

### Example 2: Multiple Students with Historical Dues

**Scenario:**
- 20 students have pending fees from previous years
- Need to record all historical dues

**Process:**
1. Prepare a list with:
   - Student names
   - Academic year of due
   - Amount owed
   - Type (fee or pocket money)

2. For each student:
   - Click "Add Manual Due"
   - Fill in details
   - Add note: "Historical due - system migration"
   - Submit

3. Verify in "Pending Dues" tab

### Example 3: Pocket Money Overdraft from Before

**Scenario:**
- Student "Amit Patel" had -₹500 pocket money in 2023-24
- Need to record this as a due

**Steps:**
1. Click "Add Manual Due"
2. Select Student: "Amit Patel"
3. Select Academic Year: "2023-24"
4. Select Due Type: "Pocket Money Due"
5. Enter Amount: ₹500.00 (positive amount)
6. Add Description: "Pocket money overdraft from 2023-24"
7. Click "Add Due"

## Important Notes

### 1. **Amount Entry**
- Always enter positive amounts
- System tracks these as amounts owed
- Example: If student owes ₹5,000, enter 5000, not -5000

### 2. **Academic Year Selection**
- Select the year when the due originated
- Usually NOT the current year
- This helps track which year the due is from

### 3. **Description is Important**
- Always add context for historical dues
- Helps future users understand the origin
- Recommended format: "Historical due from [year] - [reason]"

### 4. **Audit Trail**
- System automatically records:
  - Who created the due
  - When it was created
  - All subsequent changes
- Cannot be deleted, only cleared when paid

### 5. **Clearing Dues**
- Once added, dues appear in "Pending Dues" tab
- Can be cleared when payment is received
- System tracks who cleared it and when

## Best Practices

### 1. **Bulk Entry Preparation**
Before starting, prepare:
- Complete list of students with dues
- Accurate amounts for each student
- Academic year information
- Reason/context for each due

### 2. **Verification**
After adding dues:
- Check "Pending Dues" tab
- Verify amounts are correct
- Ensure all students are listed
- Review statistics tab for totals

### 3. **Documentation**
- Keep original records for reference
- Document the migration process
- Note any discrepancies or adjustments

### 4. **Communication**
- Inform parents about recorded dues
- Provide clear payment instructions
- Explain the new system to stakeholders

## Viewing and Managing Dues

### Pending Dues Tab
- Shows all uncollected dues
- Displays: Student, Year, Type, Amount, Date
- Can be filtered and searched
- Select multiple for bulk clearing

### Cleared Dues Tab
- History of collected dues
- Shows who cleared and when
- Maintains complete audit trail

### Statistics Tab
- Total pending dues
- Total cleared dues
- Breakdown by type (fee vs pocket money)
- Number of students with dues

## Security and Permissions

- Only Finance and Admin users can add manual dues
- All operations are logged with user information
- Cannot delete dues (only clear when paid)
- Complete audit trail maintained

## Troubleshooting

### Issue: Student not in dropdown
**Solution:** Student must be added to the system first. Go to Students page and add the student.

### Issue: Academic year not available
**Solution:** Academic year must be created first. Contact admin to add the required academic year.

### Issue: Amount shows as zero
**Solution:** Ensure you're entering the amount in the currency input field correctly. The system stores in paise but displays in rupees.

## Summary

The Manual Due Entry feature is essential for:
- ✅ Recording historical dues when implementing the system
- ✅ Migrating from previous systems
- ✅ Maintaining complete financial records
- ✅ Ensuring no dues are lost during transition
- ✅ Providing audit trail for all dues

This feature ensures that when you deploy the system to an existing school, you can capture all historical financial obligations and manage them alongside current transactions.
