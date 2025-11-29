'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UnitForm } from './unit-form'
import { type Unit, type Facility } from '@/types'
import { type UnitFormData } from '@/lib/validations/unit'

interface UnitEditFormProps {
  unit: Unit
  facilities: Facility[]
  unitId: string
  updateAction: (id: string, data: UnitFormData) => Promise<void>
}

export function UnitEditForm({ unit, facilities, unitId, updateAction }: UnitEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: UnitFormData) => {
    setError(null)
    try {
      await updateAction(unitId, data)
      startTransition(() => {
        router.push(`/facilities/${data.facility_id}`)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update unit')
      console.error('Error updating unit:', err)
    }
  }

  return (
    <>
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}
      <UnitForm unit={unit} facilities={facilities} onSubmit={handleSubmit} />
    </>
  )
}
