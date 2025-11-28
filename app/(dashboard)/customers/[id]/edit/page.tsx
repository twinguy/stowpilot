import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CustomerEditForm } from '@/components/customers/customer-edit-form'
import { updateCustomerAction } from '../actions'
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

export default async function EditCustomerPage({
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
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Customer</h1>
        <p className="text-muted-foreground">Update customer information</p>
      </div>

      <CustomerEditForm
        customer={customer}
        customerId={id}
        updateAction={updateCustomerAction}
      />
    </div>
  )
}
