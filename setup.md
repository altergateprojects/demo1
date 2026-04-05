# School Financial Audit Management System - Setup Guide

## Prerequisites

1. **Node.js 18+** and npm
2. **Supabase Account** - Sign up at [supabase.com](https://supabase.com)
3. **Git** for version control

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Supabase Setup

1. **Create a new Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization
   - Enter project name: "School Audit System"
   - Generate a strong database password
   - Select a region close to your users

2. **Get your project credentials**:
   - Go to Settings → API
   - Copy the Project URL and anon public key
   - Update `.env.local` with your credentials

3. **Run database migrations**:
   - Go to SQL Editor in your Supabase dashboard
   - Run each migration file in order:
     1. `supabase/migrations/001_initial_schema.sql`
     2. `supabase/migrations/002_rls_policies.sql`
     3. `supabase/migrations/003_triggers.sql`
     4. `supabase/migrations/004_seed_data.sql`

4. **Create Storage Buckets**:
   - Go to Storage in Supabase dashboard
   - Create these buckets (all private):
     - `student-photos`
     - `teacher-photos`
     - `receipts`
     - `expense-bills`
     - `salary-slips`
     - `reports`
     - `school-assets`

5. **Create Demo Users**:
   - Go to Authentication → Users
   - Create these users manually:
     
     **Admin User:**
     - Email: `admin@school.edu`
     - Password: `admin123`
     - After creating, run this SQL:
     ```sql
     INSERT INTO user_profiles (id, full_name, role, phone, is_active)
     VALUES (
       '[USER_ID_FROM_AUTH_USERS]',
       'School Administrator',
       'admin',
       '+91 98765 43210',
       true
     );
     ```
     
     **Finance User:**
     - Email: `finance@school.edu`
     - Password: `finance123`
     - After creating, run this SQL:
     ```sql
     INSERT INTO user_profiles (id, full_name, role, phone, is_active)
     VALUES (
       '[USER_ID_FROM_AUTH_USERS]',
       'Finance Manager',
       'finance',
       '+91 87654 32109',
       true
     );
     ```
     
     **Staff User:**
     - Email: `staff@school.edu`
     - Password: `staff123`
     - After creating, run this SQL:
     ```sql
     INSERT INTO user_profiles (id, full_name, role, phone, is_active)
     VALUES (
       '[USER_ID_FROM_AUTH_USERS]',
       'School Staff',
       'staff',
       '+91 76543 21098',
       true
     );
     ```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Login Credentials

Use these credentials to test different user roles:

- **Administrator**: admin@school.edu / admin123
- **Finance Staff**: finance@school.edu / finance123
- **Staff**: staff@school.edu / staff123

## Features Available

### ✅ Completed Features

1. **Authentication & Authorization**
   - Role-based access control (Admin, Finance, Staff)
   - Secure login/logout
   - Session management

2. **Dashboard**
   - Real-time financial overview
   - Student/teacher counts
   - Standard-wise fee summary
   - Recent activity feed

3. **Student Management**
   - Complete CRUD operations
   - Fee payment recording
   - Search and filtering
   - Pagination
   - Role-based data visibility

4. **Database & Security**
   - Complete PostgreSQL schema
   - Row Level Security (RLS)
   - Audit logging
   - Data validation

5. **UI/UX**
   - Responsive design
   - Dark/light mode
   - Loading states
   - Error handling
   - Toast notifications

### 🚧 In Progress / To Be Completed

1. **Teachers Module**
   - Teacher CRUD operations
   - Salary management
   - Document uploads

2. **Expenses Module**
   - Expense recording
   - Approval workflows
   - Bill uploads

3. **Reports Module**
   - PDF generation
   - Excel exports
   - Monthly audit reports

4. **Settings Module**
   - School profile management
   - Fee configuration
   - User management

## Architecture Overview

### Frontend Stack
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Query** for server state
- **React Hook Form** + Zod for forms

### Backend Stack
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row Level Security** for authorization
- **PostgreSQL triggers** for data integrity
- **Audit logging** for compliance

### Key Design Decisions

1. **Monetary Values**: All amounts stored as integers in paise (₹1 = 100 paise)
2. **Academic Year**: June to May (Indian standard)
3. **Audit Trail**: Immutable logs for all financial transactions
4. **Role-based Security**: Enforced at database level via RLS
5. **Soft Deletes**: Students/teachers are never hard-deleted

## Development Guidelines

### Adding New Features

1. **Database Changes**:
   - Create migration files in `supabase/migrations/`
   - Update RLS policies as needed
   - Add audit logging for new entities

2. **API Layer**:
   - Add functions to `src/api/[module].api.js`
   - Follow existing patterns for error handling
   - Include audit logging

3. **React Hooks**:
   - Create hooks in `src/hooks/use[Module].js`
   - Use React Query for caching and synchronization
   - Handle loading and error states

4. **UI Components**:
   - Follow existing component patterns
   - Use TypeScript-style JSDoc comments
   - Ensure responsive design

### Code Quality

- Use ESLint for code linting
- Follow existing naming conventions
- Add JSDoc comments for functions
- Test with different user roles
- Verify RLS policies work correctly

## Deployment

### Production Checklist

1. **Environment Variables**:
   - Set production Supabase URL and keys
   - Configure proper CORS settings

2. **Database**:
   - Run all migrations
   - Set up automated backups
   - Configure monitoring

3. **Security**:
   - Review all RLS policies
   - Test with different user roles
   - Enable audit logging

4. **Performance**:
   - Optimize database indexes
   - Configure CDN for assets
   - Enable compression

### Deployment Options

- **Vercel** (recommended for React apps)
- **Netlify**
- **Any static hosting service**

Build command: `npm run build`
Output directory: `dist`

## Support

For issues and questions:
1. Check the existing code patterns
2. Review Supabase documentation
3. Test with demo data first
4. Verify RLS policies are working

## License

This project is licensed under the MIT License.