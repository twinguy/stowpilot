# Technical Implementation Plan: Self-Storage Management Platform
## Document ID: TECHNICAL-001
## Version: 1.1
## Date: November 27, 2025
## Authors: AI Technical Lead

---

## Executive Summary

This technical implementation plan outlines the development of a comprehensive self-storage management platform (codename: StowPilot) based on the functional requirements in `day1.md` and the tooling recommendations in `tooling.md`. The platform will leverage Supabase as the backend-as-a-service provider and Vercel for frontend hosting, with a full-stack Next.js application utilizing shadcn/ui components for the user interface.

The implementation focuses on delivering an MVP that addresses all core business requirements while establishing a scalable architecture for future enhancements.

---

## 1. Repository Structure and Organization

### 1.1 Overall Repository Layout

```
stowpilot/
├── docs/                          # Documentation
│   ├── technical-001.md          # This technical specification
│   ├── day1.md                   # Business requirements
│   ├── tooling.md               # Tooling decisions
│   ├── api-docs.md              # API documentation
│   └── deployment-guide.md      # Deployment procedures
├── src/
│   ├── app/                      # Next.js app router
│   │   ├── (auth)/               # Authentication routes
│   │   ├── (dashboard)/          # Protected dashboard routes
│   │   │   ├── facilities/       # Facility management
│   │   │   ├── units/           # Unit inventory
│   │   │   ├── customers/       # Customer management
│   │   │   ├── rentals/         # Rental agreements
│   │   │   ├── billing/         # Payment & billing
│   │   │   ├── maintenance/     # Maintenance operations
│   │   │   └── reports/         # Analytics & reporting
│   │   ├── api/                 # API routes (Next.js)
│   │   ├── globals.css          # Global styles
│   │   └── layout.tsx           # Root layout
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── forms/               # Form components
│   │   ├── layouts/             # Layout components
│   │   └── shared/              # Shared components
│   ├── lib/                     # Utility libraries
│   │   ├── supabase/            # Supabase client & utilities
│   │   ├── validations/         # Form validations (Zod)
│   │   ├── hooks/               # Custom React hooks
│   │   └── utils/               # General utilities
│   ├── types/                   # TypeScript type definitions
│   │   ├── database.ts          # Supabase generated types
│   │   └── index.ts             # Application types
│   └── middleware.ts            # Next.js middleware
├── supabase/                    # Supabase configuration
│   ├── config.toml              # Supabase project config
│   ├── migrations/              # Database migrations
│   ├── seed.sql                 # Seed data
│   └── functions/               # Edge functions
│       ├── _shared/             # Shared utilities
│       ├── stripe-webhook/      # Payment webhooks
│       ├── email-notifications/ # Email automation
│       └── maintenance-automation/ # Maintenance workflows
├── public/                      # Static assets
│   ├── images/                  # Image assets
│   └── icons/                   # Icon assets
├── tests/                       # Test suites
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
├── .github/                     # GitHub Actions & configuration
│   ├── workflows/               # CI/CD pipelines
│   └── ISSUE_TEMPLATE/          # Issue templates
├── package.json                 # Node.js dependencies
├── tailwind.config.js           # Tailwind CSS configuration
├── next.config.js               # Next.js configuration
├── vercel.json                  # Vercel deployment config
└── README.md                    # Project documentation
```

### 1.2 Key Directory Explanations

- **docs/**: Comprehensive documentation including this technical spec
- **src/app/**: Next.js 16+ app router with route groups for organization
- **src/components/**: Modular component architecture with shadcn/ui
- **src/lib/**: Business logic, utilities, and third-party integrations
- **supabase/**: Backend-as-a-service configuration and serverless functions
- **tests/**: Complete test coverage across all layers

---

## 2. Technology Stack and Architecture

### 2.1 Core Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Frontend Framework** | Next.js | 16+ (App Router) | Full-stack React framework |
| **UI Components** | shadcn/ui + Tailwind CSS | Latest | Component library and styling |
| **Backend** | Supabase | Latest | BaaS with PostgreSQL, Auth, Storage |
| **Hosting** | Vercel | Latest | Frontend deployment and edge functions |
| **Language** | TypeScript | 5.3+ | Type safety across the application |
| **State Management** | Zustand | Latest | Client-side state management |
| **Form Handling** | React Hook Form + Zod | Latest | Form validation and handling |
| **Database** | PostgreSQL (via Supabase) | Latest | Primary data storage |
| **Authentication** | Supabase Auth | Latest | User authentication and authorization |
| **File Storage** | Supabase Storage | Latest | Document and image storage |
| **Real-time** | Supabase Realtime | Latest | Live updates and notifications |
| **Payments** | Stripe | Latest | Payment processing |
| **Email** | Resend/Postmark | Latest | Transactional emails |

### 2.2 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Supabase      │    │   Third-party   │
│   (Frontend)    │◄──►│   Backend       │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • React/TSX     │    │ • PostgreSQL    │    │ • Stripe        │
│ • Shadcn/UI     │    │ • Auth          │    │ • Email APIs    │
│ • Zustand       │    │ • Storage       │    │ • Maps API      │
│ • Vercel Deploy │    │ • Edge Functions│    │ • DocuSign      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    │                 │
                    │ • Facilities    │
                    │ • Units         │
                    │ • Customers     │
                    │ • Rentals       │
                    │ • Payments      │
                    │ • Maintenance   │
                    └─────────────────┘
```

---

## 3. Database Design and Schema

### 3.1 Core Tables

#### 3.1.1 User Management
```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
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
CREATE TABLE team_members (
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
```

#### 3.1.2 Facility Management
```sql
-- Facilities
CREATE TABLE facilities (
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
CREATE TABLE units (
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
```

#### 3.1.3 Customer Management
```sql
-- Customers
CREATE TABLE customers (
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
CREATE TABLE customer_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  rental_id UUID REFERENCES rentals(id), -- For tracking active rentals
  access_code TEXT, -- Unit access code
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'terminated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, unit_id, status) -- Prevent duplicate active assignments
);
```

#### 3.1.4 Rental Agreements
```sql
-- Rental agreements
CREATE TABLE rentals (
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
CREATE TABLE rental_documents (
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
```

#### 3.1.5 Payment and Billing
```sql
-- Payment methods
CREATE TABLE payment_methods (
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
CREATE TABLE invoices (
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
CREATE TABLE payments (
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
CREATE TABLE ledger_entries (
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
```

#### 3.1.6 Maintenance and Operations
```sql
-- Maintenance requests
CREATE TABLE maintenance_requests (
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
CREATE TABLE vendors (
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
CREATE TABLE work_orders (
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
```

### 3.2 Database Features and Policies

#### 3.2.1 Row Level Security (RLS) Policies
All tables will implement RLS with policies ensuring users can only access their own data:

```sql
-- Example RLS policy for facilities
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own facilities" ON facilities
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own facilities" ON facilities
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own facilities" ON facilities
  FOR UPDATE USING (owner_id = auth.uid());
```

#### 3.2.2 Indexes and Performance
Critical indexes for performance:
- Composite indexes on frequently queried combinations
- Partial indexes for active records
- Full-text search indexes for text fields
- Spatial indexes for geographic queries (if needed)

#### 3.2.3 Triggers and Functions
Database functions for:
- Automatic invoice generation
- Late fee calculations
- Occupancy rate computations
- Audit logging

---

## 4. Backend Architecture (Supabase)

### 4.1 Edge Functions

#### 4.1.1 Authentication & User Management
- `user-registration`: Handle new user signup with email verification
- `user-onboarding`: Complete profile setup and facility creation
- `team-invitation`: Send and process team member invitations
- `subscription-management`: Handle billing and tier changes

#### 4.1.2 Payment Processing
- `stripe-webhook`: Process Stripe payment events
- `invoice-generation`: Automated monthly invoice creation
- `payment-failure`: Handle failed payments and notifications
- `subscription-billing`: Process recurring subscription charges

#### 4.1.3 Business Logic
- `maintenance-workflow`: Automated maintenance request processing
- `rental-notifications`: Send renewal and termination notices
- `occupancy-reports`: Generate periodic occupancy analytics
- `backup-operations`: Database backup and export functions

#### 4.1.4 Integrations
- `email-service`: Send transactional emails via Resend/Postmark
- `document-signing`: Integrate with DocuSign for agreements
- `maps-integration`: Address validation and facility mapping
- `background-checks`: Third-party screening service integration

### 4.2 Storage Buckets

```
supabase-storage/
├── facilities/           # Facility photos and documents
│   └── {facility_id}/
├── units/               # Unit photos
│   └── {unit_id}/
├── customers/           # Customer documents (ID, agreements)
│   └── {customer_id}/
├── rentals/            # Rental agreements and addendums
│   └── {rental_id}/
├── maintenance/        # Maintenance photos and reports
│   └── {request_id}/
└── avatars/            # User profile pictures
    └── {user_id}/
```

### 4.3 Real-time Subscriptions

Real-time subscriptions for live updates:
- Facility and unit availability changes
- Maintenance request status updates
- Payment status changes
- New rental agreements
- Occupancy rate changes

---

## 5. Frontend Architecture (Next.js + Shadcn)

### 5.1 Application Structure

#### 5.1.1 Route Organization
```
src/app/
├── (auth)/                    # Authentication routes
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
├── (dashboard)/              # Protected dashboard
│   ├── layout.tsx            # Dashboard layout with sidebar
│   ├── page.tsx              # Dashboard overview
│   ├── facilities/           # Facility management
│   │   ├── page.tsx          # Facilities list
│   │   ├── [id]/page.tsx     # Facility details
│   │   ├── [id]/edit/page.tsx # Edit facility
│   │   └── new/page.tsx      # Add facility
│   ├── units/               # Unit management
│   │   ├── page.tsx         # Units overview
│   │   ├── [id]/page.tsx    # Unit details
│   │   └── bulk-import/page.tsx # CSV import
│   ├── customers/           # Customer management
│   │   ├── page.tsx         # Customers list
│   │   ├── [id]/page.tsx    # Customer profile
│   │   ├── [id]/rentals/page.tsx # Customer rentals
│   │   └── new/page.tsx     # Add customer
│   ├── rentals/            # Rental agreements
│   │   ├── page.tsx         # Active rentals
│   │   ├── [id]/page.tsx    # Rental details
│   │   ├── new/page.tsx     # Create rental
│   │   └── templates/page.tsx # Agreement templates
│   ├── billing/            # Payment & billing
│   │   ├── page.tsx         # Invoices overview
│   │   ├── invoices/[id]/page.tsx # Invoice details
│   │   ├── payments/page.tsx # Payment history
│   │   └── settings/page.tsx # Billing settings
│   ├── maintenance/        # Maintenance operations
│   │   ├── page.tsx         # Maintenance dashboard
│   │   ├── requests/page.tsx # All requests
│   │   ├── [id]/page.tsx    # Request details
│   │   ├── vendors/page.tsx # Vendor directory
│   │   └── new-request/page.tsx # Submit request
│   └── reports/            # Analytics & reporting
│       ├── page.tsx         # Reports dashboard
│       ├── occupancy/page.tsx # Occupancy reports
│       ├── revenue/page.tsx # Financial reports
│       └── maintenance/page.tsx # Maintenance reports
├── api/                    # API routes
│   ├── auth/callback/route.ts # Auth callback
│   ├── webhooks/stripe/route.ts # Stripe webhooks
│   └── health/route.ts     # Health check
└── (public)/              # Public routes
    ├── about/page.tsx     # About page
    └── contact/page.tsx   # Contact page
```

#### 5.1.2 Component Architecture

##### Core Layout Components
- `AppSidebar`: Main navigation sidebar
- `DashboardHeader`: Top header with user menu and notifications
- `BreadcrumbNavigation`: Page breadcrumbs
- `DataTable`: Reusable table component with sorting/filtering
- `Modal`: Reusable modal dialogs
- `FormField`: Standardized form field wrapper

##### Feature-Specific Components
- `FacilityCard`: Facility overview card
- `UnitGrid`: Unit layout visualization
- `CustomerProfile`: Customer information display
- `RentalAgreement`: Agreement document viewer
- `InvoiceGenerator`: Invoice creation interface
- `MaintenanceTimeline`: Maintenance request timeline
- `ChartContainer`: Reusable chart wrapper

##### Form Components
- `FacilityForm`: Add/edit facility form
- `UnitForm`: Add/edit unit form
- `CustomerForm`: Customer information form
- `RentalForm`: Rental agreement creation
- `PaymentForm`: Payment method setup
- `MaintenanceForm`: Maintenance request form

### 5.2 State Management

#### 5.2.1 Global State (Zustand)
```typescript
// User session and profile
interface UserStore {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  permissions: Permission[];
}

// Application settings
interface AppStore {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notifications: Notification[];
}

// Business data stores
interface FacilityStore {
  facilities: Facility[];
  currentFacility: Facility | null;
  filters: FacilityFilters;
}

interface CustomerStore {
  customers: Customer[];
  selectedCustomer: Customer | null;
  searchQuery: string;
}
```

#### 5.2.2 Server State (TanStack Query)
- Facility and unit data
- Customer information
- Rental agreements
- Payment history
- Maintenance requests
- Real-time subscriptions

### 5.3 UI/UX Design System

#### 5.3.1 Design Tokens
- Color palette (primary, secondary, neutral, status colors)
- Typography scale (headings, body text, captions)
- Spacing scale (margins, padding, gaps)
- Border radius, shadows, and other visual elements

#### 5.3.2 Component Patterns
- Consistent button styles and states
- Form layouts and validation styling
- Table designs with proper responsive behavior
- Card layouts for data display
- Navigation patterns and breadcrumbs

#### 5.3.3 Responsive Design
- Mobile-first approach
- Tablet and desktop breakpoints
- Touch-friendly interactions
- Optimized layouts for different screen sizes

---

## 6. Authentication and Authorization

### 6.1 Authentication Flow

#### 6.1.1 User Registration
1. Email/password registration via Supabase Auth
2. Email verification required
3. Profile completion wizard
4. Facility setup (first-time users)
5. Subscription selection

#### 6.1.2 Login Process
1. Email/password authentication
2. Optional MFA via authenticator apps
3. Social login options (Google, etc.)
4. Session management with refresh tokens

#### 6.1.3 Password Recovery
1. Email-based password reset
2. Secure token generation
3. Password strength validation
4. Account recovery notifications

### 6.2 Authorization System

#### 6.2.1 Role-Based Access Control
```typescript
enum UserRole {
  OWNER = 'owner',      // Full access to all facilities
  MANAGER = 'manager',  // Manage assigned facilities
  STAFF = 'staff'       // Limited access (customer service, maintenance)
}

enum Permission {
  FACILITY_CREATE = 'facility:create',
  FACILITY_EDIT = 'facility:edit',
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_EDIT = 'customer:edit',
  RENTAL_CREATE = 'rental:create',
  PAYMENT_PROCESS = 'payment:process',
  MAINTENANCE_ASSIGN = 'maintenance:assign',
  REPORTS_VIEW = 'reports:view'
}
```

#### 6.2.2 Route Protection
- Middleware for route-level protection
- Component-level permission checks
- API endpoint authorization
- Real-time subscription filtering

#### 6.2.3 Team Member Management
- Invitation system with role assignment
- Permission granularity
- Activity logging and audit trails
- Access revocation capabilities

---

## 7. Feature Implementation Breakdown

### 7.1 Module 1: User Authentication & Account Management

#### 7.1.1 Components
- `LoginForm`: Email/password login with validation
- `RegistrationWizard`: Multi-step signup process
- `ProfileSettings`: User profile management
- `TeamManagement`: Team member invitation and management
- `SubscriptionSettings`: Billing and plan management

#### 7.1.2 API Integration
- Supabase Auth for authentication
- Custom user profiles table
- Stripe for subscription management
- Email service for notifications

#### 7.1.3 Key Features
- Secure password hashing
- Email verification workflow
- Password reset functionality
- Multi-factor authentication
- Social login integration

### 7.2 Module 2: Facility and Unit Inventory Management

#### 7.2.1 Components
- `FacilityGrid`: Overview of all facilities
- `FacilityForm`: Add/edit facility details
- `UnitLayout`: Visual unit layout representation
- `UnitForm`: Individual unit management
- `BulkImportWizard`: CSV import functionality
- `SearchFilters`: Advanced filtering and search

#### 7.2.2 API Integration
- CRUD operations for facilities and units
- File upload for photos
- Google Maps integration for addresses
- Real-time availability updates

#### 7.2.3 Key Features
- Facility portfolio management
- Unit type categorization
- Bulk operations support
- Search and filtering capabilities
- Photo management system

### 7.3 Module 3: Customer Management

#### 7.3.1 Components
- `CustomerTable`: Customer list with search
- `CustomerProfile`: Detailed customer view
- `CustomerForm`: Add/edit customer information
- `ScreeningForm`: Applicant screening process
- `CommunicationCenter`: Email and messaging

#### 7.3.2 API Integration
- Customer CRUD operations
- Document storage for ID verification
- Email service integration
- Background check service integration

#### 7.3.3 Key Features
- Customer database management
- Unit assignment tracking
- Communication history
- Screening and approval workflows

### 7.4 Module 4: Rental Agreement Management

#### 7.4.1 Components
- `RentalWizard`: Step-by-step rental creation
- `AgreementBuilder`: Customizable agreement templates
- `DocumentViewer`: PDF agreement display
- `SignaturePad`: Digital signature capture
- `RentalTimeline`: Agreement status tracking

#### 7.4.2 API Integration
- DocuSign integration for e-signatures
- PDF generation service
- Document storage and versioning
- Email notifications for agreements

#### 7.4.3 Key Features
- Template-based agreement creation
- Digital signing workflow
- Document version control
- Automated renewal reminders
- Compliance template management

### 7.5 Module 5: Payment and Billing Management

#### 7.5.1 Components
- `InvoiceDashboard`: Invoice overview and management
- `PaymentForm`: Payment method setup
- `BillingHistory`: Payment and transaction history
- `LedgerView`: Accounting ledger display
- `ReportGenerator`: Financial report creation

#### 7.5.2 API Integration
- Stripe payment processing
- Automated invoicing system
- ACH and credit card support
- Receipt generation and emailing

#### 7.5.3 Key Features
- Automated invoice generation
- Multiple payment methods
- Late fee calculation and application
- Financial reporting and export
- Delinquency management workflow

### 7.6 Module 6: Maintenance and Facility Operations

#### 7.6.1 Components
- `MaintenanceDashboard`: Request overview and management
- `RequestForm`: Customer maintenance submission
- `WorkOrderManager`: Technician assignment and tracking
- `VendorDirectory`: Service provider management
- `TimelineView`: Maintenance history and scheduling

#### 7.6.2 API Integration
- Real-time request notifications
- Photo upload for maintenance issues
- Vendor management system
- Automated scheduling and reminders

#### 7.6.3 Key Features
- Customer request submission
- Priority-based assignment
- Status tracking and updates
- Vendor performance ratings
- Maintenance history logging

### 7.7 Module 7: Reporting and Analytics

#### 7.7.1 Components
- `AnalyticsDashboard`: Key metrics overview
- `OccupancyChart`: Occupancy rate visualizations
- `RevenueReports`: Financial performance charts
- `MaintenanceAnalytics`: Maintenance efficiency metrics
- `ExportTools`: Data export functionality

#### 7.7.2 API Integration
- Real-time data aggregation
- Chart generation libraries
- PDF report creation
- CSV export capabilities

#### 7.7.3 Key Features
- Real-time dashboard updates
- Customizable date ranges
- Multiple chart types and visualizations
- Automated report scheduling
- Data export in various formats

---

## 8. Security and Compliance

### 8.1 Data Security

#### 8.1.1 Encryption
- Data at rest: AES-256 encryption in Supabase
- Data in transit: TLS 1.3 encryption
- Sensitive data: Additional field-level encryption

#### 8.1.2 Access Control
- Row-level security (RLS) on all tables
- API endpoint authentication
- File storage access controls
- Audit logging for all operations

### 8.2 Compliance Requirements

#### 8.2.1 GDPR/CCPA Compliance
- Data minimization principles
- Right to erasure implementation
- Consent management for marketing
- Data export capabilities for users

#### 8.2.2 Industry Standards
- SOC 2 Type II compliance (Supabase)
- PCI DSS compliance (Stripe integration)
- Regular security audits and penetration testing

### 8.3 Security Best Practices

#### 8.3.1 Application Security
- Input validation and sanitization
- CSRF protection on forms
- XSS prevention in React components
- Secure headers configuration

#### 8.3.2 Infrastructure Security
- Regular dependency updates
- Automated security scanning
- Incident response procedures
- Backup and disaster recovery

---

## 9. Testing Strategy

### 9.1 Testing Pyramid

#### 9.1.1 Unit Tests
- Component testing with React Testing Library
- Utility function testing with Jest
- Database function testing
- API endpoint testing

#### 9.1.2 Integration Tests
- API integration testing
- Database operation testing
- Third-party service integration
- Authentication flow testing

#### 9.1.3 End-to-End Tests
- Critical user journey testing
- Cross-browser compatibility
- Mobile responsiveness testing
- Performance testing

### 9.2 Testing Tools and Frameworks

#### 9.2.1 Frontend Testing
- Jest: Test runner and assertion library
- React Testing Library: Component testing utilities
- Playwright: End-to-end testing framework
- Cypress: Alternative E2E testing (if needed)

#### 9.2.2 Backend Testing
- Supertest: API endpoint testing
- Database testing utilities
- Edge function testing framework

#### 9.2.3 Quality Assurance
- ESLint: Code linting
- Prettier: Code formatting
- TypeScript: Type checking
- Lighthouse: Performance auditing

---

## 10. Deployment and DevOps

### 10.1 Development Environment

#### 10.1.1 Local Development
- Next.js development server
- Supabase local development setup
- Hot reload for frontend changes
- Database migration tools

#### 10.1.2 Development Workflow
- Git feature branch workflow
- Pull request reviews
- Automated testing on commits
- Code quality checks

### 10.2 CI/CD Pipeline

#### 10.2.1 GitHub Actions Workflows
```yaml
# Frontend deployment
- Build Next.js application
- Run test suites
- Deploy to Vercel staging
- Run E2E tests on staging
- Deploy to production

# Backend deployment
- Run database migrations
- Deploy Edge functions
- Update API documentation
- Run integration tests
```

#### 10.2.2 Environment Management
- Development environment (local/feature branches)
- Staging environment (main branch)
- Production environment (release tags)
- Environment-specific configuration

### 10.3 Monitoring and Observability

#### 10.3.1 Application Monitoring
- Vercel Analytics for frontend performance
- Supabase monitoring dashboard
- Error tracking with Sentry
- User analytics and heatmaps

#### 10.3.2 Business Metrics
- User engagement tracking
- Feature usage analytics
- Performance metrics monitoring
- Business KPI dashboards

---

## 11. Performance Optimization

### 11.1 Frontend Optimization

#### 11.1.1 Build Optimizations
- Next.js automatic optimizations
- Code splitting and lazy loading
- Image optimization with Next.js Image
- Bundle analysis and optimization

#### 11.1.2 Runtime Performance
- React.memo for component optimization
- useMemo and useCallback for expensive operations
- Virtual scrolling for large lists
- Efficient state management

### 11.2 Backend Optimization

#### 11.2.1 Database Performance
- Strategic indexing on query patterns
- Query optimization and EXPLAIN analysis
- Connection pooling in Supabase
- Database normalization and denormalization

#### 11.2.2 API Performance
- Edge function optimization
- Caching strategies (Redis if needed)
- Rate limiting implementation
- API response compression

### 11.3 Scalability Considerations

#### 11.3.1 Horizontal Scaling
- Stateless application design
- Database read replicas (future)
- CDN for static assets
- Microservices architecture preparation

#### 11.3.2 Resource Optimization
- Image compression and WebP format
- Efficient data fetching patterns
- Background job processing
- Caching layers implementation

---

## 12. Implementation Phases and Timeline

### 12.1 Phase 1: Foundation (Weeks 1-4)

#### 12.1.1 Week 1: Project Setup
- Repository initialization
- Supabase project setup
- Next.js application scaffolding
- Basic authentication implementation
- Database schema creation

#### 12.1.2 Week 2: Core Infrastructure
- Authentication system completion
- Basic dashboard layout
- User profile management
- Database migrations and seeding
- API route setup

#### 12.1.3 Week 3: Facility Management
- Facility CRUD operations
- Unit management system
- File upload implementation
- Basic search and filtering

#### 12.1.4 Week 4: Customer Management
- Customer CRUD operations
- Basic customer profiles
- Unit assignment functionality
- Initial testing and bug fixes

### 12.2 Phase 2: Core Features (Weeks 5-8)

#### 12.2.1 Week 5: Rental Agreements
- Rental agreement creation
- Template system implementation
- Document storage setup

#### 12.2.2 Week 6: Payment Integration
- Stripe integration setup
- Invoice generation system
- Payment method management
- Basic billing workflow

#### 12.2.3 Week 7: Maintenance Module
- Maintenance request system
- Work order management
- Vendor directory
- Notification system

#### 12.2.4 Week 8: Reporting Dashboard
- Basic analytics implementation
- Occupancy reporting
- Revenue tracking
- Export functionality

### 12.3 Phase 3: Enhancement and Polish (Weeks 9-12)

#### 12.3.1 Week 9: Advanced Features
- Real-time updates implementation
- Advanced search and filtering
- Bulk operations
- Email notifications

#### 12.3.2 Week 10: UI/UX Refinement
- Responsive design improvements
- Accessibility enhancements
- Performance optimizations
- User feedback integration

#### 12.3.3 Week 11: Integration and Testing
- Third-party integrations
- Comprehensive testing
- Security audit
- Performance testing

#### 12.3.4 Week 12: Launch Preparation
- Production deployment setup
- Documentation completion
- User onboarding flow
- Go-to-market preparation

### 12.4 Phase 4: Post-Launch (Ongoing)

#### 12.4.1 Month 1-3: Stabilization
- Bug fixes and hotfixes
- User feedback analysis
- Performance monitoring
- Feature enhancements

#### 12.4.2 Month 4-6: Expansion
- Advanced features implementation
- Mobile app development (if needed)
- API marketplace development
- Enterprise features

---

## 13. Risk Assessment and Mitigation

### 13.1 Technical Risks

#### 13.1.1 Database Performance
- **Risk**: Slow queries with large datasets
- **Mitigation**: Strategic indexing, query optimization, database monitoring

#### 13.1.2 Third-Party Dependencies
- **Risk**: Service outages or API changes
- **Mitigation**: Circuit breakers, fallback mechanisms, monitoring alerts

#### 13.1.3 Security Vulnerabilities
- **Risk**: Data breaches or unauthorized access
- **Mitigation**: Regular security audits, dependency updates, RLS policies

### 13.2 Business Risks

#### 13.2.1 Scope Creep
- **Risk**: Feature expansion beyond MVP requirements
- **Mitigation**: Strict adherence to day1.md requirements, phased releases

#### 13.2.2 Timeline Delays
- **Risk**: Development delays impacting launch
- **Mitigation**: Agile development, regular progress reviews, buffer time

#### 13.2.3 User Adoption
- **Risk**: Low user engagement post-launch
- **Mitigation**: User research, onboarding optimization, marketing alignment

### 13.3 Operational Risks

#### 13.3.1 Vendor Lock-in
- **Risk**: Dependency on Supabase/Vercel limitations
- **Mitigation**: Open-source components, data export capabilities, multi-cloud preparation

#### 13.3.2 Scaling Challenges
- **Risk**: Performance issues with user growth
- **Mitigation**: Performance monitoring, scalable architecture, load testing

---

## 14. Success Metrics and KPIs

### 14.1 Technical Metrics

#### 14.1.1 Performance KPIs
- Page load times < 3 seconds
- API response times < 500ms
- Uptime > 99.9%
- Error rate < 0.1%

#### 14.1.2 Quality KPIs
- Test coverage > 80%
- Zero critical security vulnerabilities
- WCAG 2.1 AA accessibility compliance
- Cross-browser compatibility

### 14.2 Business Metrics

#### 14.2.1 User Engagement
- Daily active users
- Feature adoption rates
- User retention (30/90/365 days)
- Customer satisfaction scores

#### 14.2.2 Business Impact
- Time savings for facility operators
- Revenue growth metrics
- Customer acquisition cost
- Lifetime value improvement

### 14.3 Operational Metrics

#### 14.3.1 Development Velocity
- Sprint completion rate
- Code review turnaround time
- Bug fix time
- Feature delivery time

---

## Conclusion

This technical implementation plan provides a comprehensive roadmap for building the StowPilot self-storage management platform. By leveraging Supabase for backend services, Vercel for frontend hosting, and Next.js with shadcn/ui for the user interface, we can deliver a scalable, secure, and user-friendly application that meets all MVP requirements outlined in day1.md.

The phased approach ensures steady progress while maintaining quality and allowing for iterative improvements based on user feedback. The modular architecture supports future enhancements and enterprise features as outlined in the tooling.md recommendations.

Key success factors include:
- Strict adherence to the defined requirements
- Comprehensive testing and security measures
- Performance optimization throughout development
- User-centered design and accessibility
- Scalable architecture for future growth

This plan serves as the foundation for development and should be reviewed and updated regularly as the project progresses and new insights emerge.
