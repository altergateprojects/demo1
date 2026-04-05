# School Financial Audit Management System

A comprehensive web-based financial audit management system for Indian schools, built with React and Supabase.

## 🚀 Quick Start

1. **Clone and Install**:
```bash
git clone <repository-url>
cd school-audit-system
npm install
```

2. **Set up Supabase**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key to `.env.local`
   - Run the database migrations (see [Setup Guide](setup.md))

3. **Start Development**:
```bash
npm run dev
```

4. **Login with Demo Credentials**:
   - **Admin**: admin@school.edu / admin123
   - **Finance**: finance@school.edu / finance123
   - **Staff**: staff@school.edu / staff123

## ✨ Features

### 🔐 Authentication & Security
- Role-based access control (Admin, Finance, Staff)
- Row Level Security (RLS) at database level
- Immutable audit trail for all transactions
- Session management with automatic refresh

### 📊 Dashboard & Analytics
- Real-time financial overview
- Student and teacher statistics
- Standard-wise fee collection summary
- Recent activity monitoring
- Critical alerts system

### 👥 Student Management
- Complete student lifecycle management
- Fee payment recording with receipt generation
- Pocket money tracking
- Academic year transitions
- Search, filter, and pagination
- Role-based data visibility

### 💰 Financial Management
- Fee collection with multiple payment methods
- Expense tracking with approval workflows
- Salary management for teachers
- Inventory asset tracking
- Monthly and annual financial reports

### 🔍 Audit & Compliance
- Immutable audit logs for all operations
- Financial transaction traceability
- User action monitoring
- System alerts for anomalies
- Export capabilities for external audits

## 🏗️ Architecture

### Frontend Stack
- **React 18** + **Vite 5** - Modern development experience
- **Tailwind CSS** - Utility-first styling with custom design system
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management and caching
- **React Hook Form** + **Zod** - Type-safe form handling

### Backend Stack
- **Supabase** - PostgreSQL database with real-time capabilities
- **Row Level Security** - Database-level authorization
- **PostgreSQL Triggers** - Data integrity and audit logging
- **Supabase Storage** - File uploads and management
- **Edge Functions** - Server-side processing

### Key Design Principles

1. **Financial Accuracy**: All monetary values stored as integers in paise
2. **Indian Standards**: Academic year (June-May), currency formatting, compliance
3. **Audit Trail**: Every financial transaction is logged and immutable
4. **Role-based Security**: Permissions enforced at database level
5. **Data Integrity**: Soft deletes, referential integrity, validation

## 📱 User Interface

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interactions
- Accessible components

### Dark/Light Mode
- System preference detection
- Manual theme switching
- Consistent theming across components

### User Experience
- Loading states and skeletons
- Error handling with user-friendly messages
- Toast notifications for actions
- Keyboard navigation support

## 🔧 Development

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI primitives
│   ├── layout/         # Layout components
│   └── shared/         # Business logic components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── api/                # Supabase API functions
├── store/              # Zustand stores
└── lib/                # Utilities and configurations
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Database Migrations
Located in `supabase/migrations/`:
1. `001_initial_schema.sql` - Core tables and relationships
2. `002_rls_policies.sql` - Row Level Security policies
3. `003_triggers.sql` - Database triggers and functions
4. `004_seed_data.sql` - Demo data for testing

## 🚀 Deployment

### Production Checklist
- [ ] Run all database migrations
- [ ] Set up storage buckets
- [ ] Configure RLS policies
- [ ] Create admin users
- [ ] Set environment variables
- [ ] Test with different user roles

### Deployment Options
- **Vercel** (recommended)
- **Netlify**
- **Any static hosting service**

Build command: `npm run build`
Output directory: `dist`

## 📋 Compliance & Standards

### Indian School Requirements
- Academic year management (June-May)
- Indian Rupee formatting with paise precision
- State board and CBSE compliance
- RTE (Right to Education) student support
- Government audit trail requirements

### Financial Compliance
- Immutable transaction records
- Complete audit trail
- Role-based access control
- Data backup and recovery
- Export capabilities for external audits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code patterns
- Add JSDoc comments for functions
- Test with different user roles
- Ensure responsive design
- Verify RLS policies work correctly

## 📚 Documentation

- [Setup Guide](setup.md) - Detailed setup instructions
- [API Documentation](docs/api.md) - API reference
- [Database Schema](docs/schema.md) - Database structure
- [User Guide](docs/user-guide.md) - End-user documentation

## 🐛 Troubleshooting

### Common Issues

1. **Login Issues**: Verify user exists in both `auth.users` and `user_profiles`
2. **Permission Errors**: Check RLS policies and user roles
3. **Data Not Loading**: Verify academic year is set correctly
4. **Build Errors**: Ensure all environment variables are set

### Getting Help
- Check existing GitHub issues
- Review Supabase documentation
- Test with demo data first
- Verify database migrations ran successfully

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com) for backend infrastructure
- UI components inspired by [Tailwind UI](https://tailwindui.com)
- Icons from [Heroicons](https://heroicons.com)
- Indian number formatting standards

---

**Note**: This system handles real financial data for educational institutions. Ensure proper security measures, regular backups, and compliance with local regulations before deploying to production.