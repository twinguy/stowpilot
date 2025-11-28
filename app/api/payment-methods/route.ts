import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentMethodFormSchema } from '@/lib/validations/payment-method'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customer_id')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    let query = supabase
      .from('payment_methods')
      .select('*, customers!inner(owner_id)')
      .eq('customers.owner_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    if (status) {
      query = query.in('status', status.split(','))
    }

    if (type) {
      query = query.in('type', type.split(','))
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ payment_methods: data || [] })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = paymentMethodFormSchema.parse(body)

    // Verify customer ownership
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('id', validatedData.customer_id)
      .eq('owner_id', user.id)
      .single()

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // If this is set as default, unset other defaults for this customer
    if (validatedData.is_default) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('customer_id', validatedData.customer_id)
        .eq('is_default', true)
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        customer_id: validatedData.customer_id,
        type: validatedData.type,
        provider: validatedData.provider,
        provider_payment_method_id: validatedData.provider_payment_method_id || null,
        last_four: validatedData.last_four || null,
        expiry_month: validatedData.expiry_month || null,
        expiry_year: validatedData.expiry_year || null,
        is_default: validatedData.is_default,
        status: validatedData.status,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ payment_method: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment method:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    )
  }
}
