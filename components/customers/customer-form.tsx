'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { customerFormSchema, type CustomerFormData } from '@/lib/validations/customer'
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
import { type Customer } from '@/types'

interface CustomerFormProps {
  customer?: Customer
  onSubmit: (data: CustomerFormData) => Promise<void>
}

export function CustomerForm({ customer, onSubmit }: CustomerFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customer
      ? {
          first_name: customer.first_name || '',
          last_name: customer.last_name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address
            ? {
                street: customer.address.street || '',
                city: customer.address.city || '',
                state: customer.address.state || '',
                zip: customer.address.zip || '',
                country: customer.address.country || 'US',
                coordinates: customer.address.coordinates,
              }
            : null,
          emergency_contact: customer.emergency_contact || null,
          identification: customer.identification || null,
          credit_score: customer.credit_score || null,
          background_check_status: customer.background_check_status || 'pending',
          notes: customer.notes || '',
          status: customer.status || 'active',
        }
      : {
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          address: null,
          emergency_contact: null,
          identification: null,
          credit_score: null,
          background_check_status: 'pending',
          notes: '',
          status: 'active',
        },
  })

  const handleSubmit = async (data: CustomerFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Preprocess data: convert empty strings to undefined and clean up nested objects
      let processedData = { ...data }

      // Clean emergency_contact
      if (processedData.emergency_contact) {
        const cleaned = {
          name:
            processedData.emergency_contact.name === '' || processedData.emergency_contact.name === null
              ? undefined
              : processedData.emergency_contact.name,
          phone:
            processedData.emergency_contact.phone === '' || processedData.emergency_contact.phone === null
              ? undefined
              : processedData.emergency_contact.phone,
          relationship:
            processedData.emergency_contact.relationship === '' ||
            processedData.emergency_contact.relationship === null
              ? undefined
              : processedData.emergency_contact.relationship,
        }

        // If all fields are undefined, set the whole object to null
        if (!cleaned.name && !cleaned.phone && !cleaned.relationship) {
          processedData.emergency_contact = null
        } else {
          processedData.emergency_contact = cleaned
        }
      }

      // Clean identification
      if (processedData.identification) {
        const cleaned = {
          type:
            processedData.identification.type === null || processedData.identification.type === undefined
              ? undefined
              : processedData.identification.type,
          number:
            processedData.identification.number === '' || processedData.identification.number === null
              ? undefined
              : processedData.identification.number,
          expiry:
            processedData.identification.expiry === '' || processedData.identification.expiry === null
              ? undefined
              : processedData.identification.expiry,
        }

        // If all fields are undefined, set the whole object to null
        if (!cleaned.type && !cleaned.number && !cleaned.expiry) {
          processedData.identification = null
        } else {
          processedData.identification = cleaned
        }
      }

      await onSubmit(processedData)
      startTransition(() => {
        router.push('/customers')
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="(555) 123-4567" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Billing Address</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} value={field.value || ''} />
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
                    <Input placeholder="City" {...field} value={field.value || ''} />
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
                    <Input placeholder="CA" maxLength={2} {...field} value={field.value || ''} />
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
                    <Input placeholder="12345" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Emergency Contact</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="emergency_contact.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jane Doe"
                      value={form.watch('emergency_contact')?.name || ''}
                      onChange={(e) => {
                        const current = form.getValues('emergency_contact')
                        form.setValue('emergency_contact', {
                          ...(current || {}),
                          name: e.target.value === '' ? undefined : e.target.value,
                        })
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergency_contact.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={form.watch('emergency_contact')?.phone || ''}
                      onChange={(e) => {
                        const current = form.getValues('emergency_contact')
                        form.setValue('emergency_contact', {
                          ...(current || {}),
                          phone: e.target.value === '' ? undefined : e.target.value,
                        })
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergency_contact.relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Spouse"
                      value={form.watch('emergency_contact')?.relationship || ''}
                      onChange={(e) => {
                        const current = form.getValues('emergency_contact')
                        form.setValue('emergency_contact', {
                          ...(current || {}),
                          relationship: e.target.value === '' ? undefined : e.target.value,
                        })
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Identification</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="identification.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const current = form.getValues('identification')
                      form.setValue('identification', {
                        ...(current || {}),
                        type: value === '' ? undefined : (value as 'drivers_license' | 'passport' | 'state_id' | 'other' | undefined),
                      })
                    }}
                    value={form.watch('identification')?.type || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="state_id">State ID</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identification.number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ID Number"
                      value={form.watch('identification')?.number || ''}
                      onChange={(e) => {
                        const current = form.getValues('identification')
                        form.setValue('identification', {
                          ...(current || {}),
                          number: e.target.value === '' ? undefined : e.target.value,
                        })
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identification.expiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={form.watch('identification')?.expiry || ''}
                      onChange={(e) => {
                        const current = form.getValues('identification')
                        form.setValue('identification', {
                          ...(current || {}),
                          expiry: e.target.value === '' ? undefined : e.target.value,
                        })
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="credit_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Score</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={300}
                    max={850}
                    placeholder="750"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>Optional credit score (300-850)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="background_check_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Background Check Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="not_required">Not Required</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="delinquent">Delinquent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this customer..."
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>Optional notes about this customer</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading || isPending}>
            {isLoading || isPending ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
