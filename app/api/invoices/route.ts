import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invoiceFormSchema } from '@/lib/validations/invoice'

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
    const status = searchParams.get('status')
    const customerId = searchParams.get('customer_id')
    const rentalId = searchParams.get('rental_id')
    const search = searchParams.get('search')
    const dueDateFrom = searchParams.get('due_date_from')
    const dueDateTo = searchParams.get('due_date_to')

    let query = supabase
      .from('invoices')
      .select('*, customers!inner(owner_id)')
      .eq('customers.owner_id', user.id)
      .order('due_date', { ascending: false })

    if (status) {
      query = query.in('status', status.split(','))
    }

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    if (rentalId) {
      query = query.eq('rental_id', rentalId)
    }

    if (dueDateFrom) {
      query = query.gte('due_date', dueDateFrom)
    }

    if (dueDateTo) {
      query = query.lte('due_date', dueDateTo)
    }

    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ invoices: data || [] })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
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
    const validatedData = invoiceFormSchema.parse(body)

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

    // Verify rental ownership if provided
    if (validatedData.rental_id) {
      const { data: rental } = await supabase
        .from('rentals')
        .select('id')
        .eq('id', validatedData.rental_id)
        .eq('owner_id', user.id)
        .single()

      if (!rental) {
        return NextResponse.json({ error: 'Rental not found' }, { status: 404 })
      }
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        customer_id: validatedData.customer_id,
        rental_id: validatedData.rental_id || null,
        invoice_number: validatedData.invoice_number,
        period_start: validatedData.period_start,
        period_end: validatedData.period_end,
        amount_due: validatedData.amount_due,
        amount_paid: 0,
        due_date: validatedData.due_date,
        payment_method_id: validatedData.payment_method_id || null,
        stripe_invoice_id: validatedData.stripe_invoice_id || null,
        status: validatedData.status,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ invoice: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
