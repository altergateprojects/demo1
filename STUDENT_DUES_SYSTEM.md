# Student Dues Management System

## Overview
A comprehensive system for managing student dues across academic years, handling promotions, transfers, and students who leave with pending payments.

## Features

### 1. **Enhanced Fee Configuration Management**
- **Academic Year Selection**: Fee configurations now include academic year selection
- **Multi-Year Support**: View and manage fee configurations across different academic years
- **Fixed Validation**: Resolved "required" field validation errors in modals
- **Automatic Student Fee Updates**: When fee configurations change, student fees update automatically

### 2. **Previous Year Dues Tracking**
- **Automatic Due Creation**: When students are promoted, any pending fees/pocket money are recorded as dues
- **Due Types**: Supports both fee dues and pocket money dues
- **Academic Year Linkage**: Dues are linked to specific academic years for proper tracking

### 3. **Student Promotion System**
- **Promotion with Dues**: Promote students while automatically recording any pending amounts
- **Promotion Types**: Supports promoted, repeated, transferred, and left statuses
- **Fee Configuration Sync**: Automatically applies new year's fee configuration to promoted students

### 4. **Exit Dues Management**
- **Student Exit Recording**: Record when students leave with pending dues
- **Exit Reasons**: Track why students left (transfer, dropout, completion, other)
- **Total Due Calculation**: Automatically calculates total pending amounts
- **Clearance Tracking**: Track when exit dues are cleared and by whom

### 5. **Comprehensive Dues Dashboard**
- **Multiple Views**: Pending dues, cleared dues, exit dues, and statistics
- **Bulk Operations**: Select and clear multiple dues at once
- **Search & Filter**: Filter by academic year, due type, student name, etc.
- **Statistics**: Comprehensive statistics on dues across the system

## Database Schema

### Tables Created:
1. **`student_dues`** - Tracks pending dues from previous years
2. **`student_promotions`** - Records student promotions with due tracking
3. **`student_exit_dues`** - Manages students who left with pending payments

### Functions Created:
1. **`get_student_total_dues()`** - Calculate total dues for a student
2. **`promote_student_with_dues()`** - Promote student and record dues
3. **`record_student_exit_with_dues()`** - Record student exit with dues
4. **`clear_student_dues()`** - Clear multiple dues at once
5. **`update_student_fees_from_config()`** - Sync student fees with configurations

### Triggers:
- **Fee Configuration Trigger** - Automatically updates student fees when configurations change

## API Endpoints

### Student Dues API (`src/api/studentDues.api.js`):
- `getStudentTotalDues()` - Get comprehensive due information for a student
- `getStudentDues()` - Get dues with filtering options
- `getStudentPromotions()` - Get promotion history
- `getStudentExitDues()` - Get exit dues
- `promoteStudentWithDues()` - Promote student with due tracking
- `recordStudentExitWithDues()` - Record student exit
- `clearStudentDues()` - Clear selected dues
- `getDuesSummaryStats()` - Get system-wide statistics

## React Components

### 1. **Enhanced Fee Configuration Modal**
- **File**: `src/components/shared/AddFeeConfigModal.jsx`
- **Features**: Academic year selection, proper validation, edit support

### 2. **Student Dues Management Page**
- **File**: `src/pages/Students/StudentDuesPage.jsx`
- **Features**: Comprehensive dues management interface

### 3. **Updated Fees Page**
- **File**: `src/pages/Fees/FeesListPageNew.jsx`
- **Features**: Shows academic years, sync button, multi-year support

## React Hooks

### Student Dues Hooks (`src/hooks/useStudentDues.js`):
- `useStudentTotalDues()` - Get student's total dues
- `useStudentDues()` - Get dues with filters
- `useStudentPromotions()` - Get promotions
- `useStudentExitDues()` - Get exit dues
- `usePromoteStudentWithDues()` - Promote student
- `useRecordStudentExitWithDues()` - Record exit
- `useClearStudentDues()` - Clear dues
- `useDuesSummaryStats()` - Get statistics

## Installation Steps

### 1. Run Database Scripts (in order):
```sql
-- 1. First run the corrected fee tables
fix-fee-tables-corrected.sql

-- 2. Then run the student dues management schema
student-dues-management-schema.sql

-- 3. Finally grant permissions
grant-fee-sync-permissions.sql
```

### 2. Frontend Changes:
All frontend files have been updated automatically. The system includes:
- Enhanced fee configuration management
- Student dues management page
- Updated routing in App.jsx
- New API endpoints and hooks

## Usage Scenarios

### Scenario 1: Student Promotion
1. Navigate to student detail page
2. Use promotion function (to be added to UI)
3. System automatically:
   - Records any pending fees as dues
   - Records negative pocket money as dues
   - Updates student to new academic year
   - Applies new fee configuration

### Scenario 2: Student Leaves School
1. Use exit recording function
2. System automatically:
   - Calculates total pending amounts
   - Creates exit due record
   - Marks student as withdrawn
   - Tracks exit reason and date

### Scenario 3: Managing Previous Year Dues
1. Navigate to `/students/dues`
2. View all pending dues across years
3. Select dues to clear
4. Process payment and mark as cleared

### Scenario 4: Fee Configuration Changes
1. Add/edit fee configuration
2. System automatically:
   - Updates affected students' fees
   - Maintains audit trail
   - Refreshes all related data

## Key Benefits

1. **Comprehensive Tracking**: No student dues are lost during transitions
2. **Automatic Calculations**: System handles complex due calculations
3. **Audit Trail**: Complete history of all due-related activities
4. **Bulk Operations**: Efficient management of multiple dues
5. **Multi-Year Support**: Proper handling of academic year transitions
6. **Real-time Updates**: Automatic synchronization when configurations change

## Security Features

1. **Role-based Access**: Only finance/admin users can manage dues
2. **Audit Logging**: All operations are logged with user information
3. **Data Integrity**: Database constraints prevent invalid data
4. **Secure Functions**: All database functions use SECURITY DEFINER

## Navigation

- **Student Dues**: `/students/dues`
- **Fee Management**: `/fees`
- **Individual Student**: `/students/:id` (shows total dues)

The system provides a complete solution for managing student financial obligations across academic years, ensuring no dues are lost and providing comprehensive tracking and reporting capabilities.