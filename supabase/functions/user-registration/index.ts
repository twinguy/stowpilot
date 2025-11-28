// Edge Function: User Registration
// Handles new user signup with email verification

import { createSupabaseAdminClient } from '../_shared/supabase.ts';
import {
  createResponse,
  isValidEmail,
  isValidPassword,
  parseRequestBody,
  validateRequiredFields,
} from '../_shared/utils.ts';
import { sendEmail, generateVerificationEmail } from '../_shared/email.ts';
import { UserRegistrationRequest } from '../_shared/types.ts';

Deno.serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return createResponse(false, null, 'Method not allowed', 'Only POST requests are allowed');
    }

    // Parse request body
    const body = await parseRequestBody<UserRegistrationRequest>(req);

    // Validate required fields
    const validation = validateRequiredFields(body, ['email', 'password']);
    if (!validation.valid) {
      return createResponse(
        false,
        null,
        'Missing required fields',
        `Missing fields: ${validation.missing.join(', ')}`
      );
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return createResponse(false, null, 'Invalid email format', 'Please provide a valid email address');
    }

    // Validate password strength
    if (!isValidPassword(body.password)) {
      return createResponse(
        false,
        null,
        'Weak password',
        'Password must be at least 8 characters and contain uppercase, lowercase, and a number'
      );
    }

    // Create Supabase admin client
    const supabase = createSupabaseAdminClient();

    // Check if user already exists by checking profiles table
    // (profile trigger ensures profile exists for all auth users)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', body.email)
      .single();

    if (existingProfile) {
      return createResponse(false, null, 'User already exists', 'An account with this email already exists');
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: false, // Require email verification
      user_metadata: {
        full_name: body.full_name || '',
        business_name: body.business_name || '',
        phone: body.phone || '',
      },
    });

    if (authError || !authUser.user) {
      console.error('Auth error:', authError);
      return createResponse(false, null, 'Registration failed', authError?.message || 'Failed to create user');
    }

    // Create or update profile record
    // Note: A trigger may have already created a basic profile, so we use upsert
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        email: body.email,
        full_name: body.full_name || null,
        business_name: body.business_name || null,
        phone: body.phone || null,
        role: 'owner',
        subscription_tier: 'free',
        subscription_status: 'active',
      }, {
        onConflict: 'id',
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Attempt to clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return createResponse(false, null, 'Profile creation failed', 'Failed to create user profile');
    }

    // Generate email verification link
    // Note: Supabase will automatically send a verification email
    // We can optionally send a custom email with a better template
    try {
      const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: body.email,
      });

      if (!tokenError && tokenData?.properties?.action_link) {
        const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000';
        // Extract the token from the action_link
        const actionLink = tokenData.properties.action_link;
        const tokenMatch = actionLink.match(/token=([^&]+)/);
        const token = tokenMatch ? tokenMatch[1] : '';
        const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`;
        
        const emailHtml = generateVerificationEmail(verificationUrl, body.full_name);
        await sendEmail(body.email, 'Verify your StowPilot account', emailHtml);
      } else {
        // Supabase will send its own verification email if custom link generation fails
        console.warn('Could not generate custom verification link, Supabase will send default email');
      }
    } catch (emailError) {
      // Non-critical: Supabase will still send verification email
      console.warn('Custom email send failed, Supabase will send default verification email:', emailError);
    }

    // Return success response (don't expose sensitive data)
    return createResponse(
      true,
      {
        user_id: authUser.user.id,
        email: authUser.user.email,
        email_confirmed: authUser.user.email_confirmed_at !== null,
      },
      null,
      'User registered successfully. Please check your email to verify your account.'
    );
  } catch (error) {
    console.error('User registration error:', error);
    return createResponse(
      false,
      null,
      'Internal server error',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
});

