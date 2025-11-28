# How to Run StowPilot

This guide provides quick instructions to get the StowPilot application running locally.

## Prerequisites

Before running, ensure you have:
- **Docker Desktop** installed and running (required for Supabase)
- **Node.js** 20+ installed
- **pnpm** (or npm/yarn) installed
- **Supabase CLI** installed

### Quick Prerequisites Check

```bash
# Check Docker
docker --version
docker ps

# Check Node.js
node --version  # Should be v20.x.x or later

# Check pnpm (or use npm)
pnpm --version

# Check Supabase CLI
supabase --version
```

If any are missing, see [docs/setup.md](docs/setup.md) for installation instructions.

## Quick Start (5 Steps)

### 1. Install Dependencies

```bash
# Navigate to project directory
cd /Users/kmeador/src/stowpilot

# Install Node.js dependencies
pnpm install
# or: npm install
```

### 2. Start Supabase Local Development

```bash
# Start Supabase (PostgreSQL, Auth, Storage, etc.)
supabase start

# This will output important URLs and keys - SAVE THESE!
# Look for:
# - API URL: http://localhost:54321
# - anon key: (a long string)
# - service_role key: (a long string)
```

**Important:** Copy the `anon key` and `service_role key` from the output - you'll need them for environment variables.

### 3. Run Database Migrations

```bash
# Apply database migrations
supabase db reset

# This will:
# - Create all tables (profiles, facilities, units, customers, etc.)
# - Set up Row Level Security policies
# - Create triggers and functions
```

### 4. Create Environment Variables File

Create a `.env.local` file in the project root:

```bash
# Create .env.local file
touch .env.local
```

Add the following content (replace with values from `supabase start` output):

```bash
# Supabase Configuration (from supabase start output)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase-start-output

# Database (for direct connections if needed)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Next.js App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Service (Optional - for Edge Functions)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@stowpilot.com

# Stripe (Optional - for payment features)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 5. Start the Development Server

```bash
# Start Next.js development server
pnpm dev
# or: npm run dev

# The app will be available at:
# http://localhost:3000
```

## Running Edge Functions Locally

To test the Edge Functions we just created:

```bash
# In a separate terminal, serve Edge Functions
supabase functions serve

# Functions will be available at:
# http://localhost:54321/functions/v1/user-registration
# http://localhost:54321/functions/v1/user-onboarding
# http://localhost:54321/functions/v1/team-invitation
# http://localhost:54321/functions/v1/subscription-management
```

## Accessing Services

Once everything is running:

- **Next.js App**: http://localhost:3000
- **Supabase Studio** (Database UI): http://localhost:54323
- **Inbucket** (Email Testing): http://localhost:54324
- **Edge Functions**: http://localhost:54321/functions/v1/[function-name]

## Common Commands

### Database Management

```bash
# View database in Supabase Studio
open http://localhost:54323

# Reset database (applies migrations + clears data)
supabase db reset

# Apply only new migrations
supabase migration up

# View database logs
supabase db logs
```

### Edge Functions

```bash
# Serve functions locally
supabase functions serve

# Deploy functions to Supabase Cloud
supabase functions deploy

# Deploy specific function
supabase functions deploy user-registration

# View function logs
supabase functions logs user-registration
```

### Development

```bash
# Run Next.js dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

## Troubleshooting

### Docker Not Running
```bash
# Start Docker Desktop, then:
supabase start
```

### Port Already in Use
```bash
# Stop existing Supabase instance
supabase stop

# Or change ports in supabase/config.toml
```

### Database Connection Issues
```bash
# Verify Supabase is running
supabase status

# Check database is accessible
psql postgresql://postgres:postgres@localhost:54322/postgres
```

### Environment Variables Not Loading
- Ensure `.env.local` is in the project root (not in a subdirectory)
- Restart the Next.js dev server after changing `.env.local`
- Check that variable names start with `NEXT_PUBLIC_` for client-side access

### Edge Functions Not Working
```bash
# Ensure functions are being served
supabase functions serve

# Check function logs
supabase functions logs [function-name]

# Verify environment variables are set in Supabase dashboard
# (for deployed functions)
```

## Next Steps

1. **Create your first user**: Use the registration Edge Function or Supabase Studio
2. **Explore the database**: Open Supabase Studio at http://localhost:54323
3. **Test Edge Functions**: Use the API endpoints or Supabase Studio
4. **Check email**: View test emails in Inbucket at http://localhost:54324

## Additional Resources

- Full setup guide: [docs/setup.md](docs/setup.md)
- Technical specification: [docs/technical-001.md](docs/technical-001.md)
- Edge Functions docs: [supabase/functions/README.md](supabase/functions/README.md)

