import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { customerFormSchema } from '@/lib/validations/customer'

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
    const background_check_status = searchParams.get('background_check_status')
    const search = searchParams.get('search')

    let query = supabase
      .from('customers')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.in('status', status.split(','))
    }

    if (background_check_status) {
      query = query.in('background_check_status', background_check_status.split(','))
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,notes.ilike.%${search}%`
      )
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ customers: data || [] })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
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
    const validatedData = customerFormSchema.parse(body)

    // Type assertion needed because TypeScript can't infer the table type from Database
    const { data, error } = await (supabase.from('customers') as any).insert({
      owner_id: user.id,
      first_name: validatedData.first_name,
      last_name: validatedData.last_name,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      address: validatedData.address || null,
        emergency_contact: validatedData.emergency_contact || null,
        identification: validatedData.identification || null,
        credit_score: validatedData.credit_score || null,
        background_check_status: validatedData.background_check_status,
        notes: validatedData.notes || null,
        status: validatedData.status,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ customer: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
