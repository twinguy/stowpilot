import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CustomerProfile } from '@/components/customers/customer-profile'
import { type Customer } from '@/types'

async function getCustomer(id: string): Promise<Customer | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  return data as Customer | null
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      <CustomerProfile customer={customer} />
    </div>
  )
}
