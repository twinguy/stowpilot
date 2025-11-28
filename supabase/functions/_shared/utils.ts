// Shared utility functions for Edge Functions

import { EdgeFunctionResponse } from './types.ts';

/**
 * Creates a standardized response for Edge Functions
 */
export function createResponse(
  success: boolean,
  data?: any,
  error?: string,
  message?: string
): Response {
  const response: EdgeFunctionResponse = {
    success,
    ...(data && { data }),
    ...(error && { error }),
    ...(message && { message }),
  };

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
    status: success ? 200 : error?.includes('unauthorized') ? 401 : error?.includes('not found') ? 404 : 400,
  });
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Gets Supabase client with service role key for admin operations
 */
export function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return {
    url: supabaseUrl,
    serviceKey: supabaseServiceKey,
  };
}

/**
 * Validates request body and returns parsed JSON
 */
export async function parseRequestBody<T>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new Error('Invalid request body');
  }
}

/**
 * Gets authorization header from request
 */
export function getAuthHeader(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }
  return authHeader.replace('Bearer ', '');
}

/**
 * Validates required fields in an object
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter((field) => !data[field]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

