'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { InvoiceForm } from './invoice-form'
import { type Invoice } from '@/types'
import { type InvoiceFormData } from '@/lib/validations/invoice'
import { type Customer, type Rental } from '@/types'

interface InvoiceEditFormProps {
  invoice: Invoice
  invoiceId: string
  customers: Customer[]
  rentals: Rental[]
  updateAction: (id: string, data: InvoiceFormData) => Promise<void>
}

export function InvoiceEditForm({
  invoice,
  invoiceId,
  customers,
  rentals,
  updateAction,
}: InvoiceEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: InvoiceFormData) => {
    setError(null)
    try {
      await updateAction(invoiceId, data)
      startTransition(() => {
        router.push('/billing')
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update invoice')
    }
  }

  // Convert invoice to form data format
  const invoiceFormData: InvoiceFormData = {
    customer_id: invoice.customer_id,
    rental_id: invoice.rental_id || null,
    invoice_number: invoice.invoice_number,
    period_start: invoice.period_start,
    period_end: invoice.period_end,
    amount_due: invoice.amount_due,
    due_date: invoice.due_date,
    payment_method_id: invoice.payment_method_id || null,
    stripe_invoice_id: invoice.stripe_invoice_id || null,
    status: invoice.status,
  }

  return (
    <>
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}
      <InvoiceForm
        customers={customers}
        rentals={rentals}
        onSubmit={handleSubmit}
        initialData={invoiceFormData}
        isEditMode={true}
      />
    </>
  )
}
