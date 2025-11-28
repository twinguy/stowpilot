import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CustomerTable } from '@/components/customers/customer-table'
import { CustomersFiltersClient } from '@/components/customers/customers-filters-client'
import { Button } from '@/components/ui/button'
import { type Customer, type CustomerFilters } from '@/types'

async function getCustomers(filters: CustomerFilters = {}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  let query = supabase
    .from('customers')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters.background_check_status && filters.background_check_status.length > 0) {
    query = query.in('background_check_status', filters.background_check_status)
  }

  if (filters.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
    )
  }

  const { data } = await query
  return (data as Customer[]) || []
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const filters: CustomerFilters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    status:
      typeof params.status === 'string'
        ? (params.status.split(',') as CustomerFilters['status'])
        : undefined,
    background_check_status:
      typeof params.background_check_status === 'string'
        ? (params.background_check_status.split(',') as CustomerFilters['background_check_status'])
        : undefined,
  }

  const customers = await getCustomers(filters)

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Link>
        </Button>
      </div>

      <CustomersFiltersClient filters={filters} />

      <CustomerTable customers={customers} />
    </div>
  )
}
