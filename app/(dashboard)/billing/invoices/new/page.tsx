import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { InvoiceForm } from '@/components/billing/invoice-form'
import { type InvoiceFormData } from '@/lib/validations/invoice'
import { type Customer, type Rental } from '@/types'

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
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (data as Rental[]) || []
}

async function createInvoice(data: InvoiceFormData) {
  'use server'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify customer ownership
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('id', data.customer_id)
    .eq('owner_id', user.id)
    .single()

  if (!customer) {
    throw new Error('Customer not found')
  }

  // Verify rental ownership if provided
  if (data.rental_id) {
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

  const { error } = await supabase.from('invoices').insert({
    customer_id: data.customer_id,
    rental_id: data.rental_id || null,
    invoice_number: data.invoice_number,
    period_start: data.period_start,
    period_end: data.period_end,
    amount_due: data.amount_due,
    amount_paid: 0,
    due_date: data.due_date,
    payment_method_id: data.payment_method_id || null,
    stripe_invoice_id: data.stripe_invoice_id || null,
    status: data.status,
  })

  if (error) {
    throw new Error(error.message)
  }

  // Revalidate the billing pages to show the new invoice
  revalidatePath('/billing')
  revalidatePath('/billing/invoices')
}

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const customers = await getCustomers()
  const rentals = await getRentals()

  if (customers.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 py-6">
        <div className="rounded-lg border p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No Active Customers</h2>
          <p className="text-muted-foreground mb-4">
            You need at least one active customer to create an invoice.
          </p>
          <a
            href="/customers/new"
            className="text-primary hover:underline font-medium"
          >
            Create a customer →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Invoice</h1>
        <p className="text-muted-foreground">Generate a new invoice for a customer</p>
      </div>

      <InvoiceForm customers={customers} rentals={rentals} onSubmit={createInvoice} />
    </div>
  )
}
