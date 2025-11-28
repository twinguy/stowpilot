// Edge Function: Team Invitation
// Sends and processes team member invitations

import { createSupabaseAdminClient } from '../_shared/supabase.ts';
import {
  createResponse,
  isValidEmail,
  parseRequestBody,
  validateRequiredFields,
  getAuthHeader,
} from '../_shared/utils.ts';
import { sendEmail, generateInvitationEmail } from '../_shared/email.ts';
import { TeamInvitationRequest } from '../_shared/types.ts';

Deno.serve(async (req) => {
  try {
    // Handle different HTTP methods
    if (req.method === 'POST') {
      return await handleInvite(req);
    } else if (req.method === 'PUT') {
      return await handleAcceptInvitation(req);
    } else if (req.method === 'GET') {
      return await handleGetInvitations(req);
    } else if (req.method === 'DELETE') {
      return await handleCancelInvitation(req);
    } else {
      return createResponse(false, null, 'Method not allowed', 'Unsupported HTTP method');
    }
  } catch (error) {
    console.error('Team invitation error:', error);
    return createResponse(
      false,
      null,
      'Internal server error',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
});

/**
 * Handle sending a new team invitation
 */
async function handleInvite(req: Request): Promise<Response> {
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

  // Get user profile to verify owner role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, business_name, full_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return createResponse(false, null, 'Profile not found', 'User profile not found');
  }

  // Only owners can invite team members
  if (profile.role !== 'owner') {
    return createResponse(false, null, 'Forbidden', 'Only owners can invite team members');
  }

  // Parse request body
  const body = await parseRequestBody<TeamInvitationRequest>(req);

  // Validate required fields
  const validation = validateRequiredFields(body, ['email', 'role']);
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

  // Validate role
  if (!['manager', 'staff'].includes(body.role)) {
    return createResponse(false, null, 'Invalid role', 'Role must be either "manager" or "staff"');
  }

  // Check if user already exists by checking profiles table
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', body.email)
    .single();

  if (existingProfile) {
    // Check if they're already a team member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select()
      .eq('email', body.email)
      .eq('owner_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingMember) {
      return createResponse(false, null, 'Already a team member', 'This user is already a team member');
    }
  }

  // Check for pending invitation
  const { data: pendingInvitation } = await supabase
    .from('team_members')
    .select()
    .eq('email', body.email)
    .eq('owner_id', user.id)
    .eq('status', 'pending')
    .single();

  if (pendingInvitation) {
    return createResponse(false, null, 'Invitation already sent', 'An invitation has already been sent to this email');
  }

  // Create team member invitation
  const { data: teamMember, error: insertError } = await supabase
    .from('team_members')
    .insert({
      owner_id: user.id,
      email: body.email,
      full_name: body.full_name || null,
      role: body.role,
      permissions: body.permissions || {},
      status: 'pending',
    })
    .select()
    .single();

  if (insertError || !teamMember) {
    console.error('Team member creation error:', insertError);
    return createResponse(false, null, 'Invitation failed', insertError?.message || 'Failed to create invitation');
  }

  // Generate invitation token (using team member ID as token)
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000';
  const invitationUrl = `${appUrl}/auth/accept-invitation?token=${teamMember.id}`;

  // Send invitation email
  const emailHtml = generateInvitationEmail(
    invitationUrl,
    profile.full_name || 'Team Owner',
    body.role,
    profile.business_name || undefined
  );
  const emailResult = await sendEmail(body.email, `You've been invited to join ${profile.business_name || 'StowPilot'}`, emailHtml);

  if (!emailResult.success) {
    console.warn('Email send failed, but invitation was created:', emailResult.error);
  }

  // Return success response
  return createResponse(
    true,
    {
      invitation_id: teamMember.id,
      email: teamMember.email,
      role: teamMember.role,
      status: teamMember.status,
      invited_at: teamMember.invited_at,
    },
    null,
    'Team invitation sent successfully'
  );
}

/**
 * Handle accepting a team invitation
 */
async function handleAcceptInvitation(req: Request): Promise<Response> {
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
  const body = await parseRequestBody<{ invitation_id: string }>(req);

  if (!body.invitation_id) {
    return createResponse(false, null, 'Missing invitation ID', 'invitation_id is required');
  }

  // Get invitation
  const { data: invitation, error: invitationError } = await supabase
    .from('team_members')
    .select()
    .eq('id', body.invitation_id)
    .eq('status', 'pending')
    .single();

  if (invitationError || !invitation) {
    return createResponse(false, null, 'Invitation not found', 'Invalid or expired invitation');
  }

  // Verify email matches
  if (invitation.email !== user.email) {
    return createResponse(false, null, 'Email mismatch', 'Invitation email does not match your account email');
  }

  // Update invitation to active
  const { data: updatedMember, error: updateError } = await supabase
    .from('team_members')
    .update({
      status: 'active',
      joined_at: new Date().toISOString(),
    })
    .eq('id', body.invitation_id)
    .select()
    .single();

  if (updateError || !updatedMember) {
    console.error('Invitation acceptance error:', updateError);
    return createResponse(false, null, 'Acceptance failed', updateError?.message || 'Failed to accept invitation');
  }

  // Update user profile role if needed (for first-time team member)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile && profile.role === 'owner') {
    // User is already an owner, don't change role
  } else {
    // Update profile role to match invitation role
    await supabase
      .from('profiles')
      .update({ role: invitation.role })
      .eq('id', user.id);
  }

  return createResponse(
    true,
    {
      team_member: updatedMember,
    },
    null,
    'Invitation accepted successfully'
  );
}

/**
 * Handle getting invitations (for owner to view pending invitations)
 */
async function handleGetInvitations(req: Request): Promise<Response> {
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

  // Get user profile to verify owner role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return createResponse(false, null, 'Forbidden', 'Only owners can view invitations');
  }

  // Get all team members for this owner
  const { data: teamMembers, error: fetchError } = await supabase
    .from('team_members')
    .select()
    .eq('owner_id', user.id)
    .order('invited_at', { ascending: false });

  if (fetchError) {
    console.error('Fetch invitations error:', fetchError);
    return createResponse(false, null, 'Fetch failed', fetchError.message);
  }

  return createResponse(
    true,
    {
      invitations: teamMembers || [],
    },
    null,
    'Invitations retrieved successfully'
  );
}

/**
 * Handle canceling an invitation
 */
async function handleCancelInvitation(req: Request): Promise<Response> {
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

  // Get invitation ID from URL query params
  const url = new URL(req.url);
  const invitationId = url.searchParams.get('id');

  if (!invitationId) {
    return createResponse(false, null, 'Missing invitation ID', 'id query parameter is required');
  }

  // Get invitation to verify ownership
  const { data: invitation, error: invitationError } = await supabase
    .from('team_members')
    .select('owner_id, status')
    .eq('id', invitationId)
    .single();

  if (invitationError || !invitation) {
    return createResponse(false, null, 'Invitation not found', 'Invalid invitation ID');
  }

  // Verify ownership
  if (invitation.owner_id !== user.id) {
    return createResponse(false, null, 'Forbidden', 'You can only cancel your own invitations');
  }

  // Only allow canceling pending invitations
  if (invitation.status !== 'pending') {
    return createResponse(false, null, 'Invalid status', 'Can only cancel pending invitations');
  }

  // Delete invitation
  const { error: deleteError } = await supabase
    .from('team_members')
    .delete()
    .eq('id', invitationId);

  if (deleteError) {
    console.error('Cancel invitation error:', deleteError);
    return createResponse(false, null, 'Cancel failed', deleteError.message);
  }

  return createResponse(true, null, null, 'Invitation cancelled successfully');
}

