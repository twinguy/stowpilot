'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerForm } from './customer-form'
import { type Customer } from '@/types'
import { type CustomerFormData } from '@/lib/validations/customer'

interface CustomerEditFormProps {
  customer: Customer
  customerId: string
  updateAction: (id: string, data: CustomerFormData) => Promise<void>
}

export function CustomerEditForm({
  customer,
  customerId,
  updateAction,
}: CustomerEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: CustomerFormData) => {
    setError(null)
    try {
      await updateAction(customerId, data)
      startTransition(() => {
        router.push('/customers')
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer')
    }
  }

  return (
    <>
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}
      <CustomerForm customer={customer} onSubmit={handleSubmit} />
    </>
  )
}
