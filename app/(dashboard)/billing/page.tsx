import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InvoiceDashboard } from '@/components/billing/invoice-dashboard'
import { Button } from '@/components/ui/button'
import { type Invoice, type InvoiceFilters } from '@/types'

async function getInvoices(filters: InvoiceFilters = {}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  let query = supabase
    .from('invoices')
    .select('*, customers!inner(owner_id, first_name, last_name)')
    .eq('customers.owner_id', user.id)
    .order('due_date', { ascending: false })

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id)
  }

  if (filters.rental_id) {
    query = query.eq('rental_id', filters.rental_id)
  }

  if (filters.due_date_from) {
    query = query.gte('due_date', filters.due_date_from)
  }

  if (filters.due_date_to) {
    query = query.lte('due_date', filters.due_date_to)
  }

  if (filters.search) {
    query = query.or(`invoice_number.ilike.%${filters.search}%`)
  }

  const { data } = await query
  return (data as Invoice[]) || []
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const filters: InvoiceFilters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    status:
      typeof params.status === 'string'
        ? (params.status.split(',') as InvoiceFilters['status'])
        : undefined,
    customer_id: typeof params.customer_id === 'string' ? params.customer_id : undefined,
    rental_id: typeof params.rental_id === 'string' ? params.rental_id : undefined,
    due_date_from: typeof params.due_date_from === 'string' ? params.due_date_from : undefined,
    due_date_to: typeof params.due_date_to === 'string' ? params.due_date_to : undefined,
  }

  const invoices = await getInvoices(filters)

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Manage invoices and payments</p>
        </div>
        <Button asChild>
          <Link href="/billing/invoices/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Link>
        </Button>
      </div>

      <InvoiceDashboard invoices={invoices} />
    </div>
  )
}
