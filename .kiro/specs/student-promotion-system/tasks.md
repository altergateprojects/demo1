# Implementation Plan: Student Promotion System

## Overview

This implementation plan breaks down the Student Promotion System into actionable coding tasks following a 5-phase approach: Database Setup, API Layer, React Hooks, UI Components, and Testing. The system enables fraud-proof student promotions with complete financial integrity, audit trails, and transaction atomicity.

## Key Technical Context

- Database: Supabase PostgreSQL with RLS
- Frontend: React + Vite
- State Management: React Query
- Testing: fast-check (property-based), vitest (unit tests)
- All money values in paise (convert to rupees for display)
- Existing patterns: hooks in `src/hooks/`, API in `src/api/`, components in `src/components/`

## Tasks

### Phase 1: Database Setup

- [ ] 1. Create new database tables for promotion system
  - [ ] 1.1 Create student_year_snapshots table
    - Add table with columns: id, student_id, academic_year_id, standard_id, annual_fee_paise, fee_paid_paise, fee_due_paise, pocket_money_paise, promotion_status, promoted_to_standard_id, promoted_to_academic_year_id, dues_action, dues_carried_forward_paise, snapshot_date, created_by, notes
    - Add CHECK constraints for promotion_status and dues_action enums
    - Add CHECK constraints for non-negative amounts
    - Add UNIQUE constraint on (student_id, academic_year_id)
    - Create indexes: idx_snapshots_student, idx_snapshots_year, idx_snapshots_status, idx_snapshots_dues_summary
    - _Requirements: 2.1, 2.2, 5.1, 8.4_

  - [ ] 1.2 Create promotion_batches table
    - Add table with columns: id, batch_name, source_academic_year_id, target_academic_year_id, target_standard_id, total_students, successful_promotions, failed_promotions, status, started_at, completed_at, created_by, error_summary
    - Add CHECK constraint for status enum
    - Add CHECK constraint: successful_promotions + failed_promotions <= total_students
    - Create indexes: idx_batches_year, idx_batches_status, idx_batches_created
    - _Requirements: 6.1, 6.4, 6.5_

  - [ ] 1.3 Create student_promotion_history table
    - Add table with columns: id, student_id, snapshot_id, batch_id, from_academic_year_id, to_academic_year_id, from_standard_id, to_standard_id, promotion_status, is_reversed, reversed_at, reversed_by, reversal_reason, promoted_at, promoted_by, notes
    - Add CHECK constraint for promotion_status enum
    - Add UNIQUE constraint on (student_id, from_academic_year_id)
    - Add foreign key to student_year_snapshots(id) with ON DELETE RESTRICT
    - Create indexes: idx_promo_history_student, idx_promo_history_batch, idx_promo_history_reversed
    - _Requirements: 2.5, 13.1, 13.4_

  - [ ] 1.4 Create fee_adjustments table
    - Add table with columns: id, student_id, academic_year_id, adjustment_type, amount_paise, percentage, reason, approved_by, approved_at, valid_from, valid_until, is_active, notes
    - Add CHECK constraint for adjustment_type enum
    - Add CHECK constraint for non-negative amount_paise
    - Create indexes: idx_adjustments_student, idx_adjustments_type, idx_adjustments_active
    - _Requirements: 15.1, 15.2, 16.1_

  - [ ] 1.5 Modify existing tables with new columns
    - Add columns to students table: last_promoted_at (TIMESTAMPTZ), promotion_eligible (BOOLEAN DEFAULT TRUE), promotion_hold_reason (TEXT)
    - Add columns to academic_years table: promotion_start_date (DATE), promotion_end_date (DATE), promotion_locked (BOOLEAN DEFAULT FALSE)
    - Add columns to standards table: max_capacity (INTEGER), is_final_year (BOOLEAN DEFAULT FALSE)
    - _Requirements: 9.1, 14.1, 14.2_

  - [ ]* 1.6 Write property test for database constraints
    - **Property 5: Audit Log Immutability**
    - **Validates: Requirements 2.6**

- [ ] 2. Implement core database functions
  - [ ] 2.1 Create helper validation functions
    - Implement validate_standard_capacity(p_standard_id, p_academic_year_id) function
    - Implement calculate_pending_dues(p_student_id) function
    - Implement get_fee_for_standard(p_standard_id, p_academic_year_id) function
    - _Requirements: 14.1, 2.1, 8.1_

  - [ ] 2.2 Implement promote_student_transaction function
    - Create PL/pgSQL function with parameters: p_student_id, p_target_academic_year_id, p_target_standard_id, p_promotion_status, p_dues_action, p_promoted_by, p_notes
    - Validate student exists and is active (with row lock)
    - Validate target class is empty for promoted status
    - Check standard capacity if defined
    - Create year snapshot with financial state
    - Update student record based on promotion_status
    - Handle exit dues for left_school/graduated
    - Create promotion history record
    - Create audit log entry
    - Return JSONB result with success/error
    - _Requirements: 1.1, 2.1, 2.2, 4.2, 4.3, 4.4, 10.3_

  - [ ]* 2.3 Write property tests for promote_student_transaction
    - **Property 1: Class Mixing Prevention**
    - **Property 4: Pending Dues Calculation Accuracy**
    - **Property 10: Promoted Student State Update**
    - **Property 11: Repeated Student State Update**
    - **Validates: Requirements 1.1, 2.1, 4.2, 4.3_

  - [ ] 2.4 Implement bulk_promote_students function
    - Create PL/pgSQL function with parameters: p_student_ids[], p_target_academic_year_id, p_target_standard_id, p_promotion_status, p_dues_action, p_promoted_by, p_batch_name
    - Create promotion_batches record with status='processing'
    - Validate target class is empty ONCE before processing
    - Loop through each student_id and call promote_student_transaction
    - Handle individual failures without rolling back other students
    - Update batch_id in promotion_history for each student
    - Update promotion_batches with success/failure counts
    - Return JSONB with batch summary and results array
    - _Requirements: 1.3, 4.6, 6.1, 6.4, 6.5_

  - [ ]* 2.5 Write property tests for bulk_promote_students
    - **Property 3: Bulk Validation Before Processing**
    - **Property 13: Transaction Independence**
    - **Property 15: Bulk Operation Failure Handling**
    - **Validates: Requirements 1.3, 4.6, 6.4_

  - [ ] 2.6 Implement reverse_promotion_transaction function
    - Create PL/pgSQL function with parameters: p_student_id, p_promotion_history_id, p_reversed_by, p_reversal_reason
    - Get promotion history and snapshot with row lock
    - Validate promotion not already reversed
    - Check for post-promotion transactions (reject if found)
    - Restore student to previous state (academic_year_id, standard_id, fees, pocket_money)
    - Mark promotion_history as reversed
    - Create audit log entry with action_type='REVERSE'
    - Return JSONB result
    - _Requirements: 13.1, 13.2, 13.4, 13.5_

  - [ ]* 2.7 Write property tests for reverse_promotion_transaction
    - **Property 31: Promotion Reversal Availability**
    - **Property 32: Promotion Reversal Round-Trip**
    - **Property 34: Reversal Rejection With Transactions**
    - **Validates: Requirements 13.1, 13.2, 13.5_

- [ ] 3. Implement query and reporting functions
  - [ ] 3.1 Create get_student_financial_summary function
    - Create PL/pgSQL function with parameter: p_student_id
    - Calculate current_year_dues using calculate_pending_dues
    - Sum previous_years_dues from student_year_snapshots
    - Sum total_paid from fee_payments
    - Get pocket_money_balance from students
    - Return JSONB with all financial summary fields
    - _Requirements: 10.4, 18.1, 18.2_

  - [ ] 3.2 Create get_dashboard_dues_summary function
    - Create PL/pgSQL function (no parameters, uses current academic year)
    - Calculate current_year_dues from active students
    - Sum previous_years_dues from snapshots
    - Sum exit_dues from student_exit_dues where cleared_at IS NULL
    - Calculate total_pending as sum of all three
    - Return JSONB with dashboard summary
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [ ]* 3.3 Write property tests for financial calculations
    - **Property 48: Dashboard Current Year Dues**
    - **Property 49: Dashboard Previous Years Dues**
    - **Property 51: Dashboard Total Calculation**
    - **Validates: Requirements 18.1, 18.2, 18.4_

  - [ ] 3.4 Create get_promotion_history function
    - Create SQL function to query student_promotion_history with snapshots
    - Join with student_year_snapshots for financial details
    - Order by promoted_at DESC
    - Return rows with all promotion and financial data
    - _Requirements: 5.1, 5.4_

- [ ] 4. Set up RLS policies and permissions
  - [ ] 4.1 Create RLS policies for new tables
    - Enable RLS on student_year_snapshots, promotion_batches, student_promotion_history, fee_adjustments
    - Create SELECT policy for admin/finance/principal roles
    - Create INSERT policy for admin/finance/principal roles
    - Create UPDATE policy for promotion_batches (status updates only)
    - Deny DELETE on student_year_snapshots and student_promotion_history
    - _Requirements: 19.1, 19.2, 2.6_

  - [ ] 4.2 Grant function execution permissions
    - Grant EXECUTE on all promotion functions to authenticated users
    - Add SECURITY DEFINER to functions that need elevated privileges
    - _Requirements: 19.1_

- [ ] 5. Checkpoint - Database setup complete
  - Ensure all tables created successfully
  - Verify all functions compile without errors
  - Test basic function calls with sample data
  - Ask the user if questions arise

### Phase 2: API Layer

- [ ] 6. Create studentPromotion.api.js file
  - [ ] 6.1 Implement validatePromotion function
    - Accept parameters: studentId, targetStandardId, targetAcademicYearId
    - Call database validation functions
    - Check class mixing, capacity, eligibility
    - Return object with: { eligible: boolean, warnings: string[], errors: string[] }
    - _Requirements: 1.1, 14.1_

  - [ ] 6.2 Implement promoteStudent function
    - Accept promotionData object: { studentId, targetAcademicYearId, targetStandardId, promotionStatus, duesAction, notes }
    - Call promote_student_transaction via Supabase RPC
    - Handle errors and return formatted response
    - Return: { success: boolean, studentId: UUID, snapshotId: UUID, error?: string }
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 6.3 Write unit tests for promoteStudent
    - Test successful promotion
    - Test class mixing rejection
    - Test capacity exceeded rejection
    - _Requirements: 1.1, 4.1_

  - [ ] 6.4 Implement bulkPromoteStudents function
    - Accept bulkData object: { studentIds: UUID[], targetAcademicYearId, targetStandardId, promotionStatus, duesAction, batchName? }
    - Call bulk_promote_students via Supabase RPC
    - Handle progress tracking if needed
    - Return: { totalProcessed, successful, failed, results: PromotionResult[] }
    - _Requirements: 6.1, 6.4, 6.5_

  - [ ]* 6.5 Write unit tests for bulkPromoteStudents
    - Test all successful
    - Test partial failures
    - Test complete failure
    - _Requirements: 6.4, 6.5_

  - [ ] 6.6 Implement reversePromotion function
    - Accept parameters: studentId, promotionHistoryId, reason
    - Call reverse_promotion_transaction via Supabase RPC
    - Return: { success: boolean, restoredState: StudentState, error?: string }
    - _Requirements: 13.1, 13.2_

  - [ ] 6.7 Implement getPromotionHistory function
    - Accept parameter: studentId
    - Query student_promotion_history with snapshots
    - Join with academic_years and standards for display names
    - Return array of YearSnapshot objects
    - _Requirements: 5.1, 5.4_

  - [ ] 6.8 Implement getStudentFinancialSummary function
    - Accept parameter: studentId
    - Call get_student_financial_summary via Supabase RPC
    - Return: { currentYearDues, previousYearsDues, totalPaid, pocketMoneyBalance }
    - _Requirements: 10.4, 18.1_

  - [ ] 6.9 Implement getDashboardDuesSummary function
    - Call get_dashboard_dues_summary via Supabase RPC
    - Return: { currentYearDues, previousYearsDues, exitDues, totalPending }
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ] 7. Checkpoint - API layer complete
  - Ensure all API functions work with database
  - Test error handling for common scenarios
  - Verify response formats match expected types
  - Ask the user if questions arise

### Phase 3: React Hooks

- [ ] 8. Create usePromoteStudent hook
  - [ ] 8.1 Implement usePromoteStudent with React Query mutation
    - Use useMutation from @tanstack/react-query
    - Call promoteStudent API function
    - Invalidate relevant queries on success (students list, dashboard)
    - Handle loading and error states
    - Return: { mutate: promoteStudent, isLoading, error }
    - _Requirements: 4.1_

  - [ ]* 8.2 Write unit tests for usePromoteStudent hook
    - Test successful mutation
    - Test error handling
    - Test query invalidation
    - _Requirements: 4.1_

- [ ] 9. Create useBulkPromotion hook
  - [ ] 9.1 Implement useBulkPromotion with React Query mutation
    - Use useMutation from @tanstack/react-query
    - Call bulkPromoteStudents API function
    - Track progress state if needed
    - Invalidate students list and dashboard queries on success
    - Return: { mutate: bulkPromote, isLoading, progress, error }
    - _Requirements: 6.1_

  - [ ]* 9.2 Write unit tests for useBulkPromotion hook
    - Test successful bulk operation
    - Test partial failure handling
    - _Requirements: 6.1_

- [ ] 10. Create usePromotionHistory hook
  - [ ] 10.1 Implement usePromotionHistory with React Query
    - Use useQuery from @tanstack/react-query
    - Call getPromotionHistory API function
    - Accept studentId parameter
    - Return: { data: history, isLoading, error }
    - _Requirements: 5.1_

- [ ] 11. Create useReversePromotion hook
  - [ ] 11.1 Implement useReversePromotion with React Query mutation
    - Use useMutation from @tanstack/react-query
    - Call reversePromotion API function
    - Invalidate promotion history and student queries on success
    - Return: { mutate: reversePromotion, isLoading, error }
    - _Requirements: 13.1_

- [ ] 12. Create useStudentFinancialSummary hook
  - [ ] 12.1 Implement useStudentFinancialSummary with React Query
    - Use useQuery from @tanstack/react-query
    - Call getStudentFinancialSummary API function
    - Accept studentId parameter
    - Return: { data: summary, isLoading, error }
    - _Requirements: 10.4_

- [ ] 13. Create useDashboardDuesSummary hook
  - [ ] 13.1 Implement useDashboardDuesSummary with React Query
    - Use useQuery from @tanstack/react-query
    - Call getDashboardDuesSummary API function
    - Set appropriate cache time
    - Return: { data: summary, isLoading, error, refetch }
    - _Requirements: 18.1_

- [ ] 14. Checkpoint - Hooks layer complete
  - Ensure all hooks integrate with API layer
  - Test query invalidation flows
  - Verify loading and error states work correctly
  - Ask the user if questions arise

### Phase 4: UI Components

- [ ] 15. Create StudentPromotionPage component
  - [ ] 15.1 Implement main page structure and layout
    - Create page component in src/pages/Students/StudentPromotionPage.jsx
    - Add page header with title and description
    - Add filters section (standard, status, search)
    - Add student list table with selection checkboxes
    - Add bulk action toolbar (appears when students selected)
    - Use existing UI patterns from other pages
    - _Requirements: 4.1, 6.1_

  - [ ] 15.2 Implement student list with selection
    - Fetch students for current academic year using useStudents hook
    - Display table with columns: checkbox, name, standard, pending dues, pocket money, actions
    - Implement multi-select with Set state
    - Add "Select All" checkbox in header
    - Show selected count in bulk toolbar
    - _Requirements: 4.1_

  - [ ] 15.3 Implement filters and search
    - Add standard dropdown filter
    - Add status filter (active, all)
    - Add search input for student name
    - Apply filters to student list query
    - _Requirements: 4.1_

  - [ ] 15.4 Add individual promotion buttons
    - Add "Promote" button in each row
    - Open PromotionModal on click
    - Pass student data to modal
    - _Requirements: 4.1_

  - [ ] 15.5 Add bulk promotion toolbar
    - Show toolbar when selectedStudents.size > 0
    - Add "Bulk Promote" button
    - Add "Clear Selection" button
    - Open BulkPromotionModal on bulk promote click
    - _Requirements: 6.1_

- [ ] 16. Create PromotionModal component
  - [ ] 16.1 Implement modal structure and student info display
    - Create component in src/components/shared/PromotionModal.jsx
    - Accept props: { student, isOpen, onClose, onSuccess }
    - Display student name, current standard, current year
    - Display current dues breakdown (fees + pocket money)
    - Use existing Modal component from src/components/ui/Modal.jsx
    - _Requirements: 4.1, 2.1_

  - [ ] 16.2 Add target selection inputs
    - Add academic year dropdown (default to next year)
    - Add standard dropdown (filtered by target year)
    - Show capacity warning if standard near capacity
    - _Requirements: 4.1, 14.1_

  - [ ] 16.3 Add promotion action radio buttons
    - Add radio group for: Promoted, Repeated, Left School, Graduated
    - Conditionally show/hide standard dropdown based on selection
    - Disable standard for "Left School" and "Graduated"
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ] 16.4 Add dues handling options
    - Add radio group for: Carry Forward, Waive, Require Payment
    - Show warning if "Require Payment" selected with pending dues
    - Display calculated dues_carried_forward amount
    - _Requirements: 10.3_

  - [ ] 16.5 Add validation and submission
    - Call validatePromotion API before enabling submit
    - Display validation warnings/errors
    - Add notes textarea (optional)
    - Add "Cancel" and "Promote Student" buttons
    - Call usePromoteStudent hook on submit
    - Show loading state during submission
    - Close modal and call onSuccess on completion
    - _Requirements: 1.1, 4.1_

  - [ ]* 16.6 Write component tests for PromotionModal
    - Test modal opens and displays student info
    - Test validation warnings appear
    - Test successful promotion flow
    - _Requirements: 4.1_

- [ ] 17. Create BulkPromotionModal component
  - [ ] 17.1 Implement modal structure and summary
    - Create component in src/components/shared/BulkPromotionModal.jsx
    - Accept props: { students, isOpen, onClose, onSuccess }
    - Display count of selected students
    - Show list of student names (scrollable if many)
    - _Requirements: 6.1_

  - [ ] 17.2 Add common target selection
    - Add target academic year dropdown
    - Add target standard dropdown
    - Add promotion action radio buttons
    - Add dues action radio buttons
    - _Requirements: 6.1_

  - [ ] 17.3 Add pre-validation checks
    - Run validatePromotion for target class emptiness
    - Display validation errors if any
    - Disable submit if validation fails
    - _Requirements: 1.3_

  - [ ] 17.4 Implement bulk processing with progress
    - Add progress bar component
    - Call useBulkPromotion hook on submit
    - Update progress bar during processing
    - Show "Processing X of Y students..." message
    - _Requirements: 6.1_

  - [ ] 17.5 Display results summary
    - Show success/failure counts after completion
    - Display detailed error list for failed promotions
    - Add "Export Results" button (optional)
    - Add "Close" button
    - Call onSuccess with results
    - _Requirements: 6.4, 6.5_

  - [ ]* 17.6 Write component tests for BulkPromotionModal
    - Test bulk validation
    - Test progress display
    - Test results summary
    - _Requirements: 6.1, 6.4_

- [ ] 18. Create PromotionHistoryModal component
  - [ ] 18.1 Implement modal structure and timeline
    - Create component in src/components/shared/PromotionHistoryModal.jsx
    - Accept props: { studentId, isOpen, onClose }
    - Use usePromotionHistory hook to fetch data
    - Display timeline view of academic years
    - _Requirements: 5.1_

  - [ ] 18.2 Display year-wise promotion details
    - For each year, show: academic year label, standard, promotion status
    - Show financial snapshot: annual fee, paid, due, pocket money
    - Show dues carried forward if any
    - Highlight current year
    - _Requirements: 5.1, 5.2_

  - [ ] 18.3 Add reversal actions
    - Show "Reverse Promotion" button for eligible promotions
    - Check eligibility: current year only, no post-promotion transactions
    - Open confirmation dialog on click
    - Call useReversePromotion hook
    - Refresh history after reversal
    - _Requirements: 13.1, 13.2_

  - [ ] 18.4 Add payment history links
    - Add "View Payments" link for each year
    - Link to existing payment history modal/page
    - _Requirements: 5.3_

  - [ ]* 18.5 Write component tests for PromotionHistoryModal
    - Test history display
    - Test reversal button visibility
    - Test reversal flow
    - _Requirements: 5.1, 13.1_

- [ ] 19. Create DashboardDuesSummaryWidget component
  - [ ] 19.1 Implement widget structure
    - Create component in src/components/dashboard/DuesSummaryWidget.jsx
    - Use useDashboardDuesSummary hook
    - Display card/widget layout matching dashboard style
    - _Requirements: 18.1_

  - [ ] 19.2 Display dues breakdown
    - Show current year dues with label and amount
    - Show previous years dues with label and amount
    - Show exit dues with label and amount
    - Show total pending (highlighted/bold)
    - Format amounts in rupees using formatters.js
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [ ] 19.3 Add drill-down links
    - Add "View Details" link for each category
    - Link to relevant pages (student dues page, etc.)
    - _Requirements: 18.1_

  - [ ] 19.4 Add refresh button
    - Add refresh icon button
    - Call refetch from hook on click
    - Show loading state during refresh
    - _Requirements: 18.1_

  - [ ]* 19.5 Write component tests for DashboardDuesSummaryWidget
    - Test data display
    - Test refresh functionality
    - Test drill-down links
    - _Requirements: 18.1_

- [ ] 20. Integrate promotion features into existing pages
  - [ ] 20.1 Add promotion history to StudentDetailPage
    - Add "Promotion History" button/tab in src/pages/Students/StudentDetailPage.jsx
    - Open PromotionHistoryModal on click
    - _Requirements: 5.1_

  - [ ] 20.2 Add dues summary widget to DashboardPage
    - Import and render DashboardDuesSummaryWidget in src/pages/Dashboard/DashboardPage.jsx
    - Position in appropriate section of dashboard
    - _Requirements: 18.1_

  - [ ] 20.3 Add navigation menu item
    - Add "Student Promotion" menu item in src/components/layout/Sidebar.jsx
    - Link to /students/promotion route
    - Add route in src/App.jsx
    - _Requirements: 4.1_

- [ ] 21. Checkpoint - UI components complete
  - Ensure all components render correctly
  - Test user flows end-to-end
  - Verify responsive design
  - Check accessibility (keyboard navigation, screen readers)
  - Ask the user if questions arise

### Phase 5: Testing and Integration

- [ ] 22. Create property-based tests for core properties
  - [ ]* 22.1 Write property tests for financial calculations
    - **Property 4: Pending Dues Calculation Accuracy**
    - **Property 25: Partial Payment Dues Calculation**
    - **Property 27: Running Balance Accuracy**
    - **Validates: Requirements 2.1, 10.1, 10.4**

  - [ ]* 22.2 Write property tests for dues carryforward
    - **Property 26: Dues Carryforward**
    - **Property 28: Positive Pocket Money Transfer**
    - **Validates: Requirements 10.3, 11.1**

  - [ ]* 22.3 Write property tests for exit handling
    - **Property 7: Exit Dues Recording**
    - **Property 8: Transaction History Preservation**
    - **Property 9: Exit Record Protection**
    - **Validates: Requirements 3.1, 3.3, 3.5**

  - [ ]* 22.4 Write property tests for audit logging
    - **Property 6: Audit Log Completeness**
    - **Property 33: Reversal Audit Logging**
    - **Validates: Requirements 2.2, 13.4**

  - [ ]* 22.5 Write property tests for capacity and validation
    - **Property 35: Capacity Validation**
    - **Property 36: Unlimited Capacity When Undefined**
    - **Property 37: Capacity Count Accuracy**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4**

  - [ ]* 22.6 Write property tests for fee configurations
    - **Property 20: New Year Fee Configuration Application**
    - **Property 21: Fee Configuration Change Isolation**
    - **Property 22: Fee Configuration History Preservation**
    - **Validates: Requirements 8.1, 8.3, 8.4**

  - [ ]* 22.7 Write property tests for final year handling
    - **Property 23: Final Year Graduation**
    - **Property 24: Final Year Target Prevention**
    - **Validates: Requirements 9.1, 9.3**

  - [ ]* 22.8 Write property tests for concurrency
    - **Property 29: Concurrent Promotion Conflict Detection**
    - **Property 30: Concurrent Different Student Independence**
    - **Validates: Requirements 12.1, 12.3**

- [ ] 23. Create integration tests
  - [ ]* 23.1 Write integration test for complete promotion flow
    - Test: Create student → Promote → Verify state → Check audit log
    - _Requirements: 4.1, 2.2_

  - [ ]* 23.2 Write integration test for bulk promotion flow
    - Test: Create multiple students → Bulk promote → Verify results
    - _Requirements: 6.1_

  - [ ]* 23.3 Write integration test for promotion reversal flow
    - Test: Promote student → Reverse → Verify restoration
    - _Requirements: 13.1, 13.2_

  - [ ]* 23.4 Write integration test for exit with dues flow
    - Test: Create student with dues → Mark as left school → Verify exit dues
    - _Requirements: 3.1, 3.2_

- [ ] 24. Final checkpoint and documentation
  - [ ] 24.1 Verify all requirements covered
    - Review requirements.md and ensure all 30 requirements have corresponding implementation
    - Check that all critical financial integrity requirements are met
    - _Requirements: All_

  - [ ] 24.2 Test end-to-end user scenarios
    - Scenario 1: Promote single student with dues carryforward
    - Scenario 2: Bulk promote entire class
    - Scenario 3: Student leaves school with pending dues
    - Scenario 4: Reverse incorrect promotion
    - Scenario 5: Graduate final year students
    - _Requirements: 4.1, 6.1, 3.1, 13.1, 9.1_

  - [ ] 24.3 Performance testing
    - Test bulk promotion with 100+ students
    - Test dashboard dues summary with large dataset
    - Verify query performance with indexes
    - _Requirements: 6.1, 18.1_

  - [ ] 24.4 Final checkpoint - Ensure all tests pass
    - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All money values must be handled in paise throughout the system
- Database functions provide transaction atomicity and data integrity
- React Query handles caching and invalidation automatically
- Existing patterns and components should be reused where possible
