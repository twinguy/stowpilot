import { z } from 'zod'

// Payment form schema
export const paymentFormSchema = z.object({
  invoice_id: z.string().uuid('Invalid invoice ID'),
  customer_id: z.string().uuid('Invalid customer ID'),
  amount: z.number().positive('Amount must be positive'),
  payment_method_id: z.string().uuid('Invalid payment method ID').optional().nullable(),
  transaction_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).default('pending'),
})

export type PaymentFormData = z.infer<typeof paymentFormSchema>

// Payment update schema (for partial updates)
export const paymentUpdateSchema = paymentFormSchema.partial().extend({
  processed_at: z.string().datetime().optional().nullable(),
})

export type PaymentUpdateData = z.infer<typeof paymentUpdateSchema>
