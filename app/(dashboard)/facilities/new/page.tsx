import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { FacilityCreateForm } from '@/components/facilities/facility-create-form'
import { type FacilityFormData } from '@/lib/validations/facility'

async function createFacility(data: FacilityFormData) {
  'use server'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase.from('facilities').insert({
    owner_id: user.id,
    name: data.name,
    address: data.address,
    amenities: data.amenities,
    contact_info: data.contact_info,
    operating_hours: data.operating_hours,
    photos: data.photos,
    notes: data.notes,
    status: data.status,
    total_units: 0,
  })

  if (error) {
    throw new Error(error.message)
  }

  // Revalidate the facilities page to show the new facility
  revalidatePath('/facilities')
}

export default async function NewFacilityPage() {
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
        <h1 className="text-3xl font-bold">Add New Facility</h1>
        <p className="text-muted-foreground">Create a new storage facility</p>
      </div>

      <FacilityCreateForm createAction={createFacility} />
    </div>
  )
}
