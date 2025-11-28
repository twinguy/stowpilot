import { z } from 'zod'

// Team member invitation validation
export const teamInvitationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['manager', 'staff'], {
    required_error: 'Please select a role',
  }),
  permissions: z.record(z.string(), z.boolean()).optional(),
})

export type TeamInvitationFormData = z.infer<typeof teamInvitationSchema>

// Team member update validation
export const teamMemberUpdateSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').optional(),
  role: z.enum(['manager', 'staff']).optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
  status: z.enum(['pending', 'active', 'inactive']).optional(),
})

export type TeamMemberUpdateFormData = z.infer<typeof teamMemberUpdateSchema>

