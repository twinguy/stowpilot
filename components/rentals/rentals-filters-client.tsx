'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { type RentalFilters } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RentalsFiltersClientProps {
  filters: RentalFilters
}

export function RentalsFiltersClient({ filters }: RentalsFiltersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(filters.search || '')

  const updateFilters = (newFilters: Partial<RentalFilters>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
          params.delete(key)
        } else if (Array.isArray(value)) {
          params.set(key, value.join(','))
        } else {
          params.set(key, String(value))
        }
      })

      router.push(`/rentals?${params.toString()}`)
    })
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    updateFilters({ search: value || undefined })
  }

  const clearFilters = () => {
    setSearch('')
    router.push('/rentals')
  }

  const hasActiveFilters =
    filters.search || (filters.status && filters.status.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by customer name, unit number..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filters.status?.join(',') || 'all'}
            onValueChange={(value) => {
              updateFilters({
                status: value === 'all' ? undefined : (value.split(',') as RentalFilters['status']),
              })
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_signature">Pending Signature</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
