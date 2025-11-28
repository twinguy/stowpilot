// Edge Function: Subscription Management
// Handles billing and tier changes

import { createSupabaseAdminClient } from '../_shared/supabase.ts';
import {
  createResponse,
  parseRequestBody,
  validateRequiredFields,
  getAuthHeader,
} from '../_shared/utils.ts';
import { SubscriptionManagementRequest } from '../_shared/types.ts';

Deno.serve(async (req) => {
  try {
    // Handle different HTTP methods
    if (req.method === 'POST' || req.method === 'PUT') {
      return await handleSubscriptionChange(req);
    } else if (req.method === 'GET') {
      return await handleGetSubscription(req);
    } else {
      return createResponse(false, null, 'Method not allowed', 'Unsupported HTTP method');
    }
  } catch (error) {
    console.error('Subscription management error:', error);
    return createResponse(
      false,
      null,
      'Internal server error',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
});

/**
 * Handle subscription changes (upgrade, downgrade, cancel, reactivate)
 */
async function handleSubscriptionChange(req: Request): Promise<Response> {
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
  const body = await parseRequestBody<SubscriptionManagementRequest>(req);

  // Validate required fields
  const validation = validateRequiredFields(body, ['action']);
  if (!validation.valid) {
    return createResponse(
      false,
      null,
      'Missing required fields',
      `Missing fields: ${validation.missing.join(', ')}`
    );
  }

  // Validate user_id matches authenticated user
  if (body.user_id !== user.id) {
    return createResponse(false, null, 'Forbidden', 'User ID does not match authenticated user');
  }

  // Validate action
  const validActions = ['upgrade', 'downgrade', 'cancel', 'reactivate'];
  if (!validActions.includes(body.action)) {
    return createResponse(
      false,
      null,
      'Invalid action',
      `Action must be one of: ${validActions.join(', ')}`
    );
  }

  // Get current profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return createResponse(false, null, 'Profile not found', 'User profile not found');
  }

  // Handle different actions
  let newTier = profile.subscription_tier;
  let newStatus = profile.subscription_status;
  let stripeCustomerId = body.stripe_customer_id;
  let stripeSubscriptionId = body.stripe_subscription_id;

  switch (body.action) {
    case 'upgrade':
      if (!body.tier) {
        return createResponse(false, null, 'Missing tier', 'Tier is required for upgrade');
      }
      if (!['pro', 'enterprise'].includes(body.tier)) {
        return createResponse(false, null, 'Invalid tier', 'Can only upgrade to pro or enterprise');
      }
      // Determine upgrade path
      if (profile.subscription_tier === 'free' && body.tier === 'pro') {
        newTier = 'pro';
      } else if (profile.subscription_tier === 'free' && body.tier === 'enterprise') {
        newTier = 'enterprise';
      } else if (profile.subscription_tier === 'pro' && body.tier === 'enterprise') {
        newTier = 'enterprise';
      } else {
        return createResponse(
          false,
          null,
          'Invalid upgrade',
          `Cannot upgrade from ${profile.subscription_tier} to ${body.tier}`
        );
      }
      newStatus = 'active';
      break;

    case 'downgrade':
      if (!body.tier) {
        return createResponse(false, null, 'Missing tier', 'Tier is required for downgrade');
      }
      if (body.tier === 'free' && profile.subscription_tier !== 'free') {
        newTier = 'free';
        newStatus = 'active';
      } else if (body.tier === 'pro' && profile.subscription_tier === 'enterprise') {
        newTier = 'pro';
        newStatus = 'active';
      } else {
        return createResponse(
          false,
          null,
          'Invalid downgrade',
          `Cannot downgrade from ${profile.subscription_tier} to ${body.tier}`
        );
      }
      break;

    case 'cancel':
      if (profile.subscription_tier === 'free') {
        return createResponse(false, null, 'Cannot cancel', 'Free tier cannot be cancelled');
      }
      newStatus = 'cancelled';
      // Note: Tier remains the same, but status changes to cancelled
      // This allows for reactivation later
      break;

    case 'reactivate':
      if (profile.subscription_status !== 'cancelled') {
        return createResponse(false, null, 'Not cancelled', 'Subscription is not cancelled');
      }
      newStatus = 'active';
      break;

    default:
      return createResponse(false, null, 'Invalid action', 'Unknown action');
  }

  // Update profile with new subscription details
  const updateData: Record<string, any> = {
    subscription_tier: newTier,
    subscription_status: newStatus,
  };

  // Update Stripe IDs if provided
  if (stripeCustomerId) {
    // In a real implementation, you'd store this in a separate table or metadata
    // For now, we'll store it in user metadata
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        stripe_customer_id: stripeCustomerId,
        ...(stripeSubscriptionId && { stripe_subscription_id: stripeSubscriptionId }),
      },
    });
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();

  if (updateError || !updatedProfile) {
    console.error('Subscription update error:', updateError);
    return createResponse(false, null, 'Update failed', updateError?.message || 'Failed to update subscription');
  }

  // In a production environment, you would integrate with Stripe here:
  // - Create/update Stripe customer
  // - Create/update Stripe subscription
  // - Handle webhooks for payment events
  // For now, we'll just log that Stripe integration would happen here
  if (body.action === 'upgrade' && stripeCustomerId) {
    console.log('Stripe integration would be called here for subscription creation');
    // Example: await createStripeSubscription(stripeCustomerId, newTier);
  }

  return createResponse(
    true,
    {
      subscription: {
        tier: updatedProfile.subscription_tier,
        status: updatedProfile.subscription_status,
      },
    },
    null,
    `Subscription ${body.action} completed successfully`
  );
}

/**
 * Handle getting current subscription details
 */
async function handleGetSubscription(req: Request): Promise<Response> {
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

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return createResponse(false, null, 'Profile not found', 'User profile not found');
  }

  return createResponse(
    true,
    {
      subscription: {
        tier: profile.subscription_tier,
        status: profile.subscription_status,
      },
    },
    null,
    'Subscription retrieved successfully'
  );
}

