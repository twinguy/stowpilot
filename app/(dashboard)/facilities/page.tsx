import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FacilityGrid } from '@/components/facilities/facility-grid'
import { FacilitiesFiltersClient } from '@/components/facilities/facilities-filters-client'
import { Button } from '@/components/ui/button'
import { type Facility, type FacilityFilters } from '@/types'

async function getFacilities(filters: FacilityFilters = {}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  let query = supabase
    .from('facilities')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters.city) {
    query = query.contains('address', { city: filters.city })
  }

  if (filters.state) {
    query = query.contains('address', { state: filters.state })
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
  }

  const { data } = await query
  return (data as Facility[]) || []
}

export default async function FacilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const filters: FacilityFilters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    status:
      typeof params.status === 'string'
        ? (params.status.split(',') as FacilityFilters['status'])
        : undefined,
    city: typeof params.city === 'string' ? params.city : undefined,
    state: typeof params.state === 'string' ? params.state : undefined,
  }

  const facilities = await getFacilities(filters)

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facilities</h1>
          <p className="text-muted-foreground">Manage your storage facilities</p>
        </div>
        <Button asChild>
          <Link href="/facilities/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Facility
          </Link>
        </Button>
      </div>

      <FacilitiesFiltersClient filters={filters} />

      <FacilityGrid facilities={facilities} />
    </div>
  )
}
