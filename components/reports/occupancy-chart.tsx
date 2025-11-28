'use client'

import { Building2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { type OccupancyData } from '@/types'

interface OccupancyChartProps {
  occupancyData: OccupancyData[]
}

export function OccupancyChart({ occupancyData }: OccupancyChartProps) {
  if (occupancyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Occupancy Rates</CardTitle>
          <CardDescription>Unit occupancy by facility</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No occupancy data</h3>
            <p className="text-sm text-muted-foreground">
              Occupancy data will appear here once you have facilities and units
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxOccupancy = Math.max(...occupancyData.map((d) => d.occupancy_rate), 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Occupancy Rates</CardTitle>
        <CardDescription>Unit occupancy by facility</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {occupancyData.map((data) => (
            <div key={data.facility_id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{data.facility_name}</span>
                <span className="text-muted-foreground">
                  {data.occupancy_rate.toFixed(1)}% ({data.occupied_units}/{data.total_units})
                </span>
              </div>
              <div className="relative h-8 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${(data.occupancy_rate / maxOccupancy) * 100}%`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                  {data.occupancy_rate.toFixed(1)}%
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Occupied: {data.occupied_units}</span>
                <span>Available: {data.available_units}</span>
                <span>Reserved: {data.reserved_units}</span>
                {data.maintenance_units > 0 && <span>Maintenance: {data.maintenance_units}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Units</div>
            <div className="mt-1 text-2xl font-bold">
              {occupancyData.reduce((sum, d) => sum + d.total_units, 0)}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground">Occupied</div>
            <div className="mt-1 text-2xl font-bold text-green-600">
              {occupancyData.reduce((sum, d) => sum + d.occupied_units, 0)}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground">Available</div>
            <div className="mt-1 text-2xl font-bold text-blue-600">
              {occupancyData.reduce((sum, d) => sum + d.available_units, 0)}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground">Avg Occupancy</div>
            <div className="mt-1 text-2xl font-bold">
              {occupancyData.length > 0
                ? (
                    occupancyData.reduce((sum, d) => sum + d.occupancy_rate, 0) /
                    occupancyData.length
                  ).toFixed(1)
                : '0.0'}
              %
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
