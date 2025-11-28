import { z } from 'zod'

// Unit size schema
export const unitSizeSchema = z.object({
  width: z.number().positive('Width must be positive'),
  length: z.number().positive('Length must be positive'),
  square_feet: z.number().positive('Square feet must be positive'),
})

// Unit form schema
export const unitFormSchema = z.object({
  facility_id: z.string().uuid('Invalid facility ID'),
  unit_number: z.string().min(1, 'Unit number is required').max(50, 'Unit number is too long'),
  size: unitSizeSchema,
  type: z.enum(['standard', 'climate_controlled', 'outdoor', 'vehicle']).default('standard'),
  floor_level: z.number().int().min(0, 'Floor level cannot be negative').default(1),
  features: z.array(z.string()).default([]),
  monthly_rate: z.number().positive('Monthly rate must be positive'),
  photos: z.array(z.string().url('Invalid photo URL')).default([]),
  notes: z.string().optional(),
  status: z
    .enum(['available', 'occupied', 'reserved', 'maintenance', 'out_of_service'])
    .default('available'),
})

export type UnitFormData = z.infer<typeof unitFormSchema>

// Bulk import schema (for CSV import)
export const bulkUnitImportSchema = z.object({
  facility_id: z.string().uuid('Invalid facility ID'),
  units: z.array(unitFormSchema).min(1, 'At least one unit is required'),
})

export type BulkUnitImportData = z.infer<typeof bulkUnitImportSchema>
