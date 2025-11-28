-- Migration: Create Core Tables
-- Description: Implements section 3.1 of technical-001.md
-- Creates all core database tables for the StowPilot self-storage management platform

-- ============================================================================
-- 3.1.1 User Management
-- ============================================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  business_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'staff')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('manager', 'staff')),
  permissions JSONB DEFAULT '{}',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive'))
);

-- ============================================================================
-- 3.1.2 Facility Management
-- ============================================================================

-- Facilities
CREATE TABLE IF NOT EXISTS facilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address JSONB NOT NULL, -- {street, city, state, zip, country, coordinates}
  total_units INTEGER DEFAULT 0,
  amenities JSONB DEFAULT '[]', -- Array of amenity objects
  contact_info JSONB, -- Phone, email, manager
  operating_hours JSONB, -- Days and hours
  photos JSONB DEFAULT '[]', -- Array of photo URLs
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Units
CREATE TABLE IF NOT EXISTS units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  size JSONB NOT NULL, -- {width, length, square_feet}
  type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'climate_controlled', 'outdoor', 'vehicle')),
  floor_level INTEGER DEFAULT 1,
  features JSONB DEFAULT '[]', -- Special features
  monthly_rate DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance', 'out_of_service')),
  photos JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(facility_id, unit_number)
);

-- ============================================================================
-- 3.1.3 Customer Management
-- ============================================================================

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address JSONB, -- Billing address
  emergency_contact JSONB, -- Name, phone, relationship
  identification JSONB, -- ID type, number, expiry
  credit_score INTEGER,
  background_check_status TEXT DEFAULT 'pending',
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'delinquent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer units (junction table for multiple unit rentals)
-- Note: rental_id will be added after rentals table is created
CREATE TABLE IF NOT EXISTS customer_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  rental_id UUID, -- Will reference rentals(id) after rentals table is created
  access_code TEXT, -- Unit access code
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'terminated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3.1.4 Rental Agreements
-- ============================================================================

-- Rental agreements
CREATE TABLE IF NOT EXISTS rentals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for month-to-month
  monthly_rate DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  late_fee_rate DECIMAL(10,2) DEFAULT 0, -- Percentage or flat rate
  auto_renew BOOLEAN DEFAULT true,
  insurance_required BOOLEAN DEFAULT false,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  special_terms TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'pending_signature', 'active', 'terminated', 'expired')),
  signed_at TIMESTAMP WITH TIME ZONE,
  terminated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rental documents
CREATE TABLE IF NOT EXISTS rental_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('agreement', 'addendum', 'termination', 'insurance')),
  file_path TEXT NOT NULL, -- Supabase storage path
  file_name TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  uploaded_by UUID REFERENCES profiles(id),
  signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now add foreign key constraint to customer_units.rental_id
ALTER TABLE customer_units 
  ADD CONSTRAINT customer_units_rental_id_fkey 
  FOREIGN KEY (rental_id) REFERENCES rentals(id);

-- Add unique index to prevent duplicate active assignments
-- Using a partial unique index to only enforce uniqueness for active status
CREATE UNIQUE INDEX IF NOT EXISTS customer_units_unique_active 
  ON customer_units(customer_id, unit_id) 
  WHERE status = 'active';

-- ============================================================================
-- 3.1.5 Payment and Billing
-- ============================================================================

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'ach', 'cash', 'check')),
  provider TEXT DEFAULT 'stripe', -- For stored payment methods
  provider_payment_method_id TEXT,
  last_four TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method_id UUID REFERENCES payment_methods(id),
  stripe_invoice_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method_id UUID REFERENCES payment_methods(id),
  transaction_id TEXT, -- Stripe charge ID
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ledger entries for accounting
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id),
  customer_id UUID REFERENCES customers(id),
  rental_id UUID REFERENCES rentals(id),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'adjustment')),
  category TEXT NOT NULL, -- rent, late_fee, maintenance, insurance, etc.
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  payment_id UUID REFERENCES payments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3.1.6 Maintenance and Operations
-- ============================================================================

-- Maintenance requests
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id), -- NULL for facility-wide issues
  unit_id UUID REFERENCES units(id),
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
  category TEXT NOT NULL, -- electrical, plumbing, structural, etc.
  photos JSONB DEFAULT '[]', -- Array of photo URLs
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES team_members(id),
  priority_score INTEGER GENERATED ALWAYS AS (
    CASE urgency
      WHEN 'emergency' THEN 4
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      ELSE 1
    END
  ) STORED,
  estimated_completion DATE,
  actual_completion TIMESTAMP WITH TIME ZONE,
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- locksmith, electrician, cleaner, etc.
  contact_info JSONB NOT NULL, -- phone, email, address
  services JSONB DEFAULT '[]', -- Array of services offered
  rating DECIMAL(3,2), -- 1-5 star rating
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance work orders
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_request_id UUID REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id),
  assigned_by UUID REFERENCES profiles(id),
  description TEXT NOT NULL,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled')),
  scheduled_date DATE,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- Facilities indexes
CREATE INDEX IF NOT EXISTS idx_facilities_owner_id ON facilities(owner_id);
CREATE INDEX IF NOT EXISTS idx_facilities_status ON facilities(status);
CREATE INDEX IF NOT EXISTS idx_facilities_name ON facilities(name);

-- Units indexes
CREATE INDEX IF NOT EXISTS idx_units_facility_id ON units(facility_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_units_type ON units(type);
CREATE INDEX IF NOT EXISTS idx_units_facility_unit_number ON units(facility_id, unit_number);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(last_name, first_name);

-- Customer units indexes
CREATE INDEX IF NOT EXISTS idx_customer_units_customer_id ON customer_units(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_units_unit_id ON customer_units(unit_id);
CREATE INDEX IF NOT EXISTS idx_customer_units_rental_id ON customer_units(rental_id);
CREATE INDEX IF NOT EXISTS idx_customer_units_status ON customer_units(status);

-- Rentals indexes
CREATE INDEX IF NOT EXISTS idx_rentals_customer_id ON rentals(customer_id);
CREATE INDEX IF NOT EXISTS idx_rentals_unit_id ON rentals(unit_id);
CREATE INDEX IF NOT EXISTS idx_rentals_owner_id ON rentals(owner_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_start_date ON rentals(start_date);
CREATE INDEX IF NOT EXISTS idx_rentals_end_date ON rentals(end_date);

-- Rental documents indexes
CREATE INDEX IF NOT EXISTS idx_rental_documents_rental_id ON rental_documents(rental_id);
CREATE INDEX IF NOT EXISTS idx_rental_documents_type ON rental_documents(document_type);

-- Payment methods indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_customer_id ON payment_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_status ON payment_methods(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default) WHERE is_default = true;

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_rental_id ON invoices(rental_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_processed_at ON payments(processed_at);

-- Ledger entries indexes
CREATE INDEX IF NOT EXISTS idx_ledger_entries_owner_id ON ledger_entries(owner_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_facility_id ON ledger_entries(facility_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_customer_id ON ledger_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_rental_id ON ledger_entries(rental_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_type ON ledger_entries(type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_date ON ledger_entries(date);

-- Maintenance requests indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_facility_id ON maintenance_requests(facility_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_unit_id ON maintenance_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_customer_id ON maintenance_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_urgency ON maintenance_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority_score ON maintenance_requests(priority_score);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_assigned_to ON maintenance_requests(assigned_to);

-- Vendors indexes
CREATE INDEX IF NOT EXISTS idx_vendors_owner_id ON vendors(owner_id);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);

-- Work orders indexes
CREATE INDEX IF NOT EXISTS idx_work_orders_maintenance_request_id ON work_orders(maintenance_request_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_vendor_id ON work_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled_date ON work_orders(scheduled_date);

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rentals_updated_at BEFORE UPDATE ON rentals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update facility total_units count
CREATE OR REPLACE FUNCTION update_facility_unit_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE facilities 
    SET total_units = (
      SELECT COUNT(*) FROM units WHERE facility_id = NEW.facility_id
    )
    WHERE id = NEW.facility_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE facilities 
    SET total_units = (
      SELECT COUNT(*) FROM units WHERE facility_id = OLD.facility_id
    )
    WHERE id = OLD.facility_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain facility unit count
CREATE TRIGGER update_facility_unit_count_trigger
  AFTER INSERT OR DELETE ON units
  FOR EACH ROW EXECUTE FUNCTION update_facility_unit_count();

