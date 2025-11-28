import { z } from 'zod'

// Rental form schema
export const rentalFormSchema = z
  .object({
    customer_id: z.string().uuid('Invalid customer ID'),
    unit_id: z.string().uuid('Invalid unit ID'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().optional().nullable(),
    monthly_rate: z.number().positive('Monthly rate must be positive'),
    security_deposit: z.number().min(0, 'Security deposit cannot be negative').default(0),
    late_fee_rate: z.number().min(0, 'Late fee rate cannot be negative').default(0),
    auto_renew: z.boolean().default(true),
    insurance_required: z.boolean().default(false),
    insurance_provider: z.string().optional().nullable(),
    insurance_policy_number: z.string().optional().nullable(),
    special_terms: z.string().optional().nullable(),
    status: z.enum(['draft', 'pending_signature', 'active', 'terminated', 'expired']).default('draft'),
  })
  .refine(
    (data) => {
      if (!data.end_date) return true // Month-to-month is allowed
      const startDate = new Date(data.start_date)
      const endDate = new Date(data.end_date)
      return endDate >= startDate
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      if (data.insurance_required) {
        return !!(data.insurance_provider && data.insurance_policy_number)
      }
      return true
    },
    {
      message: 'Insurance provider and policy number are required when insurance is required',
      path: ['insurance_provider'],
    }
  )

export type RentalFormData = z.infer<typeof rentalFormSchema>
