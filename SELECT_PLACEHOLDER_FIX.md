# Select Placeholder Visibility Fix

## Problem
Filter dropdown placeholders (like "Select an option") were not visible enough, making it hard to see what the filter options were.

## Solution Applied

### 1. Updated Select Component (`src/components/ui/Select.jsx`)

**Changes:**
- Added dynamic text color based on whether a value is selected
- Placeholder shows in lighter gray (`text-slate-500 dark:text-slate-400`)
- Selected values show in normal text color (`text-slate-900 dark:text-slate-100`)
- Added `disabled` attribute to placeholder option when field is required
- Added explicit className to option elements for better styling

**Key Logic:**
```javascript
const hasValue = props.value && props.value !== ''
const selectClasses = `input-field ${!hasValue ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`
```

### 2. Updated Global CSS (`src/index.css`)

**Added styles:**
```css
/* Select placeholder styling */
select.input-field option[value=""] {
  @apply text-slate-400 dark:text-slate-500;
}

select.input-field:invalid {
  @apply text-slate-400 dark:text-slate-500;
}

select.input-field option:not([value=""]) {
  @apply text-slate-900 dark:text-slate-100;
}
```

## How It Works

1. **When no value is selected:**
   - Select element shows placeholder text in gray
   - Text color: `text-slate-500` (light mode) or `text-slate-400` (dark mode)
   - Placeholder is clearly visible but distinct from selected values

2. **When a value is selected:**
   - Select element shows selected value in normal text color
   - Text color: `text-slate-900` (light mode) or `text-slate-100` (dark mode)
   - Selected value is clearly readable

3. **In the dropdown:**
   - Placeholder option is grayed out
   - Regular options show in normal text color
   - Clear visual distinction between placeholder and options

## Visual Improvements

### Before:
- Placeholder text was hard to see
- Same color as selected values
- Confusing user experience

### After:
- Placeholder text is clearly visible in gray
- Selected values are in normal text color
- Clear visual feedback on selection state
- Better user experience

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers

## Files Modified

1. `src/components/ui/Select.jsx` - Component logic
2. `src/index.css` - Global styles

## Testing

Test the fix by:
1. Go to Students or Teachers list page
2. Look at the filter dropdowns
3. Placeholder text should be visible in gray
4. Select a filter option
5. Selected value should show in normal text color
6. Open dropdown again - placeholder should be grayed out

---

**Result**: Filter placeholders are now clearly visible and provide better visual feedback.
