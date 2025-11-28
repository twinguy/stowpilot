'use client'

import { useState, useTransition, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { invoiceFormSchema, type InvoiceFormData } from '@/lib/validations/invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { type Customer, type Rental } from '@/types'

interface InvoiceFormProps {
  customers: Customer[]
  rentals?: Rental[]
  onSubmit: (data: InvoiceFormData) => Promise<void>
  initialData?: InvoiceFormData
  isEditMode?: boolean
}

// Generate invoice number helper
function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${year}${month}-${random}`
}

export function InvoiceForm({
  customers,
  rentals = [],
  onSubmit,
  initialData,
  isEditMode = false,
}: InvoiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: initialData || {
      customer_id: '',
      rental_id: null,
      invoice_number: generateInvoiceNumber(),
      period_start: new Date().toISOString().split('T')[0],
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      amount_due: 0,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      payment_method_id: null,
      stripe_invoice_id: null,
      status: 'draft',
    },
  })

  const selectedCustomer = form.watch('customer_id')
  const selectedRental = form.watch('rental_id')

  // Filter rentals for selected customer
  const customerRentals = selectedCustomer
    ? rentals.filter((r) => r.customer_id === selectedCustomer)
    : []

  // Auto-populate amount_due from rental if selected
  useEffect(() => {
    if (selectedRental) {
      const rental = rentals.find((r) => r.id === selectedRental)
      if (rental && form.getValues('amount_due') === 0) {
        form.setValue('amount_due', rental.monthly_rate)
      }
    }
  }, [selectedRental, rentals, form])

  const handleSubmit = async (data: InvoiceFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await onSubmit(data)
      startTransition(() => {
        router.push('/billing')
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice')
    } finally {
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

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="customer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name}
                        {customer.email && ` (${customer.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rental_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rental (Optional)</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value === 'none' ? null : value)
                  }}
                  value={field.value ? field.value : 'none'}
                  disabled={!selectedCustomer}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a rental (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {customerRentals.map((rental) => (
                      <SelectItem key={rental.id} value={rental.id}>
                        Rental #{rental.id.slice(0, 8)} - ${rental.monthly_rate}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Link this invoice to a specific rental agreement
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="invoice_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number *</FormLabel>
                <FormControl>
                  <Input placeholder="INV-202401-0001" {...field} />
                </FormControl>
                <FormDescription>Unique invoice identifier</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="period_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period Start *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>Start date of the billing period</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="period_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period End *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>End date of the billing period</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="amount_due"
            render={({ field }) => {
              const formatCurrency = (value: number | string): string => {
                if (!value && value !== 0) return ''
                const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value
                if (isNaN(numValue)) return ''
                return numValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }

              const parseCurrency = (value: string): number => {
                const cleaned = value.replace(/[^0-9.]/g, '')
                const parsed = parseFloat(cleaned)
                return isNaN(parsed) ? 0 : parsed
              }

              return (
                <FormItem>
                  <FormLabel>Amount Due *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="text"
                        placeholder="0.00"
                        className="pl-7"
                        value={formatCurrency(field.value)}
                        onChange={(e) => {
                          const parsed = parseCurrency(e.target.value)
                          field.onChange(parsed)
                        }}
                        onBlur={field.onBlur}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Total amount due for this invoice</FormDescription>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>Date when payment is due</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading || isPending}>
            {isLoading || isPending
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
                ? 'Update Invoice'
                : 'Create Invoice'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading || isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
