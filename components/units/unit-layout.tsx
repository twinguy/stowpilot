'use client'

import Link from 'next/link'
import { Edit } from 'lucide-react'
import { type Unit } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface UnitLayoutProps {
  units: Unit[]
  onUnitClick?: (unit: Unit) => void
}

const statusColors: Record<Unit['status'], string> = {
  available: 'bg-green-500',
  occupied: 'bg-blue-500',
  reserved: 'bg-yellow-500',
  maintenance: 'bg-red-500',
  out_of_service: 'bg-gray-500',
}

export function UnitLayout({ units, onUnitClick }: UnitLayoutProps) {
  if (units.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No units found</p>
      </div>
    )
  }

  // Group units by floor level
  const unitsByFloor = units.reduce(
    (acc, unit) => {
      if (!acc[unit.floor_level]) {
        acc[unit.floor_level] = []
      }
      acc[unit.floor_level].push(unit)
      return acc
    },
    {} as Record<number, Unit[]>
  )

  const floors = Object.keys(unitsByFloor)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      {floors.map((floor) => (
        <div key={floor} className="space-y-2">
          <h3 className="text-lg font-semibold">
            Floor {floor === 0 ? 'Ground' : floor}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {unitsByFloor[floor].map((unit) => (
              <Card
                key={unit.id}
                className={`transition-all hover:shadow-md ${
                  onUnitClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onUnitClick?.(unit)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{unit.unit_number}</CardTitle>
                    <div
                      className={`h-3 w-3 rounded-full ${statusColors[unit.status]}`}
                      title={unit.status}
                    />
                  </div>
                  <CardDescription className="text-xs">
                    {unit.size.square_feet} sq ft
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline" className="text-xs">
                      {unit.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="font-medium">${unit.monthly_rate}/mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={
                        unit.status === 'available'
                          ? 'default'
                          : unit.status === 'occupied'
                            ? 'secondary'
                            : 'destructive'
                      }
                      className="text-xs capitalize"
                    >
                      {unit.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={`/units/${unit.id}/edit`}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
