'use client'

import { CheckCircle2, Clock, XCircle, FileText, Calendar } from 'lucide-react'
import { type Rental, type RentalStatus } from '@/types'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface RentalTimelineProps {
  rental: Rental
}

const statusConfig: Record<RentalStatus, { label: string; icon: typeof CheckCircle2; variant: 'default' | 'secondary' | 'destructive' }> = {
  draft: { label: 'Draft', icon: FileText, variant: 'secondary' },
  pending_signature: { label: 'Pending Signature', icon: Clock, variant: 'secondary' },
  active: { label: 'Active', icon: CheckCircle2, variant: 'default' },
  terminated: { label: 'Terminated', icon: XCircle, variant: 'destructive' },
  expired: { label: 'Expired', icon: XCircle, variant: 'destructive' },
}

export function RentalTimeline({ rental }: RentalTimelineProps) {
  const StatusIcon = statusConfig[rental.status].icon

  const timelineEvents = [
    {
      date: rental.created_at,
      label: 'Rental Created',
      description: 'Rental agreement was created',
      icon: FileText,
      completed: true,
    },
    {
      date: rental.signed_at,
      label: 'Agreement Signed',
      description: rental.signed_at
        ? `Signed on ${new Date(rental.signed_at).toLocaleDateString()}`
        : 'Waiting for signature',
      icon: CheckCircle2,
      completed: !!rental.signed_at,
    },
    {
      date: rental.start_date,
      label: 'Rental Start',
      description: `Rental period begins on ${new Date(rental.start_date).toLocaleDateString()}`,
      icon: Calendar,
      completed: new Date(rental.start_date) <= new Date(),
    },
    ...(rental.end_date
      ? [
          {
            date: rental.end_date,
            label: 'Rental End',
            description: `Rental period ends on ${new Date(rental.end_date).toLocaleDateString()}`,
            icon: Calendar,
            completed: new Date(rental.end_date) <= new Date(),
          },
        ]
      : []),
    ...(rental.terminated_at
      ? [
          {
            date: rental.terminated_at,
            label: 'Rental Terminated',
            description: `Terminated on ${new Date(rental.terminated_at).toLocaleDateString()}`,
            icon: XCircle,
            completed: true,
          },
        ]
      : []),
  ].filter((event) => event.date !== null).sort((a, b) => {
    const dateA = new Date(a.date as string).getTime()
    const dateB = new Date(b.date as string).getTime()
    return dateA - dateB
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rental Status</CardTitle>
            <CardDescription>Timeline of rental agreement events</CardDescription>
          </div>
          <Badge variant={statusConfig[rental.status].variant}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig[rental.status].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineEvents.map((event, index) => {
            const EventIcon = event.icon
            return (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      event.completed
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <EventIcon className="h-4 w-4" />
                  </div>
                  {index < timelineEvents.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 ${
                        event.completed ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{event.label}</h4>
                    <span className="text-sm text-muted-foreground">
                      {event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
