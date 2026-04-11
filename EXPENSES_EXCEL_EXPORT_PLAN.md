# Expenses Excel Export & Update Indicator - Implementation Plan

## Requirements

### 1. Excel Export (CA-Friendly Format)
Indian CA needs to see:
- Date (DD/MM/YYYY format)
- Voucher/Reference Number
- Particulars/Description
- Category
- Debit Amount (Expenses)
- Credit Amount (if any)
- Running Balance
- Payment Method
- Academic Year
- Created By
- Modified indicator

### 2. Update Indicator
- Show "Updated" badge on expenses that have been modified
- Track when expense was last updated
- Visual indicator (badge/tag)

## Implementation Steps

### Step 1: Install xlsx library
```bash
npm install xlsx
```

### Step 2: Create Excel Export Function
- Format: Indian CA standard
- Columns: Date, Voucher No, Particulars, Category, Debit, Credit, Balance, Method, Year
- Proper number formatting (₹ symbol, 2 decimals)
- Summary row at bottom

### Step 3: Add "Updated" Indicator
- Check if `updated_at > created_at`
- Show badge in expenses list
- Color code: Orange/Yellow for updated items

### Step 4: Update Expenses List Page
- Add "Download Excel" button
- Show "Updated" badge on modified expenses
- Filter option to show only updated expenses

## Excel Format Structure

```
School Expenses Report
Academic Year: 2025-26
Generated on: 11/04/2026

Sr.No | Date       | Voucher No | Particulars      | Category  | Debit (₹) | Credit (₹) | Balance (₹) | Payment Method | Remarks
1     | 01/04/2025 | EXP-001    | Electricity Bill | Utilities | 5,000.00  | -          | 5,000.00    | Cash          | -
2     | 05/04/2025 | EXP-002    | Teacher Salary   | Salary    | 50,000.00 | -          | 55,000.00   | Bank Transfer | Updated
...

Total Expenses: ₹55,000.00
```

## Files to Modify
1. `src/pages/Expenses/ExpensesListPage.jsx` - Add export button & updated badge
2. `src/api/expenses.api.js` - Add export function
3. `src/lib/excelExport.js` - Create Excel generation utility
4. `package.json` - Add xlsx dependency

## Next Steps
1. Install xlsx library
2. Create Excel export utility
3. Update expenses list page
4. Add updated indicator logic
5. Test with sample data
