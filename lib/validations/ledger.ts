import { z } from 'zod'

// Ledger entry form schema
export const ledgerEntryFormSchema = z.object({
  facility_id: z.string().uuid('Invalid facility ID').optional().nullable(),
  customer_id: z.string().uuid('Invalid customer ID').optional().nullable(),
  rental_id: z.string().uuid('Invalid rental ID').optional().nullable(),
  type: z.enum(['income', 'expense', 'adjustment']),
  category: z.string().min(1, 'Category is required').max(100, 'Category is too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description is too long'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  payment_id: z.string().uuid('Invalid payment ID').optional().nullable(),
})

export type LedgerEntryFormData = z.infer<typeof ledgerEntryFormSchema>
