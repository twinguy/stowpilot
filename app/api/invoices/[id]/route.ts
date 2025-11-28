import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invoiceUpdateSchema } from '@/lib/validations/invoice'

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
      .from('invoices')
      .select('*, customers!inner(owner_id)')
      .eq('id', id)
      .eq('customers.owner_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ invoice: data })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
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
    const validatedData = invoiceUpdateSchema.parse(body)

    // Verify invoice ownership
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('*, customers!inner(owner_id)')
      .eq('id', id)
      .eq('customers.owner_id', user.id)
      .single()

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (validatedData.customer_id !== undefined) {
      updateData.customer_id = validatedData.customer_id
    }
    if (validatedData.rental_id !== undefined) {
      updateData.rental_id = validatedData.rental_id
    }
    if (validatedData.invoice_number !== undefined) {
      updateData.invoice_number = validatedData.invoice_number
    }
    if (validatedData.period_start !== undefined) {
      updateData.period_start = validatedData.period_start
    }
    if (validatedData.period_end !== undefined) {
      updateData.period_end = validatedData.period_end
    }
    if (validatedData.amount_due !== undefined) {
      updateData.amount_due = validatedData.amount_due
    }
    if (validatedData.amount_paid !== undefined) {
      updateData.amount_paid = validatedData.amount_paid
    }
    if (validatedData.due_date !== undefined) {
      updateData.due_date = validatedData.due_date
    }
    if (validatedData.payment_method_id !== undefined) {
      updateData.payment_method_id = validatedData.payment_method_id
    }
    if (validatedData.stripe_invoice_id !== undefined) {
      updateData.stripe_invoice_id = validatedData.stripe_invoice_id
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
    }
    if (validatedData.paid_at !== undefined) {
      updateData.paid_at = validatedData.paid_at
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ invoice: data })
  } catch (error) {
    console.error('Error updating invoice:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to update invoice' },
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

    // Verify invoice ownership
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('*, customers!inner(owner_id)')
      .eq('id', id)
      .eq('customers.owner_id', user.id)
      .single()

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const { error } = await supabase.from('invoices').delete().eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
