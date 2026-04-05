# Teachers Management Module

## Overview
Complete teachers management system with CRUD operations, role-based access control, and comprehensive teacher information tracking.

## Features

### 🏫 Teacher Management
- **List View**: Paginated list with search, filtering, and sorting
- **Add Teacher**: Comprehensive form with validation
- **Edit Teacher**: Update teacher information
- **View Details**: Complete teacher profile view
- **Soft Delete**: Safe deletion with audit trail

### 🔍 Search & Filtering
- **Search**: By name, email, or phone number
- **Status Filter**: Active/Inactive teachers
- **Sorting**: By name, creation date (ascending/descending)
- **Pagination**: 25 teachers per page with navigation

### 👤 Teacher Information
- **Basic Info**: Name, email, phone, status
- **Professional**: Subject, qualification, experience
- **Contact**: Address, emergency contact details
- **Notes**: Additional information and remarks

### 🔐 Role-Based Access
- **Admin**: Full CRUD access to all teacher operations
- **Finance/Staff**: Read-only access to teacher information
- **Audit Trail**: All operations logged for compliance

## File Structure

```
src/
├── api/
│   └── teachers.api.js          # API functions for teacher operations
├── hooks/
│   └── useTeachers.js           # React Query hooks for teachers
├── pages/Teachers/
│   ├── TeachersListPage.jsx     # Main teachers listing page
│   ├── AddTeacherPage.jsx       # Add new teacher form
│   ├── EditTeacherPage.jsx      # Edit teacher form
│   └── TeacherDetailPage.jsx    # Teacher profile view
└── components/
    └── shared/                  # Reused UI components
```

## Database Schema

### Teachers Table
```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  qualification TEXT,
  experience_years INTEGER DEFAULT 0,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

## API Endpoints

### Core Operations
- `getTeachers(params)` - Get paginated teachers list
- `getTeacher(id)` - Get single teacher details
- `createTeacher(data)` - Create new teacher
- `updateTeacher(id, updates)` - Update teacher information
- `deleteTeacher(id)` - Soft delete teacher
- `getTeachersSummary()` - Get teachers statistics

### Parameters
```javascript
// getTeachers parameters
{
  page: 1,           // Page number
  limit: 25,         // Items per page
  search: '',        // Search query
  status: 'all',     // 'all', 'active', 'inactive'
  sortBy: 'full_name', // Sort field
  sortOrder: 'asc'   // 'asc' or 'desc'
}
```

## React Hooks

### Available Hooks
- `useTeachers(params)` - Get teachers list with filters
- `useTeacher(id)` - Get single teacher
- `useCreateTeacher()` - Create teacher mutation
- `useUpdateTeacher()` - Update teacher mutation
- `useDeleteTeacher()` - Delete teacher mutation
- `useTeachersSummary()` - Get teachers statistics

### Usage Example
```javascript
import { useTeachers, useCreateTeacher } from '../hooks/useTeachers'

const TeachersPage = () => {
  const { data, isLoading } = useTeachers({ status: 'active' })
  const createMutation = useCreateTeacher()
  
  const handleCreate = async (teacherData) => {
    await createMutation.mutateAsync(teacherData)
  }
  
  // Component logic...
}
```

## Form Validation

### Teacher Schema (Zod)
```javascript
const teacherSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional().or(z.literal('')),
  subject: z.string().optional(),
  qualification: z.string().optional(),
  experience_years: z.number().min(0, 'Experience cannot be negative').optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  notes: z.string().optional()
})
```

## Security & Permissions

### Row Level Security (RLS)
- **Read Access**: All authenticated users can view teachers
- **Write Access**: Only admins can create, update, or delete teachers
- **Audit Trail**: All operations logged with user information

### Role-Based UI
- **Admin**: Full access to all teacher operations
- **Finance/Staff**: Read-only access to teacher information
- **Responsive**: Works on desktop, tablet, and mobile devices

## Setup Instructions

### 1. Database Setup
Run the database migration script:
```sql
-- Run update-teachers-schema.sql in Supabase SQL editor
```

### 2. Navigation
Teachers navigation is already included in the sidebar for users with appropriate roles.

### 3. Routes
All teacher routes are configured in `src/App.jsx`:
- `/teachers` - Teachers list
- `/teachers/add` - Add teacher (Admin only)
- `/teachers/:id` - Teacher details
- `/teachers/:id/edit` - Edit teacher (Admin only)

## Usage Examples

### Adding a Teacher
1. Navigate to `/teachers`
2. Click "Add Teacher" (Admin only)
3. Fill in teacher information
4. Submit form
5. Teacher is created with audit trail

### Searching Teachers
1. Use search box to find by name, email, or phone
2. Filter by status (Active/Inactive)
3. Sort by name or creation date
4. Navigate through pages

### Viewing Teacher Details
1. Click "View" on any teacher in the list
2. See complete teacher profile
3. Access edit/delete options (Admin only)

## Future Enhancements

### Planned Features
- **Photo Upload**: Teacher profile pictures
- **Class Assignment**: Link teachers to classes/subjects
- **Schedule Management**: Teacher timetables
- **Performance Tracking**: Teaching evaluations
- **Document Management**: Certificates, contracts
- **Attendance Tracking**: Teacher attendance system

### Integration Points
- **Salary Module**: Link to payroll system
- **Class Management**: Assign teachers to classes
- **Reports**: Teacher performance reports
- **Notifications**: Teacher-related alerts

## Troubleshooting

### Common Issues
1. **Permission Denied**: Ensure user has admin role for write operations
2. **Validation Errors**: Check form inputs match schema requirements
3. **Database Errors**: Verify teachers table schema is up to date
4. **Search Not Working**: Check if search query is properly formatted

### Debug Tips
- Check browser console for API errors
- Verify user roles in user_profiles table
- Ensure RLS policies are properly configured
- Check audit_logs table for operation history

The Teachers module is now fully functional and ready for production use!