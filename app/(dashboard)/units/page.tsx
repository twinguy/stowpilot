import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UnitLayout } from '@/components/units/unit-layout'
import { Button } from '@/components/ui/button'
import { type Unit } from '@/types'

async function getAllUnits() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('units')
    .select('*, facilities!inner(owner_id, name)')
    .eq('facilities.owner_id', user.id)
    .order('unit_number', { ascending: true })

  return (data as Unit[]) || []
}

export default async function UnitsPage() {
  const units = await getAllUnits()

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Units</h1>
          <p className="text-muted-foreground">View and manage all units across facilities</p>
        </div>
      </div>

      <Suspense fallback={<div>Loading units...</div>}>
        <UnitLayout units={units} />
      </Suspense>
    </div>
  )
}
