'use client'

import { type FacilityFilters } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface SearchFiltersProps {
  filters: FacilityFilters
  onFiltersChange: (filters: FacilityFilters) => void
  onClear: () => void
}

export function SearchFilters({ filters, onFiltersChange, onClear }: SearchFiltersProps) {
  const hasActiveFilters =
    filters.search || filters.status?.length || filters.city || filters.state

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear All
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search facilities..."
            value={filters.search || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                search: e.target.value || undefined,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status?.join(',') || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value === 'all' ? undefined : (value.split(',') as FacilityFilters['status']),
              })
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="Filter by city..."
            value={filters.city || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                city: e.target.value || undefined,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            placeholder="Filter by state..."
            maxLength={2}
            value={filters.state || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                state: e.target.value.toUpperCase() || undefined,
              })
            }
          />
        </div>
      </div>
    </div>
  )
}
