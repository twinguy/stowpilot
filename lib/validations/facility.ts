import { z } from 'zod'

// Address schema
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2, 'State must be 2 characters'),
  zip: z.string().min(1, 'ZIP code is required').regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  country: z.string().min(1, 'Country is required'),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
})

// Contact info schema
export const contactInfoSchema = z
  .object({
    phone: z.string().nullish(),
    email: z
      .string()
      .nullish()
      .refine((val) => !val || val === '' || z.string().email().safeParse(val).success, {
        message: 'Invalid email address',
      }),
    manager: z.string().nullish(),
  })
  .nullish()

// Operating hours schema
export const operatingHoursSchema = z
  .record(
    z.string(),
    z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean().optional(),
    })
  )
  .nullish()

// Facility form schema
export const facilityFormSchema = z.object({
  name: z.string().min(1, 'Facility name is required').max(255, 'Name is too long'),
  address: addressSchema,
  amenities: z.array(
    z.object({
      name: z.string().min(1, 'Amenity name is required'),
      description: z.string().optional(),
    })
  ),
  contact_info: contactInfoSchema,
  operating_hours: operatingHoursSchema,
  photos: z.array(z.string().url('Invalid photo URL')),
  notes: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'maintenance']),
})

export type FacilityFormData = z.infer<typeof facilityFormSchema>
