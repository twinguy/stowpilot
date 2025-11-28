import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { CustomerForm } from '@/components/customers/customer-form'
import { type CustomerFormData } from '@/lib/validations/customer'

async function createCustomer(data: CustomerFormData) {
  'use server'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase.from('customers').insert({
    owner_id: user.id,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    emergency_contact: data.emergency_contact || null,
    identification: data.identification || null,
    credit_score: data.credit_score || null,
    background_check_status: data.background_check_status,
    notes: data.notes || null,
    status: data.status,
  })

  if (error) {
    throw new Error(error.message)
  }

  // Revalidate the customers page to show the new customer
  revalidatePath('/customers')
}

export default async function NewCustomerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Customer</h1>
        <p className="text-muted-foreground">Create a new customer profile</p>
      </div>

      <CustomerForm onSubmit={createCustomer} />
    </div>
  )
}
