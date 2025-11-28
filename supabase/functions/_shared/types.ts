// Shared TypeScript types for Edge Functions

export interface EdgeFunctionResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface UserRegistrationRequest {
  email: string;
  password: string;
  full_name?: string;
  business_name?: string;
  phone?: string;
}

export interface UserOnboardingRequest {
  user_id: string;
  full_name?: string;
  business_name?: string;
  phone?: string;
  facility?: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    contact_info?: {
      phone?: string;
      email?: string;
      manager?: string;
    };
    operating_hours?: Record<string, { open: string; close: string }>;
  };
}

export interface TeamInvitationRequest {
  email: string;
  full_name?: string;
  role: 'manager' | 'staff';
  permissions?: Record<string, boolean>;
  facility_ids?: string[]; // Optional: restrict to specific facilities
}

export interface SubscriptionManagementRequest {
  user_id: string;
  action: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate';
  tier?: 'free' | 'pro' | 'enterprise';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface SupabaseClient {
  auth: {
    admin: {
      createUser: (user: any) => Promise<any>;
      getUserById: (id: string) => Promise<any>;
      updateUserById: (id: string, updates: any) => Promise<any>;
    };
  };
  from: (table: string) => any;
  rpc: (functionName: string, params?: any) => Promise<any>;
}

