'use client'

import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type CustomerFilters } from '@/types'
import { X } from 'lucide-react'

interface CustomersFiltersClientProps {
  filters: CustomerFilters
}

export function CustomersFiltersClient({ filters }: CustomersFiltersClientProps) {
  const router = useRouter()

  const handleSearchChange = (search: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filters.status) params.set('status', filters.status.join(','))
    if (filters.background_check_status)
      params.set('background_check_status', filters.background_check_status.join(','))
    router.push(`/customers?${params.toString()}`)
  }

  const handleStatusChange = (status: string[]) => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (status.length > 0) params.set('status', status.join(','))
    if (filters.background_check_status)
      params.set('background_check_status', filters.background_check_status.join(','))
    router.push(`/customers?${params.toString()}`)
  }

  const handleBackgroundCheckChange = (backgroundCheckStatus: string[]) => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.status) params.set('status', filters.status.join(','))
    if (backgroundCheckStatus.length > 0)
      params.set('background_check_status', backgroundCheckStatus.join(','))
    router.push(`/customers?${params.toString()}`)
  }

  const handleClear = () => {
    router.push('/customers')
  }

  const hasActiveFilters =
    filters.search || (filters.status && filters.status.length > 0) ||
    (filters.background_check_status && filters.background_check_status.length > 0)

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium">Search</label>
          <Input
            placeholder="Search by name, email, phone..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Status</label>
          <Select
            value={filters.status?.join(',') || 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                handleStatusChange([])
              } else {
                handleStatusChange(value.split(','))
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="delinquent">Delinquent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Background Check</label>
          <Select
            value={filters.background_check_status?.join(',') || 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                handleBackgroundCheckChange([])
              } else {
                handleBackgroundCheckChange(value.split(','))
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="not_required">Not Required</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filters.status?.length || 0} status filter(s) active
            {filters.background_check_status?.length
              ? `, ${filters.background_check_status.length} background check filter(s)`
              : ''}
          </span>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
