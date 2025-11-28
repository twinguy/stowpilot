'use client'

import { useRouter } from 'next/navigation'
import { FacilityForm } from './facility-form'
import { type FacilityFormData } from '@/types'

interface FacilityCreateFormProps {
  createAction: (data: FacilityFormData) => Promise<void>
}

export function FacilityCreateForm({ createAction }: FacilityCreateFormProps) {
  const router = useRouter()

  const handleSubmit = async (data: FacilityFormData) => {
    await createAction(data)
    router.push('/facilities')
  }

  return <FacilityForm onSubmit={handleSubmit} />
}
