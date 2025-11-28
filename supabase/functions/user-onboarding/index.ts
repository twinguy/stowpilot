// Edge Function: User Onboarding
// Completes profile setup and facility creation

import { createSupabaseAdminClient } from '../_shared/supabase.ts';
import {
  createResponse,
  parseRequestBody,
  validateRequiredFields,
  getAuthHeader,
} from '../_shared/utils.ts';
import { UserOnboardingRequest } from '../_shared/types.ts';

Deno.serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return createResponse(false, null, 'Method not allowed', 'Only POST requests are allowed');
    }

    // Get authorization token
    const authToken = getAuthHeader(req);
    if (!authToken) {
      return createResponse(false, null, 'Unauthorized', 'Missing authorization token');
    }

    // Create Supabase admin client
    const supabase = createSupabaseAdminClient();

    // Verify user token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    if (authError || !user) {
      return createResponse(false, null, 'Unauthorized', 'Invalid or expired token');
    }

    // Parse request body
    const body = await parseRequestBody<UserOnboardingRequest>(req);

    // Validate user_id matches authenticated user
    if (body.user_id !== user.id) {
      return createResponse(false, null, 'Forbidden', 'User ID does not match authenticated user');
    }

    // Update profile with onboarding data
    const profileUpdates: Record<string, any> = {};
    if (body.full_name) profileUpdates.full_name = body.full_name;
    if (body.business_name) profileUpdates.business_name = body.business_name;
    if (body.phone) profileUpdates.phone = body.phone;

    let profileResult;
    if (Object.keys(profileUpdates).length > 0) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) {
        console.error('Profile update error:', profileError);
        return createResponse(false, null, 'Profile update failed', profileError.message);
      }
      profileResult = profile;
    } else {
      // Fetch existing profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return createResponse(false, null, 'Profile fetch failed', profileError.message);
      }
      profileResult = profile;
    }

    // Create facility if provided
    let facilityResult = null;
    if (body.facility) {
      // Validate facility data
      const facilityValidation = validateRequiredFields(body.facility, ['name', 'address']);
      if (!facilityValidation.valid) {
        return createResponse(
          false,
          null,
          'Invalid facility data',
          `Missing fields: ${facilityValidation.missing.join(', ')}`
        );
      }

      const addressValidation = validateRequiredFields(body.facility.address, [
        'street',
        'city',
        'state',
        'zip',
      ]);
      if (!addressValidation.valid) {
        return createResponse(
          false,
          null,
          'Invalid address data',
          `Missing address fields: ${addressValidation.missing.join(', ')}`
        );
      }

      // Create facility
      const { data: facility, error: facilityError } = await supabase
        .from('facilities')
        .insert({
          owner_id: user.id,
          name: body.facility.name,
          address: {
            street: body.facility.address.street,
            city: body.facility.address.city,
            state: body.facility.address.state,
            zip: body.facility.address.zip,
            country: body.facility.address.country || 'USA',
            coordinates: body.facility.address.coordinates || null,
          },
          contact_info: body.facility.contact_info || null,
          operating_hours: body.facility.operating_hours || null,
          status: 'active',
        })
        .select()
        .single();

      if (facilityError) {
        console.error('Facility creation error:', facilityError);
        return createResponse(false, null, 'Facility creation failed', facilityError.message);
      }

      facilityResult = facility;
    }

    // Return success response
    return createResponse(
      true,
      {
        profile: profileResult,
        facility: facilityResult,
        onboarding_complete: true,
      },
      null,
      'Onboarding completed successfully'
    );
  } catch (error) {
    console.error('User onboarding error:', error);
    return createResponse(
      false,
      null,
      'Internal server error',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
});

