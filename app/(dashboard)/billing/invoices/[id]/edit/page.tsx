import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { InvoiceEditForm } from '@/components/billing/invoice-edit-form'
import { type InvoiceFormData } from '@/lib/validations/invoice'
import { type Invoice, type Customer, type Rental } from '@/types'

async function getInvoice(id: string): Promise<Invoice | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('invoices')
    .select('*, customers!inner(owner_id)')
    .eq('id', id)
    .eq('customers.owner_id', user.id)
    .single()

  return data as Invoice | null
}

async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'active')
    .order('last_name', { ascending: true })

  return (data as Customer[]) || []
}

async function getRentals(): Promise<Rental[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('rentals')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (data as Rental[]) || []
}

async function updateInvoice(id: string, data: InvoiceFormData) {
  'use server'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify invoice ownership
  const { data: existingInvoiceData } = await supabase
    .from('invoices')
    .select('*, customers!inner(owner_id)')
    .eq('id', id)
    .eq('customers.owner_id', user.id)
    .single()

  if (!existingInvoiceData) {
    throw new Error('Invoice not found')
  }

  const existingInvoice = existingInvoiceData as Invoice

  // Verify customer ownership if changed
  if (data.customer_id !== existingInvoice.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('id', data.customer_id)
      .eq('owner_id', user.id)
      .single()

    if (!customer) {
      throw new Error('Customer not found')
    }
  }

  // Verify rental ownership if changed
  if (data.rental_id && data.rental_id !== existingInvoice.rental_id) {
    const { data: rental } = await supabase
      .from('rentals')
      .select('id')
      .eq('id', data.rental_id)
      .eq('owner_id', user.id)
      .single()

    if (!rental) {
      throw new Error('Rental not found')
    }
  }

  const { error } = await supabase
    .from('invoices')
    .update({
      customer_id: data.customer_id,
      rental_id: data.rental_id || null,
      invoice_number: data.invoice_number,
      period_start: data.period_start,
      period_end: data.period_end,
      amount_due: data.amount_due,
      due_date: data.due_date,
      payment_method_id: data.payment_method_id || null,
      stripe_invoice_id: data.stripe_invoice_id || null,
      status: data.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // Revalidate billing pages
  revalidatePath('/billing')
  revalidatePath(`/billing/invoices/${id}`)
}

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const invoice = await getInvoice(id)
  const customers = await getCustomers()
  const rentals = await getRentals()

  if (!invoice) {
    notFound()
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Invoice</h1>
        <p className="text-muted-foreground">Update invoice information</p>
      </div>

      <InvoiceEditForm
        invoice={invoice}
        invoiceId={id}
        customers={customers}
        rentals={rentals}
        updateAction={updateInvoice}
      />
    </div>
  )
}
