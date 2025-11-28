import { createClient } from '@/lib/supabase/server'
import { LedgerView } from '@/components/billing/ledger-view'
import { type LedgerEntry, type LedgerFilters } from '@/types'

async function getLedgerEntries(filters: LedgerFilters = {}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  let query = supabase
    .from('ledger_entries')
    .select('*')
    .eq('owner_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.type && filters.type.length > 0) {
    query = query.in('type', filters.type)
  }

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.facility_id) {
    query = query.eq('facility_id', filters.facility_id)
  }

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id)
  }

  if (filters.rental_id) {
    query = query.eq('rental_id', filters.rental_id)
  }

  if (filters.date_from) {
    query = query.gte('date', filters.date_from)
  }

  if (filters.date_to) {
    query = query.lte('date', filters.date_to)
  }

  const { data } = await query
  return (data as LedgerEntry[]) || []
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const filters: LedgerFilters = {
    type:
      typeof params.type === 'string'
        ? (params.type.split(',') as LedgerFilters['type'])
        : undefined,
    category: typeof params.category === 'string' ? params.category : undefined,
    facility_id: typeof params.facility_id === 'string' ? params.facility_id : undefined,
    customer_id: typeof params.customer_id === 'string' ? params.customer_id : undefined,
    rental_id: typeof params.rental_id === 'string' ? params.rental_id : undefined,
    date_from: typeof params.date_from === 'string' ? params.date_from : undefined,
    date_to: typeof params.date_to === 'string' ? params.date_to : undefined,
  }

  const entries = await getLedgerEntries(filters)

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Accounting Ledger</h1>
        <p className="text-muted-foreground">View all income, expenses, and adjustments</p>
      </div>

      <LedgerView entries={entries} />
    </div>
  )
}
