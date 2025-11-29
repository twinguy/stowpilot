import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { facilityFormSchema } from '@/lib/validations/facility'

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
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const search = searchParams.get('search')

    let query = supabase
      .from('facilities')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.in('status', status.split(','))
    }

    if (city) {
      query = query.contains('address', { city })
    }

    if (state) {
      query = query.contains('address', { state })
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,notes.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ facilities: data || [] })
  } catch (error) {
    console.error('Error fetching facilities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch facilities' },
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
    const validatedData = facilityFormSchema.parse(body)

    // Type assertion needed because TypeScript can't infer the table type from Database
    const { data, error } = await (supabase.from('facilities') as any).insert({
      owner_id: user.id,
      name: validatedData.name,
      address: validatedData.address,
      amenities: validatedData.amenities,
      contact_info: validatedData.contact_info,
      operating_hours: validatedData.operating_hours,
        photos: validatedData.photos,
        notes: validatedData.notes,
        status: validatedData.status,
        total_units: 0,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ facility: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating facility:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to create facility' },
      { status: 500 }
    )
  }
}
