import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { UnitForm } from '@/components/units/unit-form'
import { type UnitFormData } from '@/lib/validations/unit'
import { type Facility } from '@/types'

async function getFacility(id: string): Promise<Facility | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  return data as Facility | null
}

async function getAllFacilities(): Promise<Facility[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('facilities')
    .select('*')
    .eq('owner_id', user.id)
    .order('name', { ascending: true })

  return (data as Facility[]) || []
}

async function createUnit(data: UnitFormData) {
  'use server'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify facility ownership
  const { data: facility } = await supabase
    .from('facilities')
    .select('id')
    .eq('id', data.facility_id)
    .eq('owner_id', user.id)
    .single()

  if (!facility) {
    throw new Error('Facility not found')
  }

  // Type assertion needed because TypeScript can't infer the table type from Database
  const { error } = await (supabase.from('units') as any).insert({
    facility_id: data.facility_id,
    unit_number: data.unit_number,
    size: data.size,
    type: data.type,
    floor_level: data.floor_level,
    features: data.features,
    monthly_rate: data.monthly_rate,
    photos: data.photos,
    notes: data.notes,
    status: data.status,
  })

  if (error) {
    throw new Error(error.message)
  }

  // Update facility total_units count
  const { count } = await supabase
    .from('units')
    .select('*', { count: 'exact', head: true })
    .eq('facility_id', data.facility_id)

  await supabase
    .from('facilities')
    .update({ total_units: count || 0 })
    .eq('id', data.facility_id)

  // Revalidate the facility page to show the new unit
  revalidatePath(`/facilities/${data.facility_id}`)
  revalidatePath('/facilities')
}

export default async function NewUnitPage({
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

  const facility = await getFacility(id)
  const facilities = await getAllFacilities()

  if (!facility) {
    notFound()
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Unit</h1>
        <p className="text-muted-foreground">Add a new unit to {facility.name}</p>
      </div>

      <UnitForm facilities={facilities} onSubmit={createUnit} />
    </div>
  )
}
