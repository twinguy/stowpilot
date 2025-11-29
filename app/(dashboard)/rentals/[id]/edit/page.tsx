import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { RentalEditForm } from '@/components/rentals/rental-edit-form'
import { type RentalFormData } from '@/lib/validations/rental'
import { type Customer, type Unit, type Rental } from '@/types'

async function getRental(id: string): Promise<Rental | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('rentals')
    .select('*, customers(*), units(*, facilities(*))')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  return data as Rental | null
}

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
    .order('unit_number', { ascending: true })

  return (data as Unit[]) || []
}

async function updateRental(id: string, data: RentalFormData) {
  'use server'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify rental ownership
  const { data: existingRental } = await supabase
    .from('rentals')
    .select('id, unit_id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!existingRental) {
    throw new Error('Rental not found')
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

  // Update rental
  // Type assertion needed because TypeScript can't infer the table type from Database
  const { error } = await (supabase.from('rentals') as any)
    .update({
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
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // Update unit status based on rental status
  if (data.status === 'active') {
    await (supabase.from('units') as any).update({ status: 'occupied' }).eq('id', data.unit_id)
    // If unit changed, free up the old unit
    if (existingRental.unit_id !== data.unit_id) {
      await (supabase.from('units') as any).update({ status: 'available' }).eq('id', existingRental.unit_id)
    }
  } else if (data.status === 'terminated' || data.status === 'expired') {
    await (supabase.from('units') as any).update({ status: 'available' }).eq('id', data.unit_id)
  }

  // Revalidate pages
  revalidatePath('/rentals')
  revalidatePath(`/rentals/${id}`)
  revalidatePath(`/customers/${data.customer_id}`)
  revalidatePath(`/units/${data.unit_id}`)
}

export default async function EditRentalPage({
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

  const rental = await getRental(id)

  if (!rental) {
    notFound()
  }

  const customers = await getCustomers()
  const units = await getUnits()

  // Convert rental to form data format
  // Format dates for input fields (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null): string | null => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  const rentalFormData: RentalFormData = {
    customer_id: rental.customer_id,
    unit_id: rental.unit_id,
    start_date: formatDateForInput(rental.start_date) || '',
    end_date: formatDateForInput(rental.end_date),
    monthly_rate: rental.monthly_rate,
    security_deposit: rental.security_deposit,
    late_fee_rate: rental.late_fee_rate,
    auto_renew: rental.auto_renew,
    insurance_required: rental.insurance_required,
    insurance_provider: rental.insurance_provider || null,
    insurance_policy_number: rental.insurance_policy_number || null,
    special_terms: rental.special_terms || null,
    status: rental.status,
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Rental Agreement</h1>
        <p className="text-muted-foreground">Update rental agreement details</p>
      </div>

      <RentalEditForm
        rentalId={id}
        customers={customers}
        units={units}
        defaultValues={rentalFormData}
        updateAction={updateRental}
      />
    </div>
  )
}
