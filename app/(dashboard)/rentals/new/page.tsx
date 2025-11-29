import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { RentalWizard } from '@/components/rentals/rental-wizard'
import { type RentalFormData } from '@/lib/validations/rental'
import { type Customer, type Unit } from '@/types'

async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'active')
    .order('last_name', { ascending: true })

  return (data as Customer[]) || []
}

async function getUnits(): Promise<Unit[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('units')
    .select('*, facilities!inner(owner_id)')
    .eq('facilities.owner_id', user.id)
    .in('status', ['available', 'reserved'])
    .order('unit_number', { ascending: true })

  return (data as Unit[]) || []
}

async function createRental(data: RentalFormData) {
  'use server'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify customer and unit ownership
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('id', data.customer_id)
    .eq('owner_id', user.id)
    .single()

  if (!customer) {
    throw new Error('Customer not found')
  }

  const { data: unit } = await supabase
    .from('units')
    .select('id, facility_id, facilities!inner(owner_id)')
    .eq('id', data.unit_id)
    .eq('facilities.owner_id', user.id)
    .single()

  if (!unit) {
    throw new Error('Unit not found')
  }

  // Create rental
  // Type assertion needed because TypeScript can't infer the table type from Database
  const { error } = await (supabase.from('rentals') as any).insert({
    owner_id: user.id,
    customer_id: data.customer_id,
    unit_id: data.unit_id,
    start_date: data.start_date,
    end_date: data.end_date,
    monthly_rate: data.monthly_rate,
    security_deposit: data.security_deposit,
    late_fee_rate: data.late_fee_rate,
    auto_renew: data.auto_renew,
    insurance_required: data.insurance_required,
    insurance_provider: data.insurance_provider,
    insurance_policy_number: data.insurance_policy_number,
    special_terms: data.special_terms,
    status: data.status,
  })

  if (error) {
    throw new Error(error.message)
  }

  // Update unit status to occupied if rental is active
  if (data.status === 'active') {
    await (supabase.from('units') as any).update({ status: 'occupied' }).eq('id', data.unit_id)
  }

  // Revalidate pages
  revalidatePath('/rentals')
  revalidatePath(`/customers/${data.customer_id}`)
  revalidatePath(`/units/${data.unit_id}`)
}

export default async function NewRentalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const customers = await getCustomers()
  const units = await getUnits()

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Create Rental Agreement</h1>
        <p className="text-muted-foreground">Create a new rental agreement for a customer</p>
      </div>

      <RentalWizard customers={customers} units={units} onSubmit={createRental} />
    </div>
  )
}
