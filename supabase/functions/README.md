# Supabase Edge Functions

This directory contains Edge Functions for the StowPilot self-storage management platform, implementing section 4.1.1 of technical-001.md.

## Structure

```
functions/
├── _shared/                    # Shared utilities and types
│   ├── types.ts               # TypeScript type definitions
│   ├── utils.ts               # Utility functions
│   ├── supabase.ts            # Supabase client initialization
│   └── email.ts               # Email service utilities
├── user-registration/          # User signup with email verification
├── user-onboarding/           # Profile setup and facility creation
├── team-invitation/          # Team member invitation system
└── subscription-management/   # Subscription billing and tier management
```

## Functions

### 1. user-registration

Handles new user signup with email verification.

**Endpoint:** `POST /functions/v1/user-registration`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "business_name": "Doe Storage",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "email_confirmed": false
  },
  "message": "User registered successfully. Please check your email to verify your account."
}
```

### 2. user-onboarding

Completes profile setup and optionally creates a facility.

**Endpoint:** `POST /functions/v1/user-onboarding`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "user_id": "uuid",
  "full_name": "John Doe",
  "business_name": "Doe Storage",
  "phone": "+1234567890",
  "facility": {
    "name": "Main Storage Facility",
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip": "12345",
      "country": "USA",
      "coordinates": {
        "lat": 37.7749,
        "lng": -122.4194
      }
    },
    "contact_info": {
      "phone": "+1234567890",
      "email": "facility@example.com",
      "manager": "Jane Manager"
    },
    "operating_hours": {
      "monday": { "open": "09:00", "close": "18:00" },
      "tuesday": { "open": "09:00", "close": "18:00" }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": { ... },
    "facility": { ... },
    "onboarding_complete": true
  },
  "message": "Onboarding completed successfully"
}
```

### 3. team-invitation

Sends and processes team member invitations.

**Endpoints:**
- `POST /functions/v1/team-invitation` - Send invitation
- `PUT /functions/v1/team-invitation` - Accept invitation
- `GET /functions/v1/team-invitation` - List invitations
- `DELETE /functions/v1/team-invitation?id=<invitation_id>` - Cancel invitation

**Send Invitation (POST):**
```json
{
  "email": "team@example.com",
  "full_name": "Team Member",
  "role": "manager",
  "permissions": {
    "facility:edit": true,
    "customer:view": true
  }
}
```

**Accept Invitation (PUT):**
```json
{
  "invitation_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invitation_id": "uuid",
    "email": "team@example.com",
    "role": "manager",
    "status": "pending",
    "invited_at": "2024-11-27T00:00:00Z"
  },
  "message": "Team invitation sent successfully"
}
```

### 4. subscription-management

Handles subscription billing and tier changes.

**Endpoints:**
- `POST /functions/v1/subscription-management` - Change subscription
- `GET /functions/v1/subscription-management` - Get subscription details

**Change Subscription (POST/PUT):**
```json
{
  "user_id": "uuid",
  "action": "upgrade",
  "tier": "pro",
  "stripe_customer_id": "cus_xxx",
  "stripe_subscription_id": "sub_xxx"
}
```

**Actions:**
- `upgrade` - Upgrade to pro or enterprise tier
- `downgrade` - Downgrade to a lower tier
- `cancel` - Cancel current subscription
- `reactivate` - Reactivate a cancelled subscription

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "tier": "pro",
      "status": "active"
    }
  },
  "message": "Subscription upgrade completed successfully"
}
```

## Environment Variables

Required environment variables (set in Supabase dashboard or `.env`):

```bash
# Supabase Configuration (automatically provided)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
APP_URL=https://your-app.com

# Email Service (Resend)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@stowpilot.com
```

## Local Development

1. Start Supabase locally:
```bash
supabase start
```

2. Serve functions locally:
```bash
supabase functions serve
```

3. Test a function:
```bash
curl -X POST http://localhost:54321/functions/v1/user-registration \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

## Deployment

Deploy all functions:
```bash
supabase functions deploy
```

Deploy a specific function:
```bash
supabase functions deploy user-registration
```

## Error Handling

All functions return standardized responses:

```json
{
  "success": false,
  "error": "Error code",
  "message": "Human-readable error message"
}
```

Common error codes:
- `Method not allowed` - Wrong HTTP method
- `Unauthorized` - Missing or invalid auth token
- `Forbidden` - User doesn't have permission
- `Missing required fields` - Required fields not provided
- `Invalid email format` - Email validation failed
- `User already exists` - Duplicate registration attempt

## Testing

Functions can be tested using:
- Supabase Dashboard (Edge Functions tab)
- cURL commands
- Postman/Insomnia
- Integration tests in the main application

## Notes

- All functions use the Supabase service role key for admin operations
- Email verification links are generated automatically
- Team invitations expire after 7 days (can be configured)
- Subscription changes integrate with Stripe (implementation pending)
- All functions validate input and return appropriate error messages

