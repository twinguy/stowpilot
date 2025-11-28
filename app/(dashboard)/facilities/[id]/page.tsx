import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Building2, Package, Edit, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { UnitLayout } from '@/components/units/unit-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { type Facility, type Unit } from '@/types'

async function getFacility(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  return data as Facility | null
}

async function getUnits(facilityId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('units')
    .select('*')
    .eq('facility_id', facilityId)
    .order('unit_number', { ascending: true })

  return (data as Unit[]) || []
}

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const facility = await getFacility(id)
  const units = await getUnits(id)

  if (!facility) {
    notFound()
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{facility.name}</h1>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {facility.address.city}, {facility.address.state}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/facilities/${id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/facilities/${id}/units/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Facility Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge
                variant={
                  facility.status === 'active'
                    ? 'default'
                    : facility.status === 'maintenance'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {facility.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Address</div>
              <div className="font-medium">
                {facility.address.street}
                <br />
                {facility.address.city}, {facility.address.state} {facility.address.zip}
              </div>
            </div>
            {facility.contact_info && (
              <div>
                <div className="text-sm text-muted-foreground">Contact</div>
                <div className="font-medium">
                  {facility.contact_info.phone && <div>Phone: {facility.contact_info.phone}</div>}
                  {facility.contact_info.email && (
                    <div>Email: {facility.contact_info.email}</div>
                  )}
                </div>
              </div>
            )}
            {facility.amenities.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Amenities</div>
                <div className="flex flex-wrap gap-2">
                  {facility.amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline">
                      {amenity.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {facility.notes && (
              <div>
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="text-sm">{facility.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Units</span>
              </div>
              <span className="text-2xl font-bold">{facility.total_units}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available Units</span>
              <span className="text-xl font-semibold">
                {units.filter((u) => u.status === 'available').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Occupied Units</span>
              <span className="text-xl font-semibold">
                {units.filter((u) => u.status === 'occupied').length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Units</CardTitle>
          <CardDescription>All units in this facility</CardDescription>
        </CardHeader>
        <CardContent>
          <UnitLayout units={units} />
        </CardContent>
      </Card>
    </div>
  )
}
