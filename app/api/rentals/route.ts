import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rentalFormSchema } from '@/lib/validations/rental'

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
    const unitId = searchParams.get('unit_id')
    const facilityId = searchParams.get('facility_id')
    const search = searchParams.get('search')

    let query = supabase
      .from('rentals')
      .select('*, customers(*), units(*, facilities(*))')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.in('status', status.split(','))
    }

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    if (unitId) {
      query = query.eq('unit_id', unitId)
    }

    if (facilityId) {
      query = query.eq('units.facility_id', facilityId)
    }

    if (search) {
      query = query.or(
        `customers.first_name.ilike.%${search}%,customers.last_name.ilike.%${search}%,units.unit_number.ilike.%${search}%,special_terms.ilike.%${search}%`
      )
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ rentals: data || [] })
  } catch (error) {
    console.error('Error fetching rentals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rentals' },
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
    const validatedData = rentalFormSchema.parse(body)

    // Verify customer and unit ownership
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('id', validatedData.customer_id)
      .eq('owner_id', user.id)
      .single()

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const { data: unit } = await supabase
      .from('units')
      .select('id, facility_id, facilities!inner(owner_id)')
      .eq('id', validatedData.unit_id)
      .eq('facilities.owner_id', user.id)
      .single()

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    // Create rental
    // Type assertion needed because TypeScript can't infer the table type from Database
    const { data: rental, error } = await (supabase.from('rentals') as any).insert({
      owner_id: user.id,
      customer_id: validatedData.customer_id,
      unit_id: validatedData.unit_id,
      start_date: validatedData.start_date,
      end_date: validatedData.end_date,
      monthly_rate: validatedData.monthly_rate,
        security_deposit: validatedData.security_deposit,
        late_fee_rate: validatedData.late_fee_rate,
        auto_renew: validatedData.auto_renew,
        insurance_required: validatedData.insurance_required,
        insurance_provider: validatedData.insurance_provider,
        insurance_policy_number: validatedData.insurance_policy_number,
        special_terms: validatedData.special_terms,
        status: validatedData.status,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update unit status to occupied if rental is active
    if (validatedData.status === 'active') {
      // Type assertion needed because TypeScript can't infer the table type from Database
      await (supabase.from('units') as any)
        .update({ status: 'occupied' })
        .eq('id', validatedData.unit_id)
    }

    return NextResponse.json({ rental }, { status: 201 })
  } catch (error) {
    console.error('Error creating rental:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to create rental' },
      { status: 500 }
    )
  }
}
