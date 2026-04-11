#!/bin/bash

# Git Push Commands
# Run these commands in your terminal

echo "📦 Adding all changes to git..."
git add -A

echo "💬 Creating commit..."
git commit -m "feat: Add notifications system, fix currency precision, improve UI

- Add admin notification system with bell icon and notifications page
- Fix currency precision errors (₹10,000 → ₹9,999.94 bug)
- Add Excel export for expenses (CA-friendly format)
- Add 'Updated' badge for edited expenses
- Make notifications list more compact and readable
- Remove demo credentials from login page
- Fix notification real-time subscription issues
- Add notification functions and schema
- Improve CurrencyInput to use integer arithmetic
- Update notification bell and page styling"

echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Done! Check your GitHub repository."
