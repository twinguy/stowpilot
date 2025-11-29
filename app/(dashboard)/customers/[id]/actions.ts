'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { type CustomerFormData } from '@/lib/validations/customer'

export async function updateCustomerAction(id: string, data: CustomerFormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Type assertion needed because TypeScript can't infer the table type from Database
  const { error } = await (supabase.from('customers') as any)
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      emergency_contact: data.emergency_contact || null,
      identification: data.identification || null,
      credit_score: data.credit_score || null,
      background_check_status: data.background_check_status,
      notes: data.notes || null,
      status: data.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  // Revalidate the customer pages to show updated data
  revalidatePath('/customers')
  revalidatePath(`/customers/${id}`)
}
