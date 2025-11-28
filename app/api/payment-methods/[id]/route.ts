import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentMethodUpdateSchema } from '@/lib/validations/payment-method'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*, customers!inner(owner_id)')
      .eq('id', id)
      .eq('customers.owner_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ payment_method: data })
  } catch (error) {
    console.error('Error fetching payment method:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment method' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = paymentMethodUpdateSchema.parse(body)

    // Verify payment method ownership
    const { data: existingPaymentMethod } = await supabase
      .from('payment_methods')
      .select('*, customers!inner(owner_id)')
      .eq('id', id)
      .eq('customers.owner_id', user.id)
      .single()

    if (!existingPaymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    // If setting as default, unset other defaults for this customer
    if (validatedData.is_default === true) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('customer_id', existingPaymentMethod.customer_id)
        .eq('is_default', true)
        .neq('id', id)
    }

    const updateData: Record<string, unknown> = {}

    if (validatedData.customer_id !== undefined) {
      updateData.customer_id = validatedData.customer_id
    }
    if (validatedData.type !== undefined) {
      updateData.type = validatedData.type
    }
    if (validatedData.provider !== undefined) {
      updateData.provider = validatedData.provider
    }
    if (validatedData.provider_payment_method_id !== undefined) {
      updateData.provider_payment_method_id = validatedData.provider_payment_method_id
    }
    if (validatedData.last_four !== undefined) {
      updateData.last_four = validatedData.last_four
    }
    if (validatedData.expiry_month !== undefined) {
      updateData.expiry_month = validatedData.expiry_month
    }
    if (validatedData.expiry_year !== undefined) {
      updateData.expiry_year = validatedData.expiry_year
    }
    if (validatedData.is_default !== undefined) {
      updateData.is_default = validatedData.is_default
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ payment_method: data })
  } catch (error) {
    console.error('Error updating payment method:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify payment method ownership
    const { data: existingPaymentMethod } = await supabase
      .from('payment_methods')
      .select('*, customers!inner(owner_id)')
      .eq('id', id)
      .eq('customers.owner_id', user.id)
      .single()

    if (!existingPaymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    const { error } = await supabase.from('payment_methods').delete().eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    )
  }
}
