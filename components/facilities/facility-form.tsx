'use client'

import { useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { facilityFormSchema, type FacilityFormData } from '@/lib/validations/facility'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Facility } from '@/types'

interface FacilityFormProps {
  facility?: Facility
  onSubmit: (data: FacilityFormData) => Promise<void>
}

export function FacilityForm({ facility, onSubmit }: FacilityFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FacilityFormData>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: facility
      ? {
          name: facility.name || '',
          address: {
            street: facility.address?.street || '',
            city: facility.address?.city || '',
            state: facility.address?.state || '',
            zip: facility.address?.zip || '',
            country: facility.address?.country || 'US',
            coordinates: facility.address?.coordinates,
          },
          amenities: Array.isArray(facility.amenities) ? facility.amenities : [],
          contact_info:
            facility.contact_info && Object.keys(facility.contact_info).length > 0
              ? facility.contact_info
              : null,
          operating_hours:
            facility.operating_hours && Object.keys(facility.operating_hours).length > 0
              ? facility.operating_hours
              : null,
          photos: Array.isArray(facility.photos) ? facility.photos : [],
          notes: facility.notes || '',
          status: facility.status || 'active',
        }
      : {
          name: '',
          address: {
            street: '',
            city: '',
            state: '',
            zip: '',
            country: 'US',
          },
          amenities: [],
          photos: [],
          notes: '',
          status: 'active',
        },
  })

  const { fields: amenityFields, append: appendAmenity, remove: removeAmenity } = useFieldArray({
    control: form.control,
    name: 'amenities',
  })

  const handleSubmit = async (data: FacilityFormData) => {
    console.log('🔵 FacilityForm handleSubmit called', { data, facility })
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔵 Calling onSubmit...')
      await onSubmit(data)
      console.log('🔵 onSubmit completed, navigating...')
      // Use startTransition to handle navigation smoothly
      startTransition(() => {
        router.push('/facilities')
      })
    } catch (err) {
      console.error('🔴 Error in handleSubmit:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          console.log('🟡 Form onSubmit event fired', e)
          e.preventDefault()
          form.handleSubmit(handleSubmit)(e)
        }} 
        className="space-y-6"
      >
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facility Name</FormLabel>
                <FormControl>
                  <Input placeholder="Main Storage Facility" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Address</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" maxLength={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Amenities</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendAmenity({ name: '', description: '' })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Amenity
            </Button>
          </div>

          {amenityFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No amenities added yet</p>
          ) : (
            <div className="space-y-2">
              {amenityFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`amenities.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Amenity name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`amenities.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Description (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeAmenity(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this facility..."
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>Optional notes about this facility</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={isLoading || isPending}
            onClick={(e) => {
              console.log('🟡 Button clicked!', {
                isLoading,
                isPending,
                formState: form.formState,
                errors: form.formState.errors,
                isValid: form.formState.isValid,
                values: form.getValues()
              })
              // Check validation
              form.trigger().then((isValid) => {
                console.log('🟡 Form validation result:', isValid)
                if (!isValid) {
                  console.log('🔴 Validation errors:', form.formState.errors)
                }
              })
            }}
          >
            {isLoading || isPending ? 'Saving...' : facility ? 'Update Facility' : 'Create Facility'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
