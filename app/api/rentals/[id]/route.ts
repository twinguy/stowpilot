import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rentalFormSchema } from '@/lib/validations/rental'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('rentals')
      .select('*, customers(*), units(*, facilities(*))')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Rental not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ rental: data })
  } catch (error) {
    console.error('Error fetching rental:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rental' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify rental ownership
    const { data: existingRental } = await supabase
      .from('rentals')
      .select('id, unit_id, status')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    if (!existingRental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = rentalFormSchema.partial().parse(body)

    // Update rental
    const { data: rental, error } = await supabase
      .from('rentals')
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

    // Update unit status based on rental status
    if (validatedData.status) {
      let unitStatus = 'available'
      if (validatedData.status === 'active') {
        unitStatus = 'occupied'
      } else if (validatedData.status === 'terminated' || validatedData.status === 'expired') {
        unitStatus = 'available'
      }

      await supabase
        .from('units')
        .update({ status: unitStatus })
        .eq('id', existingRental.unit_id)
    }

    return NextResponse.json({ rental })
  } catch (error) {
    console.error('Error updating rental:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to update rental' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify rental ownership and get unit_id
    const { data: rental } = await supabase
      .from('rentals')
      .select('id, unit_id')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 })
    }

    // Delete rental
    const { error } = await supabase.from('rentals').delete().eq('id', id)

    if (error) {
      throw error
    }

    // Update unit status back to available
    await supabase
      .from('units')
      .update({ status: 'available' })
      .eq('id', rental.unit_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rental:', error)
    return NextResponse.json(
      { error: 'Failed to delete rental' },
      { status: 500 }
    )
  }
}
