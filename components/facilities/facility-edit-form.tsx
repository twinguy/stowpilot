'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FacilityForm } from './facility-form'
import { type Facility } from '@/types'
import { type FacilityFormData } from '@/lib/validations/facility'

interface FacilityEditFormProps {
  facility: Facility
  facilityId: string
  updateAction: (id: string, data: FacilityFormData) => Promise<void>
}

export function FacilityEditForm({ facility, facilityId, updateAction }: FacilityEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: FacilityFormData) => {
    console.log('🟢 FacilityEditForm handleSubmit called', { facilityId, data, updateAction: typeof updateAction })
    setError(null)
    try {
      console.log('🟢 Calling updateAction...')
      await updateAction(facilityId, data)
      console.log('🟢 updateAction completed, navigating...')
      startTransition(() => {
        router.push('/facilities')
      })
    } catch (err) {
      console.error('🔴 Error in FacilityEditForm handleSubmit:', err)
      setError(err instanceof Error ? err.message : 'Failed to update facility')
    }
  }

  return (
    <>
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}
      <FacilityForm facility={facility} onSubmit={handleSubmit} />
    </>
  )
}
