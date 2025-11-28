import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FacilityEditForm } from '@/components/facilities/facility-edit-form'
import { updateFacilityAction } from '../actions'
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



export default async function EditFacilityPage({
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

  if (!facility) {
    notFound()
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Facility</h1>
        <p className="text-muted-foreground">Update facility information</p>
      </div>

      <FacilityEditForm 
        facility={facility} 
        facilityId={id}
        updateAction={updateFacilityAction}
      />
    </div>
  )
}
