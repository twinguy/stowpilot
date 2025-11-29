import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unitFormSchema } from '@/lib/validations/unit'

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
      .from('units')
      .select('*, facilities!inner(owner_id)')
      .eq('id', id)
      .eq('facilities.owner_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ unit: data })
  } catch (error) {
    console.error('Error fetching unit:', error)
    return NextResponse.json({ error: 'Failed to fetch unit' }, { status: 500 })
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
    const validatedData = unitFormSchema.partial().parse(body)

    // Verify unit ownership through facility
    const { data: unit } = await supabase
      .from('units')
      .select('facility_id, facilities!inner(owner_id)')
      .eq('id', id)
      .single()

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    // Type assertion needed because TypeScript can't infer the table type from Database
    const { data, error } = await (supabase.from('units') as any)
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ unit: data })
  } catch (error) {
    console.error('Error updating unit:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update unit' }, { status: 500 })
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

    // Get facility_id before deletion
    const { data: unit } = await supabase
      .from('units')
      .select('facility_id, facilities!inner(owner_id)')
      .eq('id', id)
      .single()

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    // Type assertion needed because TypeScript can't infer the table type from Database
    const { error } = await (supabase.from('units') as any).delete().eq('id', id)

    if (error) {
      throw error
    }

    // Update facility total_units count
    const { count } = await supabase
      .from('units')
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', unit.facility_id)

    // Type assertion needed because TypeScript can't infer the table type from Database
    await (supabase.from('facilities') as any)
      .update({ total_units: count || 0 })
      .eq('id', unit.facility_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting unit:', error)
    return NextResponse.json({ error: 'Failed to delete unit' }, { status: 500 })
  }
}
