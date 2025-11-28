'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { paymentFormSchema, type PaymentFormData } from '@/lib/validations/payment'
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
import { type PaymentMethod } from '@/types'

interface PaymentFormProps {
  invoiceId: string
  customerId: string
  paymentMethods?: PaymentMethod[]
  onSubmit: (data: PaymentFormData) => Promise<void>
}

export function PaymentForm({
  invoiceId,
  customerId,
  paymentMethods = [],
  onSubmit,
}: PaymentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      invoice_id: invoiceId,
      customer_id: customerId,
      amount: 0,
      payment_method_id: paymentMethods.find((pm) => pm.is_default)?.id || null,
      transaction_id: null,
      notes: null,
      status: 'pending',
    },
  })

  const handleSubmit = async (data: PaymentFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await onSubmit(data)
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment')
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

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_method_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.type === 'credit_card'
                          ? `Card ending in ${pm.last_four || '****'}`
                          : pm.type === 'ach'
                            ? `ACH Account`
                            : pm.type === 'cash'
                              ? 'Cash'
                              : 'Check'}
                        {pm.is_default && ' (Default)'}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No payment methods available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the payment method to use for this payment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="transaction_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction ID (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Stripe charge ID"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                External transaction identifier (e.g., Stripe charge ID)
              </FormDescription>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this payment"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading || isPending}>
            {isLoading || isPending ? 'Processing...' : 'Record Payment'}
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
