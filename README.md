# StowPilot - Self-Storage Management Platform

A comprehensive self-storage management platform built with Next.js, Supabase, and TypeScript.

## Quick Start

See **[RUN.md](RUN.md)** for detailed instructions on running the application locally.

### TL;DR

```bash
# 1. Install dependencies
pnpm install

# 2. Start Supabase
supabase start

# 3. Run migrations
supabase db reset

# 4. Create .env.local with Supabase credentials
# (See RUN.md for details)

# 5. Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
stowpilot/
├── app/                    # Next.js app router pages
├── components/             # React components (shadcn/ui)
├── lib/                    # Utility functions
├── supabase/
│   ├── functions/         # Edge Functions (Auth, Billing, etc.)
│   └── migrations/        # Database migrations
└── docs/                  # Documentation
```

## Key Features

- ✅ User authentication and authorization
- ✅ Facility and unit management
- ✅ Customer management
- ✅ Rental agreement management
- ✅ Payment and billing (Stripe integration ready)
- ✅ Maintenance request system
- ✅ Reporting and analytics

## Technology Stack

- **Frontend**: Next.js 16+ (App Router), React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State Management**: Zustand, TanStack Query
- **Forms**: React Hook Form + Zod
- **Testing**: Jest, Playwright

## Documentation

- **[RUN.md](RUN.md)** - How to run the application
- **[docs/setup.md](docs/setup.md)** - Complete setup guide
- **[docs/technical-001.md](docs/technical-001.md)** - Technical specification
- **[supabase/functions/README.md](supabase/functions/README.md)** - Edge Functions documentation

## Development

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Lint code
pnpm lint
```

## Supabase Services

When running locally with `supabase start`:

- **API**: http://localhost:54321
- **Studio**: http://localhost:54323 (Database UI)
- **Inbucket**: http://localhost:54324 (Email testing)
- **Edge Functions**: http://localhost:54321/functions/v1/[function-name]

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

## License

Private project - All rights reserved
