'use client'

import { useRouter } from 'next/navigation'
import { type FacilityFilters } from '@/types'
import { SearchFilters } from './search-filters'

interface FacilitiesFiltersClientProps {
  filters: FacilityFilters
}

export function FacilitiesFiltersClient({ filters }: FacilitiesFiltersClientProps) {
  const router = useRouter()

  return (
    <SearchFilters
      filters={filters}
      onFiltersChange={(newFilters) => {
        const params = new URLSearchParams()
        if (newFilters.search) params.set('search', newFilters.search)
        if (newFilters.status) params.set('status', newFilters.status.join(','))
        if (newFilters.city) params.set('city', newFilters.city)
        if (newFilters.state) params.set('state', newFilters.state)
        router.push(`/facilities?${params.toString()}`)
      }}
      onClear={() => {
        router.push('/facilities')
      }}
    />
  )
}
