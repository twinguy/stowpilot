'use client'

import Link from 'next/link'
import { MapPin, Building2, Package } from 'lucide-react'
import { type Facility } from '@/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface FacilityGridProps {
  facilities: Facility[]
}

export function FacilityGrid({ facilities }: FacilityGridProps) {
  if (facilities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No facilities yet</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Get started by creating your first facility
        </p>
        <Button asChild>
          <Link href="/facilities/new">Add Facility</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {facilities.map((facility) => (
        <Card key={facility.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="mb-2">{facility.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {facility.address.city}, {facility.address.state}
                  </span>
                </CardDescription>
              </div>
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
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total Units:</span>
                <span className="font-medium">{facility.total_units}</span>
              </div>
              {facility.amenities.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Amenities: </span>
                  <span className="font-medium">
                    {facility.amenities.slice(0, 3).map((a) => a.name).join(', ')}
                    {facility.amenities.length > 3 && '...'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/facilities/${facility.id}`}>View Details</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/facilities/${facility.id}/edit`}>Edit</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
