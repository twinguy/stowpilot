// Supabase client initialization for Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

/**
 * Creates a Supabase client with service role key for admin operations
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a Supabase client with anon key for user operations
 */
export function createSupabaseClient(accessToken?: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const client = createClient(supabaseUrl, supabaseAnonKey);

  if (accessToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
    });
  }

  return client;
}

