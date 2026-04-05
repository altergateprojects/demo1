-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_profile_updated_at BEFORE UPDATE ON school_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fee_configurations_updated_at BEFORE UPDATE ON fee_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Prevent fee payment updates
CREATE OR REPLACE FUNCTION prevent_fee_payment_update() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Fee payment records cannot be modified. Use reversal to correct errors.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_update_fee_payments BEFORE UPDATE ON fee_payments FOR EACH ROW EXECUTE FUNCTION prevent_fee_payment_update();

-- Update student fee paid amount
CREATE OR REPLACE FUNCTION update_student_fee_paid() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_reversal = FALSE THEN
    UPDATE students
    SET fee_paid_paise = fee_paid_paise + NEW.amount_paise,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  ELSE
    UPDATE students
    SET fee_paid_paise = GREATEST(0, fee_paid_paise - NEW.amount_paise),
        updated_at = NOW()
    WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_fee_paid AFTER INSERT ON fee_payments FOR EACH ROW EXECUTE FUNCTION update_student_fee_paid();

-- Prevent audit log modifications
CREATE OR REPLACE FUNCTION prevent_audit_modification() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log records are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_audit_update BEFORE UPDATE ON audit_logs FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
CREATE TRIGGER trg_no_audit_delete BEFORE DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Function to generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number(academic_year TEXT)
RETURNS TEXT AS $$
DECLARE
  sequence_name TEXT;
  next_val INTEGER;
  receipt_num TEXT;
BEGIN
  sequence_name := 'receipt_seq_' || replace(academic_year, '-', '_');
  
  -- Create sequence if it doesn't exist
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1', sequence_name);
  
  -- Get next value
  EXECUTE format('SELECT nextval(%L)', sequence_name) INTO next_val;
  
  -- Format receipt number
  receipt_num := 'RCPT-' || academic_year || '-' || lpad(next_val::text, 6, '0');
  
  RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;