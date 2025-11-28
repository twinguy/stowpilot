import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { UnitEditForm } from '@/components/units/unit-edit-form'
import { type UnitFormData } from '@/lib/validations/unit'
import { type Unit, type Facility } from '@/types'

async function getUnit(id: string): Promise<Unit | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('units')
    .select('*, facilities!inner(owner_id)')
    .eq('id', id)
    .eq('facilities.owner_id', user.id)
    .single()

  return data as Unit | null
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

async function updateUnit(id: string, data: UnitFormData) {
  'use server'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify unit ownership through facility
  const { data: unit } = await supabase
    .from('units')
    .select('facility_id, facilities!inner(owner_id)')
    .eq('id', id)
    .single()

  if (!unit) {
    throw new Error('Unit not found')
  }

  const { error } = await supabase
    .from('units')
    .update({
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
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // Revalidate the facility and units pages
  revalidatePath(`/facilities/${data.facility_id}`)
  revalidatePath('/facilities')
  revalidatePath('/units')
}

export default async function EditUnitPage({
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

  const unit = await getUnit(id)
  const facilities = await getAllFacilities()

  if (!unit) {
    notFound()
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Unit</h1>
        <p className="text-muted-foreground">Update unit information</p>
      </div>

      <UnitEditForm unit={unit} facilities={facilities} unitId={id} updateAction={updateUnit} />
    </div>
  )
}
