// Application-wide type definitions

export type UserRole = 'owner' | 'manager' | 'staff'
export type SubscriptionTier = 'free' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing'

export interface User {
  id: string
  email: string
  role: UserRole
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  business_name: string | null
  phone: string | null
  role: UserRole
  subscription_tier: SubscriptionTier
  subscription_status: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  owner_id: string
  email: string
  full_name: string | null
  role: 'manager' | 'staff'
  permissions: Record<string, boolean>
  invited_at: string
  joined_at: string | null
  status: 'pending' | 'active' | 'inactive'
}

export interface Permission {
  resource: string
  action: string
  granted: boolean
}

// Facility and Unit Types
export type FacilityStatus = 'active' | 'inactive' | 'maintenance'
export type UnitType = 'standard' | 'climate_controlled' | 'outdoor' | 'vehicle'
export type UnitStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'out_of_service'

export interface Address {
  street: string
  city: string
  state: string
  zip: string
  country?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface ContactInfo {
  phone?: string
  email?: string
  manager?: string
}

export interface OperatingHours {
  [day: string]: {
    open: string
    close: string
    closed?: boolean
  }
}

export interface Facility {
  id: string
  owner_id: string
  name: string
  address: Address
  total_units: number
  amenities: Array<{ name: string; description?: string }>
  contact_info?: ContactInfo
  operating_hours?: OperatingHours
  photos: string[]
  notes?: string
  status: FacilityStatus
  created_at: string
  updated_at: string
}

export interface UnitSize {
  width: number
  length: number
  square_feet: number
}

export interface Unit {
  id: string
  facility_id: string
  unit_number: string
  size: UnitSize
  type: UnitType
  floor_level: number
  features: string[]
  monthly_rate: number
  status: UnitStatus
  photos: string[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface FacilityFilters {
  search?: string
  status?: FacilityStatus[]
  city?: string
  state?: string
}

export interface UnitFilters {
  search?: string
  facility_id?: string
  status?: UnitStatus[]
  type?: UnitType[]
  minRate?: number
  maxRate?: number
}

// Customer Types
export type CustomerStatus = 'active' | 'inactive' | 'delinquent'
export type BackgroundCheckStatus = 'pending' | 'approved' | 'rejected' | 'not_required'
export type IdentificationType = 'drivers_license' | 'passport' | 'state_id' | 'other'

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface Identification {
  type: IdentificationType
  number: string
  expiry?: string
}

export interface Customer {
  id: string
  owner_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  address?: Address
  emergency_contact?: EmergencyContact
  identification?: Identification
  credit_score: number | null
  background_check_status: BackgroundCheckStatus
  notes?: string
  status: CustomerStatus
  created_at: string
  updated_at: string
}

export interface CustomerFilters {
  search?: string
  status?: CustomerStatus[]
  background_check_status?: BackgroundCheckStatus[]
}

// Rental Types
export type RentalStatus = 'draft' | 'pending_signature' | 'active' | 'terminated' | 'expired'
export type RentalDocumentType = 'agreement' | 'addendum' | 'termination' | 'insurance'

export interface Rental {
  id: string
  customer_id: string
  unit_id: string
  owner_id: string
  start_date: string
  end_date: string | null
  monthly_rate: number
  security_deposit: number
  late_fee_rate: number
  auto_renew: boolean
  insurance_required: boolean
  insurance_provider: string | null
  insurance_policy_number: string | null
  special_terms: string | null
  status: RentalStatus
  signed_at: string | null
  terminated_at: string | null
  created_at: string
  updated_at: string
}

export interface RentalDocument {
  id: string
  rental_id: string
  document_type: RentalDocumentType
  file_path: string
  file_name: string
  version: number
  uploaded_by: string | null
  signed: boolean
  signed_at: string | null
  created_at: string
}

export interface RentalFilters {
  search?: string
  status?: RentalStatus[]
  customer_id?: string
  unit_id?: string
  facility_id?: string
}

// Payment and Billing Types
export type PaymentMethodType = 'credit_card' | 'ach' | 'cash' | 'check'
export type PaymentMethodStatus = 'active' | 'expired' | 'failed'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type LedgerEntryType = 'income' | 'expense' | 'adjustment'

export interface PaymentMethod {
  id: string
  customer_id: string
  type: PaymentMethodType
  provider: string
  provider_payment_method_id: string | null
  last_four: string | null
  expiry_month: number | null
  expiry_year: number | null
  is_default: boolean
  status: PaymentMethodStatus
  created_at: string
}

export interface Invoice {
  id: string
  customer_id: string
  rental_id: string | null
  invoice_number: string
  period_start: string
  period_end: string
  amount_due: number
  amount_paid: number
  status: InvoiceStatus
  due_date: string
  paid_at: string | null
  payment_method_id: string | null
  stripe_invoice_id: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  invoice_id: string
  customer_id: string
  amount: number
  payment_method_id: string | null
  transaction_id: string | null
  status: PaymentStatus
  processed_at: string | null
  notes: string | null
  created_at: string
}

export interface LedgerEntry {
  id: string
  owner_id: string
  facility_id: string | null
  customer_id: string | null
  rental_id: string | null
  type: LedgerEntryType
  category: string
  description: string
  amount: number
  date: string
  payment_id: string | null
  created_at: string
}

export interface InvoiceFilters {
  search?: string
  status?: InvoiceStatus[]
  customer_id?: string
  rental_id?: string
  due_date_from?: string
  due_date_to?: string
}

export interface PaymentFilters {
  search?: string
  status?: PaymentStatus[]
  customer_id?: string
  invoice_id?: string
  date_from?: string
  date_to?: string
}

export interface LedgerFilters {
  type?: LedgerEntryType[]
  category?: string
  facility_id?: string
  customer_id?: string
  rental_id?: string
  date_from?: string
  date_to?: string
}

// Reporting and Analytics Types
export interface OccupancyData {
  facility_id: string
  facility_name: string
  total_units: number
  occupied_units: number
  available_units: number
  reserved_units: number
  maintenance_units: number
  occupancy_rate: number
}

export interface RevenueData {
  date: string
  income: number
  expenses: number
  net: number
}

export interface MaintenanceMetrics {
  total_requests: number
  open_requests: number
  completed_requests: number
  average_completion_time: number | null
  total_cost: number
  requests_by_status: Record<string, number>
  requests_by_category: Record<string, number>
  requests_by_urgency: Record<string, number>
}

export interface AnalyticsMetrics {
  total_facilities: number
  total_units: number
  total_customers: number
  active_rentals: number
  total_revenue: number
  total_expenses: number
  net_profit: number
  average_occupancy_rate: number
  total_maintenance_requests: number
}

export interface ReportFilters {
  date_from?: string
  date_to?: string
  facility_id?: string
  group_by?: 'day' | 'week' | 'month' | 'year'
}

