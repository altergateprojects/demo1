# Production Deployment Guide - School Management System

## 🚀 Step-by-Step Deployment to Production

This guide will help you deploy your School Management System to production safely and securely.

---

## PRE-DEPLOYMENT REQUIREMENTS

### ✅ Completed Checklists
- [ ] PRE_DEPLOYMENT_CHECKLIST.md (Score: 80+/100)
- [ ] COMPREHENSIVE_TESTING_PLAN.md (All critical tests passed)
- [ ] SECURITY_AUDIT.md (All critical items addressed)

### ✅ Required Accounts
- [ ] Supabase account (production project)
- [ ] Hosting account (Vercel/Netlify/similar)
- [ ] Domain name (optional but recommended)
- [ ] Error monitoring (Sentry - optional)

---

## PHASE 1: DATABASE SETUP (Supabase)

### Step 1.1: Create Production Project
```bash
1. Go to https://supabase.com
2. Click "New Project"
3. Name: "school-management-prod"
4. Region: Choose closest to your users
5. Database Password: STRONG password (save it!)
6. Click "Create Project"
7. Wait for project to be ready (~2 minutes)
```

### Step 1.2: Run SQL Files (IN ORDER!)
```sql
⚠️ CRITICAL: Run these files in EXACT order

1. essential-tables-setup.sql
   - Creates all tables
   - Sets up relationships
   - Adds constraints

2. FINAL-FIX-ALL-ISSUES.sql
   - Fixes common issues
   - Sets up RLS policies
   - Creates functions

3. DISABLE_TRIGGER_FINAL_FIX.sql
   - CRITICAL: Prevents double-counting
   - Disables problematic trigger
   - Recalculates balances

4. fix-graduated-student-status-simple.sql
   - Sets up student status handling
   - Fixes graduated student filtering

5. add-student-status-validation.sql
   - Adds payment validation
   - Prevents payments to graduated students

6. fee-payment-correction-system.sql
   - Sets up payment correction system
   - Enables reversals

7. create-alumni-system-schema-fixed.sql
   - Sets up alumni system
   - Creates alumni tables

8. student-promotion-functions.sql
   - Sets up promotion system
   - Bulk promotion functions

9. complete-salary-system-schema.sql
   - Sets up teacher salary system
   - Salary payment tracking

10. borrowed-capital-schema.sql
    - Sets up capital tracking
    - Expense management

How to run:
1. Open Supabase SQL Editor
2. Copy SQL from file
3. Paste into editor
4. Click "Run"
5. Wait for success message
6. Move to next file
```

### Step 1.3: Verify Database Setup
```sql
-- Run this to verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
✅ academic_years
✅ alumni_records
✅ audit_logs
✅ expenses
✅ fee_configurations
✅ fee_payments
✅ pocket_money_transactions
✅ standards
✅ student_dues
✅ student_due_payments
✅ student_exit_dues
✅ student_promotion_history
✅ student_year_snapshots
✅ students
✅ teachers
✅ teacher_salary_history
✅ teacher_salary_payments
✅ user_profiles

-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- ALL should show rowsecurity = true
-- If false: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Step 1.4: Create Initial Data
```sql
-- 1. Create academic years
INSERT INTO academic_years (year_label, start_date, end_date, is_current)
VALUES 
  ('2024-25', '2024-04-01', '2025-03-31', false),
  ('2025-26', '2025-04-01', '2026-03-31', true);

-- 2. Create standards
INSERT INTO standards (name, sort_order)
VALUES 
  ('Nursery', 1),
  ('LKG', 2),
  ('UKG', 3),
  ('1st', 4),
  ('2nd', 5),
  ('3rd', 6),
  ('4th', 7),
  ('5th', 8),
  ('6th', 9),
  ('7th', 10),
  ('8th', 11),
  ('9th', 12),
  ('10th', 13);

-- 3. Create admin user profile (after first user signs up)
-- Get user ID from Supabase Auth dashboard
INSERT INTO user_profiles (id, full_name, role, email)
VALUES 
  ('user-id-from-auth', 'Admin Name', 'admin', 'admin@school.com');

-- 4. Create fee configurations (example)
INSERT INTO fee_configurations (
  academic_year_id, 
  standard_id, 
  gender, 
  annual_fee_paise, 
  is_active
)
SELECT 
  (SELECT id FROM academic_years WHERE is_current = true),
  id,
  'all',
  1000000, -- ₹10,000
  true
FROM standards;
```

### Step 1.5: Get API Keys
```bash
1. Go to Project Settings → API
2. Copy these values:
   - Project URL
   - anon public key
   
⚠️ NEVER share the service_role key!
⚠️ Only use anon key in frontend
```

---

## PHASE 2: FRONTEND DEPLOYMENT

### Step 2.1: Prepare Code
```bash
# 1. Clone repository
git clone https://github.com/your-repo/school-management.git
cd school-management

# 2. Install dependencies
npm install

# 3. Create production environment file
# DO NOT commit this file!
touch .env.production

# 4. Add environment variables
echo "VITE_SUPABASE_URL=your_supabase_url" >> .env.production
echo "VITE_SUPABASE_ANON_KEY=your_anon_key" >> .env.production

# 5. Test build locally
npm run build

# Should complete without errors
# Check dist/ folder created
```

### Step 2.2: Deploy to Vercel (Recommended)
```bash
# Option A: Using Vercel CLI
npm install -g vercel
vercel login
vercel --prod

# Option B: Using Vercel Dashboard
1. Go to https://vercel.com
2. Click "New Project"
3. Import from GitHub
4. Select your repository
5. Configure:
   - Framework: Vite
   - Build Command: npm run build
   - Output Directory: dist
6. Add Environment Variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
7. Click "Deploy"
8. Wait for deployment (~2 minutes)
9. Get deployment URL
```

### Step 2.3: Deploy to Netlify (Alternative)
```bash
# Option A: Using Netlify CLI
npm install -g netlify-cli
netlify login
netlify deploy --prod

# Option B: Using Netlify Dashboard
1. Go to https://netlify.com
2. Click "Add new site"
3. Import from GitHub
4. Configure:
   - Build command: npm run build
   - Publish directory: dist
5. Add Environment Variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
6. Click "Deploy"
7. Wait for deployment
8. Get deployment URL
```

### Step 2.4: Custom Domain (Optional)
```bash
# Vercel:
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Wait for SSL certificate (~5 minutes)

# Netlify:
1. Go to Domain Settings
2. Add custom domain
3. Update DNS records
4. Wait for SSL certificate
```

---

## PHASE 3: POST-DEPLOYMENT VERIFICATION

### Step 3.1: Smoke Tests
```bash
✅ Site loads without errors
✅ HTTPS working (green padlock)
✅ Login page accessible
✅ Can create account
✅ Can login
✅ Dashboard loads
✅ No console errors
✅ No 404 errors
```

### Step 3.2: Critical Functionality Tests
```bash
Test as Admin:
1. Add a student
   ✅ Student created
   ✅ Fee assigned
   ✅ Appears in list

2. Record fee payment
   ✅ Payment recorded
   ✅ Balance updated correctly
   ✅ Receipt generated
   ✅ NO double-counting

3. Add expense
   ✅ Expense created
   ✅ Dashboard updated

4. View reports
   ✅ Data accurate
   ✅ Can export PDF
   ✅ Can export Excel

5. Graduate student
   ✅ Moved to alumni
   ✅ Not in active list
   ✅ Cannot receive payments
```

### Step 3.3: Security Verification
```bash
✅ HTTPS enforced
✅ API keys not visible in source
✅ Cannot access without login
✅ Role-based access working
✅ No sensitive data in console
✅ No errors exposing secrets
```

---

## PHASE 4: MONITORING SETUP

### Step 4.1: Error Monitoring (Sentry - Optional)
```bash
1. Create Sentry account
2. Create new project
3. Get DSN
4. Install Sentry:
   npm install @sentry/react

5. Add to src/main.jsx:
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 1.0,
});

6. Redeploy
```

### Step 4.2: Uptime Monitoring
```bash
Options:
- UptimeRobot (free)
- Pingdom
- StatusCake

Setup:
1. Create account
2. Add your site URL
3. Set check interval (5 minutes)
4. Add alert email
5. Test alerts
```

### Step 4.3: Analytics (Optional)
```bash
Options:
- Google Analytics
- Plausible (privacy-friendly)
- Umami (self-hosted)

Setup:
1. Create account
2. Get tracking code
3. Add to index.html
4. Redeploy
```

---

## PHASE 5: BACKUP CONFIGURATION

### Step 5.1: Database Backups
```bash
Supabase automatically backs up daily

Verify:
1. Go to Supabase Dashboard
2. Database → Backups
3. Check backup schedule
4. Test restore (in test project first!)
```

### Step 5.2: Code Backups
```bash
✅ Code in GitHub (already backed up)
✅ Vercel/Netlify keep deployment history
✅ Can rollback to previous deployment
```

---

## PHASE 6: USER ONBOARDING

### Step 6.1: Create Admin Account
```bash
1. Go to your deployed site
2. Click "Sign Up"
3. Create admin account
4. Go to Supabase → Authentication
5. Find user ID
6. Run SQL:
   INSERT INTO user_profiles (id, full_name, role, email)
   VALUES ('user-id', 'Admin Name', 'admin', 'admin@email.com');
7. Logout and login again
8. Verify admin access
```

### Step 6.2: Create Additional Users
```bash
For each user:
1. Sign up through app
2. Get user ID from Supabase Auth
3. Create user profile:
   INSERT INTO user_profiles (id, full_name, role, email)
   VALUES ('user-id', 'User Name', 'finance', 'user@email.com');
```

### Step 6.3: Load Initial Data
```bash
1. Add academic years
2. Add standards
3. Add fee configurations
4. Add initial students (if any)
5. Add teachers
6. Test all functionality
```

---

## PHASE 7: DOCUMENTATION FOR USERS

### Step 7.1: Create User Manual
```markdown
# School Management System - User Guide

## Getting Started
1. Login with your credentials
2. Dashboard shows overview
3. Navigate using sidebar

## Adding Students
1. Go to Students → Add Student
2. Fill all required fields
3. Click Submit

## Recording Payments
1. Go to student detail page
2. Click "Record Payment"
3. Enter amount and method
4. Click Submit

... (continue for all features)
```

### Step 7.2: Create Video Tutorials (Optional)
```bash
Tools:
- Loom (screen recording)
- OBS Studio (free)
- Camtasia (paid)

Topics:
1. System overview (5 min)
2. Adding students (3 min)
3. Recording payments (5 min)
4. Managing fees (5 min)
5. Generating reports (3 min)
```

---

## PHASE 8: MAINTENANCE PLAN

### Daily Tasks
```bash
- Check error logs
- Monitor uptime
- Respond to user issues
```

### Weekly Tasks
```bash
- Review audit logs
- Check database size
- Verify backups working
- Update documentation
```

### Monthly Tasks
```bash
- Update dependencies (npm update)
- Review security alerts
- Check performance metrics
- User feedback review
```

### Quarterly Tasks
```bash
- Security audit
- Performance optimization
- Feature planning
- User training
```

---

## TROUBLESHOOTING

### Issue: Site not loading
```bash
1. Check Vercel/Netlify deployment status
2. Check DNS settings
3. Check SSL certificate
4. Check browser console for errors
5. Try incognito mode
```

### Issue: Database connection error
```bash
1. Check Supabase project status
2. Verify API keys correct
3. Check RLS policies
4. Check network connectivity
5. Check Supabase logs
```

### Issue: Login not working
```bash
1. Check Supabase Auth enabled
2. Verify email confirmation settings
3. Check user exists in Auth
4. Check user_profiles table
5. Check browser console
```

### Issue: Payments not recording
```bash
1. Check database functions exist
2. Verify RLS policies
3. Check audit logs
4. Verify no trigger issues
5. Check console for errors
```

---

## ROLLBACK PROCEDURE

### If deployment fails:
```bash
Vercel:
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

Netlify:
1. Go to Deploys
2. Find previous working deploy
3. Click "Publish deploy"

Database:
1. Go to Supabase → Database → Backups
2. Select backup point
3. Click "Restore"
4. Confirm restoration
```

---

## SUPPORT PLAN

### User Support Channels
```bash
- Email: support@yourschool.com
- Phone: +1234567890
- In-app chat (optional)
- Help documentation
```

### Response Times
```bash
- Critical issues: < 2 hours
- High priority: < 24 hours
- Medium priority: < 48 hours
- Low priority: < 1 week
```

---

## SCALING CONSIDERATIONS

### When to scale:
```bash
- 100+ concurrent users
- 10,000+ students
- Slow page loads
- Database queries slow
- High error rates
```

### How to scale:
```bash
1. Upgrade Supabase plan
2. Add database indexes
3. Implement caching
4. Optimize queries
5. Use CDN for assets
6. Consider load balancing
```

---

## LEGAL REQUIREMENTS

### Before Going Live:
```bash
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Cookie Policy (if using cookies)
- [ ] GDPR compliance (if EU users)
- [ ] Data retention policy
- [ ] Refund policy
- [ ] License agreement
```

---

## FINAL CHECKLIST

### Pre-Launch:
- [ ] All SQL files run
- [ ] Database verified
- [ ] Frontend deployed
- [ ] HTTPS working
- [ ] Admin account created
- [ ] Initial data loaded
- [ ] All tests passed
- [ ] Documentation complete
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Support plan ready
- [ ] Legal docs published

### Post-Launch:
- [ ] Monitor for 24 hours
- [ ] Fix any critical issues
- [ ] Collect user feedback
- [ ] Update documentation
- [ ] Plan next features

---

## CONGRATULATIONS! 🎉

Your School Management System is now live!

**Next Steps:**
1. Monitor closely for first week
2. Gather user feedback
3. Fix any issues quickly
4. Plan improvements
5. Market your product

**Remember:**
- Keep backups current
- Update regularly
- Monitor security
- Support your users
- Iterate and improve

**Good luck with your business! 🚀**

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Production URL:** _______________  
**Status:** LIVE ✅
