import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ledgerEntryFormSchema } from '@/lib/validations/ledger'

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
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const facilityId = searchParams.get('facility_id')
    const customerId = searchParams.get('customer_id')
    const rentalId = searchParams.get('rental_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    let query = supabase
      .from('ledger_entries')
      .select('*')
      .eq('owner_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (type) {
      query = query.in('type', type.split(','))
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (facilityId) {
      query = query.eq('facility_id', facilityId)
    }

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    if (rentalId) {
      query = query.eq('rental_id', rentalId)
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('date', dateTo)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ ledger_entries: data || [] })
  } catch (error) {
    console.error('Error fetching ledger entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ledger entries' },
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
    const validatedData = ledgerEntryFormSchema.parse(body)

    // Verify facility ownership if provided
    if (validatedData.facility_id) {
      const { data: facility } = await supabase
        .from('facilities')
        .select('id')
        .eq('id', validatedData.facility_id)
        .eq('owner_id', user.id)
        .single()

      if (!facility) {
        return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
      }
    }

    // Verify customer ownership if provided
    if (validatedData.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('id', validatedData.customer_id)
        .eq('owner_id', user.id)
        .single()

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }
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

    // Verify payment ownership if provided
    if (validatedData.payment_id) {
      const { data: payment } = await supabase
        .from('payments')
        .select('*, customers!inner(owner_id)')
        .eq('id', validatedData.payment_id)
        .eq('customers.owner_id', user.id)
        .single()

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }
    }

    const { data, error } = await supabase
      .from('ledger_entries')
      .insert({
        owner_id: user.id,
        facility_id: validatedData.facility_id || null,
        customer_id: validatedData.customer_id || null,
        rental_id: validatedData.rental_id || null,
        type: validatedData.type,
        category: validatedData.category,
        description: validatedData.description,
        amount: validatedData.amount,
        date: validatedData.date,
        payment_id: validatedData.payment_id || null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ ledger_entry: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating ledger entry:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to create ledger entry' },
      { status: 500 }
    )
  }
}
