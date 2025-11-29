import { z } from 'zod'

// Invoice form schema
export const invoiceFormSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  rental_id: z.string().uuid('Invalid rental ID').optional().nullable(),
  invoice_number: z.string().min(1, 'Invoice number is required').max(100, 'Invoice number is too long'),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  amount_due: z.number().positive('Amount due must be positive'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  payment_method_id: z.string().uuid('Invalid payment method ID').optional().nullable(),
  stripe_invoice_id: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
})

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>

// Invoice update schema (for partial updates)
export const invoiceUpdateSchema = invoiceFormSchema.partial().extend({
  amount_paid: z.number().nonnegative('Amount paid cannot be negative').optional(),
  paid_at: z.string().datetime().optional().nullable(),
})

export type InvoiceUpdateData = z.infer<typeof invoiceUpdateSchema>
