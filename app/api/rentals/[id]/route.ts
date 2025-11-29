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
    // Type assertion needed because TypeScript can't infer the table type from Database
    const { data: existingRentalData } = await (supabase.from('rentals') as any)
      .select('id, unit_id, status')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    if (!existingRentalData) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 })
    }

    const existingRental = existingRentalData as { id: string; unit_id: string; status: string }

    const body = await request.json()
    const validatedData = rentalFormSchema.partial().parse(body)

    // Update rental
    // Type assertion needed because TypeScript can't infer the table type from Database
    const { data: rental, error } = await (supabase.from('rentals') as any)
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

      // Type assertion needed because TypeScript can't infer the table type from Database
      await (supabase.from('units') as any)
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
    // Type assertion needed because TypeScript can't infer the table type from Database
    const { data: rentalData } = await (supabase.from('rentals') as any)
      .select('id, unit_id')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    if (!rentalData) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 })
    }

    const rental = rentalData as { id: string; unit_id: string }

    // Delete rental
    // Type assertion needed because TypeScript can't infer the table type from Database
    const { error } = await (supabase.from('rentals') as any).delete().eq('id', id)

    if (error) {
      throw error
    }

    // Update unit status back to available
    // Type assertion needed because TypeScript can't infer the table type from Database
    await (supabase.from('units') as any)
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
