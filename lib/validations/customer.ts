import { z } from 'zod'
import { addressSchema } from './facility'

// Emergency contact schema - all fields optional
export const emergencyContactSchema = z
  .object({
    name: z.string().nullish(),
    phone: z.string().nullish(),
    relationship: z.string().nullish(),
  })
  .nullish()

// Identification schema - all fields optional
export const identificationSchema = z
  .object({
    type: z.enum(['drivers_license', 'passport', 'state_id', 'other']).nullish(),
    number: z.string().nullish(),
    expiry: z.string().nullish(), // ISO date string
  })
  .nullish()

// Customer form schema
export const customerFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: addressSchema.optional().nullable(),
  emergency_contact: emergencyContactSchema,
  identification: identificationSchema,
  credit_score: z.number().int().min(300).max(850).optional().nullable(),
  background_check_status: z.enum(['pending', 'approved', 'rejected', 'not_required']),
  notes: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'delinquent']),
})

export type CustomerFormData = z.infer<typeof customerFormSchema>
