'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RentalWizard } from './rental-wizard'
import { type RentalFormData } from '@/lib/validations/rental'
import { type Customer, type Unit } from '@/types'

interface RentalEditFormProps {
  rentalId: string
  customers: Customer[]
  units: Unit[]
  defaultValues: RentalFormData
  updateAction: (id: string, data: RentalFormData) => Promise<void>
}

export function RentalEditForm({
  rentalId,
  customers,
  units,
  defaultValues,
  updateAction,
}: RentalEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: RentalFormData) => {
    setError(null)
    try {
      await updateAction(rentalId, data)
      startTransition(() => {
        router.push('/rentals')
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rental')
    }
  }

  return (
    <>
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}
      <RentalWizard
        customers={customers}
        units={units}
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        isEditMode={true}
      />
    </>
  )
}
