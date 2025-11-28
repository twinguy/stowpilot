import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unitFormSchema, bulkUnitImportSchema } from '@/lib/validations/unit'

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
    const facilityId = searchParams.get('facility_id')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    let query = supabase
      .from('units')
      .select('*, facilities!inner(owner_id)')
      .eq('facilities.owner_id', user.id)
      .order('unit_number', { ascending: true })

    if (facilityId) {
      query = query.eq('facility_id', facilityId)
    }

    if (status) {
      query = query.in('status', status.split(','))
    }

    if (type) {
      query = query.in('type', type.split(','))
    }

    if (search) {
      query = query.or(`unit_number.ilike.%${search}%,notes.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ units: data || [] })
  } catch (error) {
    console.error('Error fetching units:', error)
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 })
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

    // Check if this is a bulk import
    if (body.units && Array.isArray(body.units)) {
      const validatedData = bulkUnitImportSchema.parse(body)

      // Verify facility ownership
      const { data: facility } = await supabase
        .from('facilities')
        .select('id')
        .eq('id', validatedData.facility_id)
        .eq('owner_id', user.id)
        .single()

      if (!facility) {
        return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
      }

      const unitsToInsert = validatedData.units.map((unit) => ({
        ...unit,
        facility_id: validatedData.facility_id,
        size: unit.size,
        features: unit.features || [],
        photos: unit.photos || [],
      }))

      const { data, error } = await supabase
        .from('units')
        .insert(unitsToInsert)
        .select()

      if (error) {
        throw error
      }

      // Update facility total_units count
      await supabase
        .from('facilities')
        .update({ total_units: data.length })
        .eq('id', validatedData.facility_id)

      return NextResponse.json({ units: data }, { status: 201 })
    } else {
      // Single unit creation
      const validatedData = unitFormSchema.parse(body)

      // Verify facility ownership
      const { data: facility } = await supabase
        .from('facilities')
        .select('id')
        .eq('id', validatedData.facility_id)
        .eq('owner_id', user.id)
        .single()

      if (!facility) {
        return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
      }

      const { data, error } = await supabase
        .from('units')
        .insert({
          facility_id: validatedData.facility_id,
          unit_number: validatedData.unit_number,
          size: validatedData.size,
          type: validatedData.type,
          floor_level: validatedData.floor_level,
          features: validatedData.features,
          monthly_rate: validatedData.monthly_rate,
          photos: validatedData.photos,
          notes: validatedData.notes,
          status: validatedData.status,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Update facility total_units count
      const { count } = await supabase
        .from('units')
        .select('*', { count: 'exact', head: true })
        .eq('facility_id', validatedData.facility_id)

      await supabase
        .from('facilities')
        .update({ total_units: count || 0 })
        .eq('id', validatedData.facility_id)

      return NextResponse.json({ unit: data }, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating unit(s):', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create unit(s)' }, { status: 500 })
  }
}
