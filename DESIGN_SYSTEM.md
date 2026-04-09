# School Management System - Design System

## Overview
This design system ensures consistency across all pages with a professional, high-end look and feel.

## Design Principles
1. **Consistency**: Same patterns, spacing, and components across all pages
2. **Modern**: Gradient headers, glass-morphism effects, smooth transitions
3. **Responsive**: Mobile-first approach with proper breakpoints
4. **Accessible**: Clear hierarchy, readable fonts, proper contrast
5. **Professional**: Clean, organized, enterprise-grade appearance

## Color Themes by Module
- **Dashboard**: Blue (`from-blue-500 via-blue-600 to-blue-700`)
- **Students**: Indigo (`from-indigo-500 via-indigo-600 to-indigo-700`)
- **Teachers**: Emerald (`from-emerald-500 via-emerald-600 to-emerald-700`)
- **Fees**: Cyan (`from-cyan-500 via-cyan-600 to-cyan-700`)
- **Expenses**: Red (`from-red-500 via-red-600 to-red-700`)
- **Student Dues**: Purple (`from-purple-500 via-purple-600 to-purple-700`)
- **Salary**: Teal (`from-teal-500 via-teal-600 to-teal-700`)
- **Reports**: Amber (`from-amber-500 via-amber-600 to-amber-700`)
- **Promotion**: Violet (`from-violet-500 via-violet-600 to-violet-700`)

## Page Structure Template

### 1. Page Header (Gradient)
```jsx
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-{color}-500 via-{color}-600 to-{color}-700 p-6 sm:p-8 shadow-xl">
  <div className="absolute inset-0 bg-black/10"></div>
  <div className="relative z-10">
    {/* Icon + Title */}
    <div className="flex items-center space-x-3">
      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
        <span className="text-xl sm:text-2xl">{icon}</span>
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-sm text-{color}-100">{subtitle}</p>
      </div>
    </div>
    
    {/* Action Buttons */}
    <div className="flex gap-3 mt-4">
      <button className="px-6 py-2 bg-white text-{color}-600 hover:bg-{color}-50 rounded-lg shadow-lg">
        Primary Action
      </button>
    </div>
    
    {/* Stats Cards (if applicable) */}
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
        {/* Stat content */}
      </div>
    </div>
  </div>
</div>
```

### 2. Search & Filters Section
```jsx
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
  {/* Search Bar */}
  <div className="flex-1 max-w-md w-full">
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-slate-400" />
      </div>
      <Input className="pl-10 pr-4 py-3 rounded-xl" />
    </div>
  </div>
  
  {/* Filter Button (mobile) */}
  <button className="sm:hidden">Filters</button>
</div>

{/* Filters Card */}
<Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
      Filters
    </h3>
    <button className="text-sm text-{color}-600 hover:text-{color}-700 font-medium">
      Clear All
    </button>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {/* Filter inputs */}
  </div>
</Card>
```

### 3. Content Area - Card-Based Lists
```jsx
<div className="space-y-3">
  {items.map(item => (
    <Card 
      key={item.id}
      className="group p-5 border-slate-200 dark:border-slate-700 hover:border-{color}-300 dark:hover:border-{color}-700 hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Avatar/Icon */}
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-{color}-400 to-{color}-600 flex items-center justify-center shadow-md">
            <span className="text-lg font-bold text-white">{initial}</span>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
            {item.name}
          </h3>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            {/* Metadata */}
          </div>
        </div>
        
        {/* Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-shrink-0">
          {/* Detail columns */}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="px-4 py-2 bg-{color}-600 hover:bg-{color}-700 text-white rounded-lg">
            Action
          </button>
        </div>
      </div>
    </Card>
  ))}
</div>
```

### 4. Tabs (Pill Style)
```jsx
<div className="flex items-center gap-2 overflow-x-auto pb-2">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200 ${
        activeTab === tab.id
          ? 'bg-{color}-600 text-white shadow-lg'
          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
      }`}
    >
      <span>{tab.icon}</span>
      <span>{tab.label}</span>
      {tab.count !== undefined && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
          {tab.count}
        </span>
      )}
    </button>
  ))}
</div>
```

### 5. Empty States
```jsx
<Card className="p-12">
  <div className="text-center">
    <div className="text-6xl mb-4">{emoji}</div>
    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
      {title}
    </h3>
    <p className="text-slate-600 dark:text-slate-400 mb-6">
      {description}
    </p>
    <button className="px-6 py-2 bg-{color}-600 hover:bg-{color}-700 text-white rounded-lg">
      {actionLabel}
    </button>
  </div>
</Card>
```

### 6. Pagination
```jsx
<Card className="p-4">
  <div className="flex items-center justify-between">
    <div className="text-sm text-slate-600 dark:text-slate-400">
      Showing {start} to {end} of {total} items
    </div>
    <div className="flex items-center space-x-2">
      <button className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
        ← Previous
      </button>
      <div className="flex items-center space-x-1">
        {/* Page numbers */}
      </div>
      <button className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
        Next →
      </button>
    </div>
  </div>
</Card>
```

## Typography Scale
- **Page Title**: `text-2xl sm:text-3xl font-bold`
- **Section Title**: `text-lg font-semibold`
- **Card Title**: `text-base font-bold`
- **Body Text**: `text-sm`
- **Small Text**: `text-xs`
- **Labels**: `text-xs uppercase tracking-wide font-medium`

## Spacing Scale
- **Page Padding**: `space-y-6 pb-8`
- **Card Padding**: `p-5` or `p-6`
- **Section Gap**: `gap-4` or `gap-6`
- **Element Gap**: `gap-2` or `gap-3`

## Border Radius
- **Cards**: `rounded-xl` or `rounded-2xl`
- **Buttons**: `rounded-lg`
- **Pills/Badges**: `rounded-full`
- **Inputs**: `rounded-lg` or `rounded-xl`

## Shadows
- **Cards**: `shadow-sm hover:shadow-lg`
- **Header**: `shadow-xl`
- **Buttons**: `shadow-lg hover:shadow-xl`

## Transitions
- **All Interactive Elements**: `transition-all duration-200`
- **Hover Effects**: Border color, shadow, background

## Responsive Breakpoints
- **Mobile**: Default (< 640px)
- **Tablet**: `sm:` (≥ 640px)
- **Desktop**: `lg:` (≥ 1024px)
- **Large Desktop**: `xl:` (≥ 1280px)

## Component Patterns

### Stats Card
```jsx
<div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
  <div className="text-{color}-100 text-xs sm:text-sm font-medium">{label}</div>
  <div className="mt-1 text-xl sm:text-2xl font-bold text-white">{value}</div>
  <div className="mt-1 text-xs text-{color}-100">{subtitle}</div>
</div>
```

### Badge Variants
- **Success**: `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`
- **Warning**: `bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`
- **Danger**: `bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`
- **Info**: `bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`

### Avatar Gradients
- Match module color theme
- `bg-gradient-to-br from-{color}-400 to-{color}-600`
- White text with first initial

## Implementation Checklist
- [ ] Dashboard Page
- [ ] Students List Page
- [ ] Student Detail Page
- [ ] Add/Edit Student Pages
- [ ] Teachers List Page
- [ ] Teacher Detail Page
- [ ] Add/Edit Teacher Pages
- [ ] Fees List Page
- [ ] Expenses List Page
- [ ] Expense Detail Page
- [ ] Student Dues Page (✓ Done)
- [ ] Salary Management Page
- [ ] Student Promotion Page
- [ ] Reports Page
- [ ] Expense Audit Page
