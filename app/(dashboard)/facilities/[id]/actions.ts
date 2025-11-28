'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { type FacilityFormData } from '@/lib/validations/facility'

export async function updateFacilityAction(id: string, data: FacilityFormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('facilities')
    .update({
      name: data.name,
      address: data.address,
      amenities: data.amenities,
      contact_info: data.contact_info,
      operating_hours: data.operating_hours,
      photos: data.photos,
      notes: data.notes,
      status: data.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  // Revalidate the facilities pages to show updated data
  revalidatePath('/facilities')
  revalidatePath(`/facilities/${id}`)
}
