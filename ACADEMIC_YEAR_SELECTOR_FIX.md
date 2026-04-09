# Academic Year Selector Fix

## Issues Fixed

### 1. Non-Functional Topbar Academic Year Selector
**Problem**: The academic year badge in the Topbar was just a display element, not a functional selector.

**Solution**: Converted it to a dropdown menu that allows users to switch between academic years.

### 2. Incorrect Current Year Detection
**Problem**: The system was not correctly identifying the current academic year based on real-world dates.

**Solution**: 
- Created SQL script to fix the `is_current` flag in the database
- Updated the system to properly detect current year based on June-May academic calendar
- Added initialization logic to sync UI with database on app load

## Changes Made

### 1. Topbar.jsx
- Added `showYearMenu` state for dropdown visibility
- Imported `useAcademicYears` hook to fetch all academic years
- Converted static badge to clickable dropdown button
- Added dropdown menu showing all academic years with:
  - Current year indicator (green "Current" badge)
  - Selected year checkmark
  - Click to switch functionality
- Added click-outside handler for dropdown

### 2. uiStore.js
- Added `initializeAcademicYear()` function to sync with database
- Updated `setCurrentAcademicYear()` with console logging
- Added `currentAcademicYearId` to persisted state
- Enhanced academic year management

### 3. App.jsx
- Created `AcademicYearInitializer` component
- Fetches current academic year from database on app load
- Automatically initializes UI store with correct year
- Wraps entire app to ensure year is set before rendering

### 4. fix-current-academic-year.sql
- Checks existing academic years and their date ranges
- Resets all `is_current` flags
- Sets correct current year based on today's date
- Creates current academic year if it doesn't exist
- Handles June-May academic calendar logic
- Provides verification queries

## Academic Year Logic

### Calendar
- Academic year runs from June 1 to May 31
- Start month: June (month 6)
- End month: May (month 5)

### Current Year Detection
```javascript
const currentMonth = now.getMonth() + 1
const currentYear = now.getFullYear()

// If current month is June or later, we're in current year's academic year
// If current month is before June, we're in previous year's academic year
const academicStartYear = currentMonth >= 6 ? currentYear : currentYear - 1
```

### Example
- Date: April 6, 2026 (month 4)
- Since 4 < 6, academic start year = 2026 - 1 = 2025
- Current academic year = "2025-26"
- Date range: June 1, 2025 to May 31, 2026

## User Experience

### Topbar Selector
1. Click on "AY 2025-26" badge in topbar
2. Dropdown shows all academic years
3. Current year has green "Current" badge
4. Selected year has checkmark
5. Click any year to switch
6. Selection persists across page refreshes

### Student List Page
- Has its own academic year filter
- Works independently from topbar selector
- Allows filtering students by specific year

### Synchronization
- Topbar selector changes global academic year
- All pages that use `currentAcademicYearId` from UI store will update
- Student list page has its own local filter that overrides global setting

## Database Setup

Run the SQL script to fix current year:

```bash
# Connect to your database and run:
psql -U your_user -d your_database -f fix-current-academic-year.sql
```

The script will:
1. Show current state of academic years
2. Fix the `is_current` flag
3. Create current year if missing
4. Verify the changes

## Testing Checklist

- [ ] Topbar shows current academic year on load
- [ ] Clicking topbar year opens dropdown
- [ ] Dropdown shows all academic years
- [ ] Current year has "Current" badge
- [ ] Clicking a year switches the selection
- [ ] Selection persists after page refresh
- [ ] Student list page year filter works independently
- [ ] Database has correct `is_current` flag
- [ ] Current year matches real-world date (April 2026 → 2025-26)

## Files Modified

1. `src/components/layout/Topbar.jsx` - Made year selector functional
2. `src/store/uiStore.js` - Enhanced year management
3. `src/App.jsx` - Added year initialization
4. `fix-current-academic-year.sql` - Database fix script

## Notes

- The topbar selector sets the GLOBAL academic year preference
- Individual pages can override this with their own filters
- The selection is persisted in localStorage via Zustand persist
- The database `is_current` flag should be updated annually or via cron job
