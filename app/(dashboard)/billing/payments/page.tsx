import { createClient } from '@/lib/supabase/server'
import { PaymentHistory } from '@/components/billing/payment-history'
import { type Payment, type PaymentFilters } from '@/types'

async function getPayments(filters: PaymentFilters = {}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  let query = supabase
    .from('payments')
    .select('*, customers!inner(owner_id)')
    .eq('customers.owner_id', user.id)
    .order('created_at', { ascending: false })

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id)
  }

  if (filters.invoice_id) {
    query = query.eq('invoice_id', filters.invoice_id)
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from)
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to)
  }

  const { data } = await query
  return (data as Payment[]) || []
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const filters: PaymentFilters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    status:
      typeof params.status === 'string'
        ? (params.status.split(',') as PaymentFilters['status'])
        : undefined,
    customer_id: typeof params.customer_id === 'string' ? params.customer_id : undefined,
    invoice_id: typeof params.invoice_id === 'string' ? params.invoice_id : undefined,
    date_from: typeof params.date_from === 'string' ? params.date_from : undefined,
    date_to: typeof params.date_to === 'string' ? params.date_to : undefined,
  }

  const payments = await getPayments(filters)

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Payment History</h1>
        <p className="text-muted-foreground">View all payment transactions</p>
      </div>

      <PaymentHistory payments={payments} />
    </div>
  )
}
