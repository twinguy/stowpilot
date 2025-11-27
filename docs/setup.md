# Local Development Setup Guide
## Document ID: SETUP-001
## Version: 1.0
## Date: November 27, 2025
## Platform: macOS

---

## Overview

This guide provides step-by-step instructions for setting up your local development environment on macOS to work with the StowPilot self-storage management platform. The setup includes all necessary tools for iterative development with hot reloading, local database management, and full-stack development capabilities.

---

## Prerequisites Checklist

Before starting, ensure you have:
- macOS 10.15 (Catalina) or later
- Administrator access (for installing system-level tools)
- Internet connection for downloading packages
- Docker Desktop installed and running (for Supabase local development)

---

## 1. Command Line Tools and Package Managers

### 1.1 Install Homebrew (Package Manager)

Homebrew is the recommended package manager for macOS. If not already installed:

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to your PATH (if on Apple Silicon)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Verify installation
brew --version
```

### 1.2 Install Git

```bash
# Install Git via Homebrew
brew install git

# Configure Git (replace with your information)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify installation
git --version
```

---

## 2. Node.js and JavaScript Runtime

### 2.1 Install Node.js (via nvm - Recommended)

Using Node Version Manager (nvm) allows you to manage multiple Node.js versions:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your shell configuration
source ~/.zshrc  # or ~/.bash_profile if using bash

# Install the latest LTS version of Node.js (required: Node.js 18+ for Next.js 16+)
nvm install --lts
nvm use --lts
nvm alias default node

# Verify installation
node --version  # Should show v20.x.x or later
npm --version   # Should show 10.x.x or later
```

### 2.2 Alternative: Install Node.js via Homebrew

If you prefer not to use nvm:

```bash
# Install Node.js LTS
brew install node@20

# Add to PATH (if needed)
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
node --version
npm --version
```

### 2.3 Install Package Manager: pnpm (Recommended)

pnpm is faster and more disk-efficient than npm:

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version

# Configure pnpm (optional but recommended)
pnpm config set store-dir ~/.pnpm-store
```

**Alternative: Use npm or yarn**

If you prefer npm (comes with Node.js):
```bash
npm --version  # Already installed
```

Or install yarn:
```bash
npm install -g yarn
yarn --version
```

---

## 3. Supabase CLI and Local Development

### 3.1 Install Supabase CLI

The Supabase CLI enables local development with a full Supabase stack running in Docker:

```bash
# Install Supabase CLI via Homebrew
brew install supabase/tap/supabase

# Verify installation
supabase --version

# Login to Supabase (optional, for linking projects)
supabase login
```

### 3.2 Verify Docker Installation

Supabase local development requires Docker Desktop:

```bash
# Check if Docker is installed and running
docker --version
docker ps

# If Docker is not running, start Docker Desktop application
# Docker Desktop should be running before proceeding
```

### 3.3 Initialize Supabase Local Development

Once in your project directory:

```bash
# Initialize Supabase in your project
supabase init

# Start Supabase local stack (PostgreSQL, Auth, Storage, etc.)
supabase start

# This will:
# - Pull required Docker images
# - Start PostgreSQL database
# - Start Supabase services (Auth, Storage, Realtime, etc.)
# - Display local credentials and API URLs

# Note the output, especially:
# - API URL: http://localhost:54321
# - GraphQL URL: http://localhost:54321/graphql/v1
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323
# - Inbucket URL: http://localhost:54324 (for local email testing)
```

### 3.4 Access Supabase Studio

Open Supabase Studio in your browser:
```bash
# Studio URL from supabase start output
open http://localhost:54323
```

This provides a visual interface for:
- Database schema management
- Table data viewing/editing
- SQL query editor
- Authentication user management
- Storage bucket management

---

## 4. Project Setup

### 4.1 Clone or Initialize Repository

```bash
# If cloning from GitHub
git clone <repository-url>
cd stowpilot

# Or if starting fresh, create project directory
mkdir stowpilot
cd stowpilot
git init
```

### 4.2 Initialize Next.js Project

```bash
# Create Next.js app with TypeScript and App Router
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"

# Or with pnpm
pnpm create next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"

# Follow prompts:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - App Router: Yes
# - Import alias: @/*
```

### 4.3 Install Core Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Install project-specific dependencies
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add zustand
pnpm add react-hook-form @hookform/resolvers zod
pnpm add @radix-ui/react-*  # shadcn/ui dependencies (installed via shadcn CLI)
pnpm add date-fns
pnpm add lucide-react  # Icons for shadcn/ui

# Development dependencies
pnpm add -D @types/node @types/react @types/react-dom
pnpm add -D eslint-config-next
pnpm add -D prettier eslint-config-prettier eslint-plugin-prettier
pnpm add -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
pnpm add -D @playwright/test
pnpm add -D @tanstack/react-query  # For server state management
```

### 4.4 Install shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Follow prompts:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# Install individual components as needed
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
# ... add more components as needed
```

---

## 5. Environment Variables Configuration

### 5.1 Create Environment Files

```bash
# Create .env.local for local development
touch .env.local

# Create .env.example as a template
touch .env.example
```

### 5.2 Configure Environment Variables

Add the following to `.env.local`:

```bash
# Supabase Configuration (from supabase start output)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-start>

# Database (for direct connections if needed)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe (for payment integration - get from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service (Resend or Postmark)
RESEND_API_KEY=re_...  # or POSTMARK_API_KEY=...

# Optional: Google Maps API (for address validation)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...

# Optional: DocuSign (for document signing)
DOCUSIGN_INTEGRATION_KEY=...
DOCUSIGN_USER_ID=...
DOCUSIGN_ACCOUNT_ID=...
DOCUSIGN_PRIVATE_KEY=...
```

Add the same structure (without values) to `.env.example`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Database
DATABASE_URL=

# Next.js
NEXT_PUBLIC_APP_URL=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email Service
RESEND_API_KEY=

# Optional Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
DOCUSIGN_INTEGRATION_KEY=
```

**Important:** Never commit `.env.local` to version control. Ensure it's in `.gitignore`.

---

## 6. Code Quality Tools Setup

### 6.1 ESLint Configuration

ESLint should be configured automatically with Next.js. Verify `eslint.config.js` exists:

```bash
# Check ESLint configuration
cat eslint.config.js
```

If you need to customize, create/update `eslint.config.js`:

```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Add custom rules here
    },
  },
];

export default eslintConfig;
```

### 6.2 Prettier Configuration

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

Create `.prettierignore`:

```
node_modules
.next
out
dist
build
coverage
.env*.local
*.log
```

### 6.3 TypeScript Configuration

Verify `tsconfig.json` exists and is properly configured:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 6.4 VS Code Settings (Optional but Recommended)

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

Create `.vscode/extensions.json` (recommended extensions):

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase-vscode"
  ]
}
```

---

## 7. Testing Setup

### 7.1 Jest Configuration

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom'
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 7.2 Playwright Configuration

Initialize Playwright:

```bash
# Install Playwright browsers
pnpm exec playwright install

# Create playwright.config.ts
```

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## 8. Hot Reloading Configuration

### 8.1 Next.js Development Server

Next.js has hot reloading enabled by default. Start the development server:

```bash
# Using pnpm
pnpm dev

# Or using npm
npm run dev

# The app will be available at http://localhost:3000
# Hot reloading is automatic - changes to files will refresh the browser
```

### 8.2 Configure Next.js for Optimal Hot Reloading

Update `next.config.js` (if needed):

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable Fast Refresh (hot reloading)
  // This is enabled by default in development mode
  
  // Optional: Configure webpack for faster rebuilds
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimize for faster hot reloading
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

### 8.3 Supabase Local Development Hot Reloading

Supabase migrations and Edge Functions support hot reloading:

```bash
# Watch for migration changes (in separate terminal)
supabase db reset --linked  # Reset and apply migrations

# For Edge Functions development
supabase functions serve <function-name> --no-verify-jwt
```

---

## 9. Database Migrations Setup

### 9.1 Create Migrations Directory

```bash
# Ensure supabase directory exists
mkdir -p supabase/migrations

# Create your first migration
supabase migration new initial_schema
```

### 9.2 Apply Migrations Locally

```bash
# Apply all migrations to local database
supabase db reset

# Or apply specific migration
supabase migration up
```

### 9.3 Generate TypeScript Types from Database

```bash
# Generate TypeScript types from Supabase schema
supabase gen types typescript --local > src/types/database.ts

# Or for linked project
supabase gen types typescript --linked > src/types/database.ts
```

---

## 10. Project Structure Setup

### 10.1 Create Directory Structure

```bash
# Create source directories
mkdir -p src/app/{api,\(auth\),\(dashboard\)/{facilities,units,customers,rentals,billing,maintenance,reports}}
mkdir -p src/components/{ui,forms,layouts,shared}
mkdir -p src/lib/{supabase,validations,hooks,utils}
mkdir -p src/types
mkdir -p public/{images,icons}
mkdir -p tests/{unit,integration,e2e}
mkdir -p supabase/functions
mkdir -p .github/workflows
```

### 10.2 Create Initial Files

```bash
# Create middleware.ts
touch src/middleware.ts

# Create Supabase client utilities
touch src/lib/supabase/client.ts
touch src/lib/supabase/server.ts
touch src/lib/supabase/middleware.ts

# Create type definitions
touch src/types/index.ts
touch src/types/database.ts
```

---

## 11. Git Configuration

### 11.1 Create .gitignore

Ensure `.gitignore` includes:

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Next.js
.next/
out/
build/
dist/

# Production
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Supabase
.branches
.temp
supabase/.branches
supabase/.temp
```

### 11.2 Initialize Git Repository

```bash
# If not already initialized
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial project setup"
```

---

## 12. Verification and Testing

### 12.1 Verify Installation

Run the following commands to verify everything is set up correctly:

```bash
# Check Node.js version (should be 18+)
node --version

# Check package manager
pnpm --version  # or npm --version

# Check Supabase CLI
supabase --version

# Check Docker
docker --version
docker ps

# Check Git
git --version
```

### 12.2 Start Development Environment

```bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Start Next.js dev server
pnpm dev

# Terminal 3: Run tests (optional)
pnpm test:watch
```

### 12.3 Verify Hot Reloading

1. Open http://localhost:3000 in your browser
2. Edit `src/app/page.tsx`
3. Save the file
4. Browser should automatically refresh with changes

### 12.4 Verify Database Connection

```bash
# Check Supabase Studio
open http://localhost:54323

# Or test connection via CLI
supabase db ping
```

---

## 13. Troubleshooting

### 13.1 Common Issues

**Issue: Port 3000 already in use**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
pnpm dev -- -p 3001
```

**Issue: Docker not running**
```bash
# Start Docker Desktop application
open -a Docker

# Wait for Docker to start, then verify
docker ps
```

**Issue: Supabase start fails**
```bash
# Stop existing containers
supabase stop

# Reset Supabase
supabase db reset

# Start again
supabase start
```

**Issue: Node version conflicts**
```bash
# Use nvm to switch Node versions
nvm use 20
nvm alias default 20
```

**Issue: Permission denied errors**
```bash
# Fix npm/pnpm permissions (if needed)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.pnpm-store
```

### 13.2 Reset Development Environment

If you need to completely reset:

```bash
# Stop Supabase
supabase stop

# Remove node_modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml  # or package-lock.json / yarn.lock
pnpm install

# Reset Supabase database
supabase db reset

# Clear Next.js cache
rm -rf .next

# Restart everything
supabase start
pnpm dev
```

---

## 14. Additional Development Tools (Optional)

### 14.1 Database GUI Tools

**TablePlus** (Recommended):
```bash
# Install via Homebrew
brew install --cask tableplus

# Or download from https://tableplus.com
```

**DBeaver** (Free alternative):
```bash
brew install --cask dbeaver-community
```

### 14.2 API Testing Tools

**Postman**:
```bash
brew install --cask postman
```

**Insomnia**:
```bash
brew install --cask insomnia
```

### 14.3 VS Code Extensions

Install recommended extensions:
```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension supabase.supabase-vscode
code --install-extension ms-playwright.playwright
```

---

## 15. Quick Start Checklist

Use this checklist to verify your setup:

- [ ] Homebrew installed
- [ ] Git installed and configured
- [ ] Node.js 18+ installed (via nvm or Homebrew)
- [ ] pnpm (or npm/yarn) installed
- [ ] Docker Desktop installed and running
- [ ] Supabase CLI installed
- [ ] Project cloned/initialized
- [ ] Dependencies installed (`pnpm install`)
- [ ] Environment variables configured (`.env.local`)
- [ ] Supabase local stack running (`supabase start`)
- [ ] Next.js dev server running (`pnpm dev`)
- [ ] Can access http://localhost:3000
- [ ] Can access Supabase Studio at http://localhost:54323
- [ ] Hot reloading working (edit a file, see changes)
- [ ] Tests can run (`pnpm test`)

---

## 16. Daily Development Workflow

### 16.1 Starting Your Day

```bash
# 1. Navigate to project directory
cd ~/path/to/stowpilot

# 2. Pull latest changes (if working with team)
git pull origin main

# 3. Install any new dependencies
pnpm install

# 4. Start Supabase (if not already running)
supabase start

# 5. Start Next.js dev server
pnpm dev

# 6. Open browser
open http://localhost:3000
```

### 16.2 During Development

- Make changes to files
- Hot reloading will automatically refresh the browser
- Use Supabase Studio (http://localhost:54323) to manage database
- Run tests as you develop: `pnpm test:watch`
- Check linting: `pnpm lint`
- Format code: `pnpm format` (if configured)

### 16.3 Ending Your Day

```bash
# 1. Commit your changes
git add .
git commit -m "Description of changes"

# 2. Push to remote (if working with team)
git push origin <branch-name>

# 3. Stop Supabase (optional - can leave running)
supabase stop

# 4. Stop Next.js dev server (Ctrl+C)
```

---

## 17. Next Steps

After completing this setup:

1. **Review Project Documentation**:
   - Read `docs/day1.md` for business requirements
   - Read `docs/technical-001.md` for technical architecture
   - Review `docs/tooling.md` for tooling decisions

2. **Set Up Database Schema**:
   - Create initial migrations based on technical-001.md schema
   - Run migrations: `supabase db reset`
   - Generate TypeScript types: `supabase gen types typescript --local`

3. **Implement Core Features**:
   - Follow the implementation phases in technical-001.md
   - Start with authentication (Module 1)
   - Then facility management (Module 2)

4. **Configure CI/CD**:
   - Set up GitHub Actions workflows
   - Configure Vercel deployment
   - Set up automated testing

---

## Support and Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Supabase Documentation**: https://supabase.com/docs
- **shadcn/ui Documentation**: https://ui.shadcn.com
- **TypeScript Documentation**: https://www.typescriptlang.org/docs
- **Tailwind CSS Documentation**: https://tailwindcss.com/docs

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-27 | Initial setup guide creation | AI Technical Lead |

---

**Note**: This setup guide assumes macOS. For Linux or Windows, some commands may differ. Refer to platform-specific documentation for package managers and installation methods.

