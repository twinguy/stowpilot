import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentFormSchema } from '@/lib/validations/payment'

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
    const invoiceId = searchParams.get('invoice_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const search = searchParams.get('search')

    let query = supabase
      .from('payments')
      .select('*, customers!inner(owner_id)')
      .eq('customers.owner_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.in('status', status.split(','))
    }

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    if (invoiceId) {
      query = query.eq('invoice_id', invoiceId)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    if (search) {
      query = query.or(`transaction_id.ilike.%${search}%,notes.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ payments: data || [] })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
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
    const validatedData = paymentFormSchema.parse(body)

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

    // Verify invoice ownership
    // Type assertion needed because TypeScript can't infer the table type from Database
    const { data: invoiceData } = await (supabase.from('invoices') as any)
      .select('*, customers!inner(owner_id)')
      .eq('id', validatedData.invoice_id)
      .eq('customers.owner_id', user.id)
      .single()

    if (!invoiceData) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const invoice = invoiceData as {
      amount_paid: number
      amount_due: number
      status: string
      paid_at: string | null
    }

    // Type assertion needed because TypeScript can't infer the table type from Database
    const { data: payment, error: paymentError } = await (supabase.from('payments') as any).insert({
      invoice_id: validatedData.invoice_id,
      customer_id: validatedData.customer_id,
      amount: validatedData.amount,
      payment_method_id: validatedData.payment_method_id || null,
      transaction_id: validatedData.transaction_id || null,
      notes: validatedData.notes || null,
        status: validatedData.status,
        processed_at: validatedData.status === 'completed' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (paymentError) {
      throw paymentError
    }

    // Update invoice amount_paid if payment is completed
    if (validatedData.status === 'completed') {
      const newAmountPaid = (invoice.amount_paid || 0) + validatedData.amount
      const invoiceStatus = newAmountPaid >= invoice.amount_due ? 'paid' : invoice.status

      // Type assertion needed because TypeScript can't infer the table type from Database
      await (supabase.from('invoices') as any)
        .update({
          amount_paid: newAmountPaid,
          status: invoiceStatus,
          paid_at: invoiceStatus === 'paid' ? new Date().toISOString() : invoice.paid_at,
        })
        .eq('id', validatedData.invoice_id)
    }

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
