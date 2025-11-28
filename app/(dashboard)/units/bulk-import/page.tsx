import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BulkImportWizard } from '@/components/units/bulk-import-wizard'
import { bulkUnitImportSchema, type BulkUnitImportData } from '@/lib/validations/unit'
import { type Facility } from '@/types'
import { Button } from '@/components/ui/button'

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

async function bulkImportUnits(data: BulkUnitImportData) {
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

  const unitsToInsert = data.units.map((unit) => ({
    ...unit,
    facility_id: data.facility_id,
    size: unit.size,
    features: unit.features || [],
    photos: unit.photos || [],
  }))

  const { error } = await supabase.from('units').insert(unitsToInsert)

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
}

export default async function BulkImportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const facilities = await getAllFacilities()

  if (facilities.length === 0) {
    return (
      <div className="container mx-auto space-y-6 py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">No Facilities Found</h1>
          <p className="text-muted-foreground mb-4">
            You need to create a facility before importing units.
          </p>
          <Button asChild>
            <Link href="/facilities/new">Create Facility</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Import Units</h1>
        <p className="text-muted-foreground">Import multiple units from a CSV file</p>
      </div>

      <BulkImportWizard facilities={facilities} onSubmit={bulkImportUnits} />
    </div>
  )
}
