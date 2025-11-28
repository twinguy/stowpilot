# Supabase Database Migrations

This directory contains database migrations for the StowPilot self-storage management platform.

## Structure

- `migrations/` - Database migration files (executed in chronological order)
- `config.toml` - Supabase local development configuration
- `seed.sql` - Seed data for development and testing

## Migration Files

### 20241127000000_create_core_tables.sql
Creates all core database tables as specified in section 3.1 of technical-001.md:
- User Management (profiles, team_members)
- Facility Management (facilities, units)
- Customer Management (customers, customer_units)
- Rental Agreements (rentals, rental_documents)
- Payment and Billing (payment_methods, invoices, payments, ledger_entries)
- Maintenance and Operations (maintenance_requests, vendors, work_orders)

Also includes:
- Indexes for performance optimization
- Triggers for automatic timestamp updates
- Function to maintain facility unit counts

### 20241127000001_enable_rls_policies.sql
Enables Row Level Security (RLS) on all tables and creates policies for data access control as specified in section 3.2.1 of technical-001.md.

### 20241127000002_create_profile_trigger.sql
Creates a trigger function that automatically creates a profile entry when a new user signs up, ensuring the profiles table is populated when auth.users entries are created.

### 20241127000003_create_storage_buckets.sql
Creates storage buckets and RLS policies for file storage as specified in section 4.2 of technical-001.md:
- **facilities**: Facility photos and documents (50MB limit, private)
- **units**: Unit photos (50MB limit, private)
- **customers**: Customer documents like ID verification and agreements (10MB limit, private)
- **rentals**: Rental agreements and addendums (10MB limit, private)
- **maintenance**: Maintenance photos and reports (50MB limit, private)
- **avatars**: User profile pictures (5MB limit, public)

Each bucket includes comprehensive RLS policies ensuring users can only access files for their own data (facilities, units, customers, rentals, maintenance requests). The avatars bucket is public but still has RLS policies for consistency.

## Usage

### Local Development

1. Initialize Supabase (if not already done):
   ```bash
   supabase init
   ```

2. Start Supabase local development:
   ```bash
   supabase start
   ```

3. Apply migrations:
   ```bash
   supabase db reset  # This will apply all migrations and reset the database
   # OR
   supabase migration up  # Apply pending migrations
   ```

4. (Optional) Load seed data:
   ```bash
   psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/seed.sql
   ```

### Production Deployment

Migrations are automatically applied when deploying to Supabase Cloud. Ensure your Supabase project is linked:

```bash
supabase link --project-ref your-project-ref
```

Then push migrations:

```bash
supabase db push
```

## Database Schema Overview

The database schema implements a multi-tenant architecture where:
- Each user (owner) has their own data isolated via RLS policies
- Facilities belong to owners
- Units belong to facilities
- Customers belong to owners
- Rentals link customers to units
- Payments and invoices track billing
- Maintenance requests track facility operations

## Row Level Security

All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Team members can access data based on their permissions
- Data isolation between different owners

## Storage Buckets

Storage buckets are configured with RLS policies that enforce access control based on file paths:
- Files are organized by entity ID (e.g., `{facility_id}/photo.jpg`)
- Policies verify ownership by checking the first path segment against database records
- Users can only upload, view, update, or delete files for entities they own
- File size limits and MIME type restrictions are enforced at the bucket level

## Notes

- Migrations are executed in chronological order based on filename timestamps
- Always test migrations locally before deploying to production
- Never modify existing migrations that have been applied to production
- Create new migrations for schema changes

