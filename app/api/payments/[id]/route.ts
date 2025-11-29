import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentUpdateSchema } from '@/lib/validations/payment'

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
      .from('payments')
      .select('*, customers!inner(owner_id)')
      .eq('id', id)
      .eq('customers.owner_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ payment: data })
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
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
    const validatedData = paymentUpdateSchema.parse(body)

    // Verify payment ownership
    // Type assertion needed because TypeScript can't infer the table type from Database
    const { data: existingPaymentData } = await (supabase.from('payments') as any)
      .select('*, customers!inner(owner_id), invoices!inner(id, amount_due, amount_paid, status, paid_at)')
      .eq('id', id)
      .eq('customers.owner_id', user.id)
      .single()

    if (!existingPaymentData) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const existingPayment = existingPaymentData as {
      processed_at: string | null
      invoice_id: string
      invoices: { id: string; amount_due: number; status: string; paid_at: string | null }
      amount: number
    }

    const updateData: Record<string, unknown> = {}

    if (validatedData.invoice_id !== undefined) {
      updateData.invoice_id = validatedData.invoice_id
    }
    if (validatedData.customer_id !== undefined) {
      updateData.customer_id = validatedData.customer_id
    }
    if (validatedData.amount !== undefined) {
      updateData.amount = validatedData.amount
    }
    if (validatedData.payment_method_id !== undefined) {
      updateData.payment_method_id = validatedData.payment_method_id
    }
    if (validatedData.transaction_id !== undefined) {
      updateData.transaction_id = validatedData.transaction_id
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      if (validatedData.status === 'completed' && !existingPayment.processed_at) {
        updateData.processed_at = new Date().toISOString()
      }
    }
    if (validatedData.processed_at !== undefined) {
      updateData.processed_at = validatedData.processed_at
    }

    // Type assertion needed because TypeScript can't infer the table type from Database
    const { data, error } = await (supabase.from('payments') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update invoice if payment status changed
    if (validatedData.status !== undefined && existingPayment.invoice_id) {
      const invoice = existingPayment.invoices as { id: string; amount_due: number; status: string; paid_at: string | null }
      // Type assertion needed because TypeScript can't infer the table type from Database
      const { data: invoicePayments } = await (supabase.from('payments') as any)
        .select('amount')
        .eq('invoice_id', invoice.id)
        .eq('status', 'completed')

      const totalPaid = (invoicePayments as Array<{ amount: number }> | null)?.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) || 0
      const invoiceStatus = totalPaid >= invoice.amount_due ? 'paid' : invoice.status

      // Type assertion needed because TypeScript can't infer the table type from Database
      await (supabase.from('invoices') as any)
        .update({
          amount_paid: totalPaid,
          status: invoiceStatus,
          paid_at: invoiceStatus === 'paid' ? new Date().toISOString() : invoice.paid_at,
        })
        .eq('id', invoice.id)
    }

    return NextResponse.json({ payment: data })
  } catch (error) {
    console.error('Error updating payment:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}
