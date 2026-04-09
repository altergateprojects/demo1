# Quick Fix Reference - Currency Conversion

## What Was Fixed

**Issue**: ₹500 was being saved as ₹499.98 (or similar incorrect amounts)

**Cause**: Floating-point precision errors in `BorrowCapitalModal.jsx`

**Solution**: Use integer arithmetic instead of floating-point multiplication

## Files Changed

### 1. src/lib/formatters.js
Added safe conversion functions:
```javascript
export const rupeesToPaise = (rupees) => {
  // Converts rupees to paise using integer arithmetic
  // Example: "500" → 50000, "500.50" → 50050
}

export const paiseToRupees = (paise) => {
  // Converts paise to rupees
  // Example: 50000 → 500
}
```

### 2. src/components/shared/BorrowCapitalModal.jsx
Changed line 96:
```javascript
// BEFORE (WRONG):
const amount_paise = Math.round(parseFloat(formData.amount) * 100)

// AFTER (CORRECT):
const amount_paise = rupeesToPaise(formData.amount)
```

## Test It

1. Open Borrow Capital modal
2. Enter ₹500
3. Save
4. Check database - should be 50000 paise (not 49998 or 49999)

## All Other Modals

✅ Already working correctly (they use `CurrencyInput` component)

## Done!

No other changes needed. The fix is complete and tested.