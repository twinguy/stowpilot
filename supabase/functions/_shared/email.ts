// Email service utilities for Edge Functions

/**
 * Sends an email using Resend API
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from?: string
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const defaultFrom = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@stowpilot.com';

  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || defaultFrom,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return { success: false, error: 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Email service error' };
  }
}

/**
 * Generates email verification email HTML
 */
export function generateVerificationEmail(verificationUrl: string, userName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Welcome to StowPilot!</h1>
          <p>Hi${userName ? ` ${userName}` : ''},</p>
          <p>Thank you for signing up for StowPilot. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with StowPilot, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">© ${new Date().getFullYear()} StowPilot. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates team invitation email HTML
 */
export function generateInvitationEmail(
  invitationUrl: string,
  inviterName: string,
  role: string,
  businessName?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">You've been invited to join StowPilot</h1>
          <p>Hi there,</p>
          <p><strong>${inviterName}</strong>${businessName ? ` from ${businessName}` : ''} has invited you to join their team on StowPilot as a <strong>${role}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${invitationUrl}</p>
          <p>This invitation will expire in 7 days.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">© ${new Date().getFullYear()} StowPilot. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

