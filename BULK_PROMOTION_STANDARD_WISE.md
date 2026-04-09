# Bulk Promotion - Standard-Wise Implementation

## Overview
Updated the bulk promotion functionality to work standard-wise, ensuring all students in a bulk promotion batch are from the same standard and automatically determining the target standard.

## Changes Made

### 1. StudentPromotionPage.jsx
**Validation Check**: Added validation in `handleBulkPromotion()` to ensure all selected students are from the same standard before opening the bulk promotion modal.

```javascript
const handleBulkPromotion = () => {
  // Check if all selected students are from the same standard
  const selectedStandardIds = new Set(
    selectedStudentsData.map(s => s.standard_id)
  )
  
  if (selectedStandardIds.size > 1) {
    alert('Bulk promotion only works for students from the same standard. Please select students from one standard only.')
    return
  }
  
  setIsBulkPromotionModalOpen(true)
}
```

**Visual Indicator**: Added a badge in the bulk action toolbar showing:
- The standard name when all selected students are from the same standard
- A warning badge when students from multiple standards are selected

### 2. BulkPromotionModal.jsx

#### Auto-Detection of Source Standard
```javascript
const sourceStandard = useMemo(() => {
  if (!students || students.length === 0) return null
  const standardId = students[0].standard_id
  return standards?.find(s => s.id === standardId)
}, [students, standards])
```

#### Auto-Selection of Next Standard
```javascript
const nextStandard = useMemo(() => {
  if (!sourceStandard || !standards) return null
  
  // Sort standards by display order or name
  const sortedStandards = [...standards].sort((a, b) => {
    if (a.display_order !== undefined && b.display_order !== undefined) {
      return a.display_order - b.display_order
    }
    return (a.standard_name || a.name).localeCompare(b.standard_name || b.name)
  })
  
  const currentIndex = sortedStandards.findIndex(s => s.id === sourceStandard.id)
  if (currentIndex === -1 || currentIndex === sortedStandards.length - 1) {
    return null // No next standard (final year)
  }
  
  return sortedStandards[currentIndex + 1]
}, [sourceStandard, standards])
```

#### UI Updates
1. **Source Standard Display**: Shows the source standard in the selected students summary
2. **Target Standard**: Auto-selected and displayed as read-only (no dropdown)
3. **Final Year Handling**: Shows warning when no next standard is available
4. **Graduated Option**: Added "Graduated" status for final year students
5. **Disabled Promoted Option**: Disables "Promoted" option when no next standard exists

#### Enhanced Validation
- Only validates when promotion status is "promoted" and next standard exists
- Shows appropriate error messages for final year students
- Auto-generates batch name with source standard information

## User Experience

### Workflow
1. User filters students by standard (optional)
2. User selects multiple students from the same standard
3. Toolbar shows selected count and standard name
4. User clicks "Bulk Promote"
5. If students are from different standards → Error message
6. If students are from same standard → Modal opens with:
   - Source standard displayed
   - Target standard auto-selected (next in sequence)
   - Promotion options (Promoted/Repeated/Graduated)
   - For final year: "Promoted" disabled, "Graduated" recommended

### Benefits
- **Simplified**: No need to manually select target standard
- **Safe**: Prevents mixing students from different standards
- **Clear**: Visual indicators show which standard is being processed
- **Smart**: Automatically determines next standard in sequence
- **Flexible**: Handles final year students with "Graduated" option

## Technical Notes

### Standard Ordering
The system determines the next standard by:
1. First checking for `display_order` field (if available)
2. Falling back to alphabetical sorting by `standard_name` or `name`

### Final Year Detection
When a student is in the final standard (no next standard available):
- "Promoted" option is disabled
- Warning message displayed
- "Graduated" option recommended

### Batch Naming
Auto-generated batch names now include source standard:
```
Format: "{Source Standard} - {Status} - {Date}"
Example: "Class 5 - promoted - 4/6/2026"
```

## Files Modified
1. `src/pages/Students/StudentPromotionPage.jsx`
2. `src/components/shared/BulkPromotionModal.jsx`

## Testing Checklist
- [ ] Select students from same standard → Bulk promotion works
- [ ] Select students from different standards → Error message shown
- [ ] Promote students → Next standard auto-selected
- [ ] Final year students → "Graduated" option available
- [ ] Repeated status → Students stay in same standard
- [ ] Visual indicators show correct standard in toolbar
- [ ] Batch name includes source standard information
