import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RentalTable } from '@/components/rentals/rental-table'
import { RentalsFiltersClient } from '@/components/rentals/rentals-filters-client'
import { Button } from '@/components/ui/button'
import { type Rental, type RentalFilters } from '@/types'

async function getRentals(filters: RentalFilters = {}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  let query = supabase
    .from('rentals')
    .select('*, customers(*), units(*, facilities(*))')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id)
  }

  if (filters.unit_id) {
    query = query.eq('unit_id', filters.unit_id)
  }

  if (filters.search) {
    query = query.or(
      `customers.first_name.ilike.%${filters.search}%,customers.last_name.ilike.%${filters.search}%,units.unit_number.ilike.%${filters.search}%,special_terms.ilike.%${filters.search}%`
    )
  }

  const { data } = await query
  return (data as Rental[]) || []
}

export default async function RentalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const filters: RentalFilters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    status:
      typeof params.status === 'string'
        ? (params.status.split(',') as RentalFilters['status'])
        : undefined,
    customer_id: typeof params.customer_id === 'string' ? params.customer_id : undefined,
    unit_id: typeof params.unit_id === 'string' ? params.unit_id : undefined,
    facility_id: typeof params.facility_id === 'string' ? params.facility_id : undefined,
  }

  const rentals = await getRentals(filters)

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rental Agreements</h1>
          <p className="text-muted-foreground">Manage your rental agreements</p>
        </div>
        <Button asChild>
          <Link href="/rentals/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Rental
          </Link>
        </Button>
      </div>

      <RentalsFiltersClient filters={filters} />

      <RentalTable rentals={rentals} />
    </div>
  )
}
