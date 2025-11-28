-- Migration: Enable Row Level Security and Create Policies
-- Description: Implements section 3.2.1 of technical-001.md
-- Enables RLS on all tables and creates policies for data access control

-- ============================================================================
-- Enable Row Level Security on All Tables
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Profiles Policies
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (typically done via trigger)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- Team Members Policies
-- ============================================================================

-- Owners can view their team members
CREATE POLICY "Owners can view their team members" ON team_members
  FOR SELECT USING (
    owner_id IN (SELECT id FROM profiles WHERE id = auth.uid())
    OR id IN (SELECT id FROM team_members WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Owners can insert team members
CREATE POLICY "Owners can insert team members" ON team_members
  FOR INSERT WITH CHECK (
    owner_id IN (SELECT id FROM profiles WHERE id = auth.uid())
  );

-- Owners can update their team members
CREATE POLICY "Owners can update their team members" ON team_members
  FOR UPDATE USING (
    owner_id IN (SELECT id FROM profiles WHERE id = auth.uid())
  );

-- Owners can delete their team members
CREATE POLICY "Owners can delete their team members" ON team_members
  FOR DELETE USING (
    owner_id IN (SELECT id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================================
-- Facilities Policies
-- ============================================================================

-- Users can view their own facilities
CREATE POLICY "Users can view their own facilities" ON facilities
  FOR SELECT USING (owner_id = auth.uid());

-- Users can insert their own facilities
CREATE POLICY "Users can insert their own facilities" ON facilities
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can update their own facilities
CREATE POLICY "Users can update their own facilities" ON facilities
  FOR UPDATE USING (owner_id = auth.uid());

-- Users can delete their own facilities
CREATE POLICY "Users can delete their own facilities" ON facilities
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================================
-- Units Policies
-- ============================================================================

-- Users can view units in their facilities
CREATE POLICY "Users can view units in their facilities" ON units
  FOR SELECT USING (
    facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid())
  );

-- Users can insert units in their facilities
CREATE POLICY "Users can insert units in their facilities" ON units
  FOR INSERT WITH CHECK (
    facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid())
  );

-- Users can update units in their facilities
CREATE POLICY "Users can update units in their facilities" ON units
  FOR UPDATE USING (
    facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid())
  );

-- Users can delete units in their facilities
CREATE POLICY "Users can delete units in their facilities" ON units
  FOR DELETE USING (
    facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- Customers Policies
-- ============================================================================

-- Users can view their own customers
CREATE POLICY "Users can view their own customers" ON customers
  FOR SELECT USING (owner_id = auth.uid());

-- Users can insert their own customers
CREATE POLICY "Users can insert their own customers" ON customers
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can update their own customers
CREATE POLICY "Users can update their own customers" ON customers
  FOR UPDATE USING (owner_id = auth.uid());

-- Users can delete their own customers
CREATE POLICY "Users can delete their own customers" ON customers
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================================
-- Customer Units Policies
-- ============================================================================

-- Users can view customer units for their customers
CREATE POLICY "Users can view customer units" ON customer_units
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- Users can insert customer units for their customers
CREATE POLICY "Users can insert customer units" ON customer_units
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- Users can update customer units for their customers
CREATE POLICY "Users can update customer units" ON customer_units
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- Users can delete customer units for their customers
CREATE POLICY "Users can delete customer units" ON customer_units
  FOR DELETE USING (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- Rentals Policies
-- ============================================================================

-- Users can view their own rentals
CREATE POLICY "Users can view their own rentals" ON rentals
  FOR SELECT USING (owner_id = auth.uid());

-- Users can insert their own rentals
CREATE POLICY "Users can insert their own rentals" ON rentals
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can update their own rentals
CREATE POLICY "Users can update their own rentals" ON rentals
  FOR UPDATE USING (owner_id = auth.uid());

-- Users can delete their own rentals
CREATE POLICY "Users can delete their own rentals" ON rentals
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================================
-- Rental Documents Policies
-- ============================================================================

-- Users can view documents for their rentals
CREATE POLICY "Users can view rental documents" ON rental_documents
  FOR SELECT USING (
    rental_id IN (SELECT id FROM rentals WHERE owner_id = auth.uid())
  );

-- Users can insert documents for their rentals
CREATE POLICY "Users can insert rental documents" ON rental_documents
  FOR INSERT WITH CHECK (
    rental_id IN (SELECT id FROM rentals WHERE owner_id = auth.uid())
  );

-- Users can update documents for their rentals
CREATE POLICY "Users can update rental documents" ON rental_documents
  FOR UPDATE USING (
    rental_id IN (SELECT id FROM rentals WHERE owner_id = auth.uid())
  );

-- Users can delete documents for their rentals
CREATE POLICY "Users can delete rental documents" ON rental_documents
  FOR DELETE USING (
    rental_id IN (SELECT id FROM rentals WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- Payment Methods Policies
-- ============================================================================

-- Users can view payment methods for their customers
CREATE POLICY "Users can view payment methods" ON payment_methods
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- Users can insert payment methods for their customers
CREATE POLICY "Users can insert payment methods" ON payment_methods
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- Users can update payment methods for their customers
CREATE POLICY "Users can update payment methods" ON payment_methods
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- Users can delete payment methods for their customers
CREATE POLICY "Users can delete payment methods" ON payment_methods
  FOR DELETE USING (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- Invoices Policies
-- ============================================================================

-- Users can view invoices for their customers
CREATE POLICY "Users can view invoices" ON invoices
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- Users can insert invoices for their customers
CREATE POLICY "Users can insert invoices" ON invoices
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- Users can update invoices for their customers
CREATE POLICY "Users can update invoices" ON invoices
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- Users can delete invoices for their customers
CREATE POLICY "Users can delete invoices" ON invoices
  FOR DELETE USING (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- Payments Policies
-- ============================================================================

-- Users can view payments for their customers
CREATE POLICY "Users can view payments" ON payments
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- Users can insert payments for their customers
CREATE POLICY "Users can insert payments" ON payments
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- Users can update payments for their customers
CREATE POLICY "Users can update payments" ON payments
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- Users can delete payments for their customers
CREATE POLICY "Users can delete payments" ON payments
  FOR DELETE USING (
    customer_id IN (SELECT id FROM customers WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- Ledger Entries Policies
-- ============================================================================

-- Users can view their own ledger entries
CREATE POLICY "Users can view their own ledger entries" ON ledger_entries
  FOR SELECT USING (owner_id = auth.uid());

-- Users can insert their own ledger entries
CREATE POLICY "Users can insert their own ledger entries" ON ledger_entries
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can update their own ledger entries
CREATE POLICY "Users can update their own ledger entries" ON ledger_entries
  FOR UPDATE USING (owner_id = auth.uid());

-- Users can delete their own ledger entries
CREATE POLICY "Users can delete their own ledger entries" ON ledger_entries
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================================
-- Maintenance Requests Policies
-- ============================================================================

-- Users can view maintenance requests for their facilities
CREATE POLICY "Users can view maintenance requests" ON maintenance_requests
  FOR SELECT USING (
    facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid())
  );

-- Users can insert maintenance requests for their facilities
CREATE POLICY "Users can insert maintenance requests" ON maintenance_requests
  FOR INSERT WITH CHECK (
    facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid())
  );

-- Users can update maintenance requests for their facilities
CREATE POLICY "Users can update maintenance requests" ON maintenance_requests
  FOR UPDATE USING (
    facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid())
  );

-- Users can delete maintenance requests for their facilities
CREATE POLICY "Users can delete maintenance requests" ON maintenance_requests
  FOR DELETE USING (
    facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- Vendors Policies
-- ============================================================================

-- Users can view their own vendors
CREATE POLICY "Users can view their own vendors" ON vendors
  FOR SELECT USING (owner_id = auth.uid());

-- Users can insert their own vendors
CREATE POLICY "Users can insert their own vendors" ON vendors
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can update their own vendors
CREATE POLICY "Users can update their own vendors" ON vendors
  FOR UPDATE USING (owner_id = auth.uid());

-- Users can delete their own vendors
CREATE POLICY "Users can delete their own vendors" ON vendors
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================================
-- Work Orders Policies
-- ============================================================================

-- Users can view work orders for their maintenance requests
CREATE POLICY "Users can view work orders" ON work_orders
  FOR SELECT USING (
    maintenance_request_id IN (
      SELECT id FROM maintenance_requests 
      WHERE facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid())
    )
  );

-- Users can insert work orders for their maintenance requests
CREATE POLICY "Users can insert work orders" ON work_orders
  FOR INSERT WITH CHECK (
    maintenance_request_id IN (
      SELECT id FROM maintenance_requests 
      WHERE facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid())
    )
  );

-- Users can update work orders for their maintenance requests
CREATE POLICY "Users can update work orders" ON work_orders
  FOR UPDATE USING (
    maintenance_request_id IN (
      SELECT id FROM maintenance_requests 
      WHERE facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid())
    )
  );

-- Users can delete work orders for their maintenance requests
CREATE POLICY "Users can delete work orders" ON work_orders
  FOR DELETE USING (
    maintenance_request_id IN (
      SELECT id FROM maintenance_requests 
      WHERE facility_id IN (SELECT id FROM facilities WHERE owner_id = auth.uid())
    )
  );

