import { z } from 'zod'

// Payment method form schema
export const paymentMethodFormSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  type: z.enum(['credit_card', 'ach', 'cash', 'check']),
  provider: z.string().default('stripe'),
  provider_payment_method_id: z.string().optional().nullable(),
  last_four: z.string().max(4, 'Last four digits must be 4 characters').optional().nullable(),
  expiry_month: z.number().int().min(1).max(12).optional().nullable(),
  expiry_year: z.number().int().min(2000).max(2100).optional().nullable(),
  is_default: z.boolean().default(false),
  status: z.enum(['active', 'expired', 'failed']).default('active'),
})

export type PaymentMethodFormData = z.infer<typeof paymentMethodFormSchema>

// Payment method update schema (for partial updates)
export const paymentMethodUpdateSchema = paymentMethodFormSchema.partial()

export type PaymentMethodUpdateData = z.infer<typeof paymentMethodUpdateSchema>
