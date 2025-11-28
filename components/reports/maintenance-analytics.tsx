'use client'

import { Wrench, Clock, DollarSign, AlertCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type MaintenanceMetrics } from '@/types'

interface MaintenanceAnalyticsProps {
  metrics: MaintenanceMetrics
}

export function MaintenanceAnalytics({ metrics }: MaintenanceAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDays = (days: number | null) => {
    if (days === null) return 'N/A'
    return `${days.toFixed(1)} days`
  }

  const completionRate =
    metrics.total_requests > 0
      ? ((metrics.completed_requests / metrics.total_requests) * 100).toFixed(1)
      : '0.0'

  const statusColors: Record<string, string> = {
    open: 'bg-yellow-500',
    assigned: 'bg-blue-500',
    in_progress: 'bg-purple-500',
    completed: 'bg-green-500',
    cancelled: 'bg-gray-500',
  }

  const urgencyColors: Record<string, string> = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    emergency: 'bg-red-500',
  }

  const maxStatusCount = Math.max(...Object.values(metrics.requests_by_status), 1)
  const maxCategoryCount = Math.max(...Object.values(metrics.requests_by_category), 1)
  const maxUrgencyCount = Math.max(...Object.values(metrics.requests_by_urgency), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Analytics</CardTitle>
        <CardDescription>Maintenance request efficiency metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wrench className="h-4 w-4" />
              Total Requests
            </div>
            <div className="mt-1 text-2xl font-bold">{metrics.total_requests}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Open Requests
            </div>
            <div className="mt-1 text-2xl font-bold text-yellow-600">
              {metrics.open_requests}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4 text-green-600" />
              Avg Completion
            </div>
            <div className="mt-1 text-2xl font-bold">{formatDays(metrics.average_completion_time)}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </div>
            <div className="mt-1 text-2xl font-bold">{formatCurrency(metrics.total_cost)}</div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Completion Rate</h3>
            <Badge variant="default">{completionRate}%</Badge>
          </div>
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-green-600 transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Completed: {metrics.completed_requests}</span>
            <span>Total: {metrics.total_requests}</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">By Status</h3>
            <div className="space-y-3">
              {Object.entries(metrics.requests_by_status).map(([status, count]) => (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize font-medium">{status.replace('_', ' ')}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${statusColors[status] || 'bg-gray-500'}`}
                      style={{ width: `${(count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">By Category</h3>
            <div className="space-y-3">
              {Object.entries(metrics.requests_by_category).map(([category, count]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize font-medium">{category}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">By Urgency</h3>
            <div className="space-y-3">
              {Object.entries(metrics.requests_by_urgency).map(([urgency, count]) => (
                <div key={urgency} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize font-medium">{urgency}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${urgencyColors[urgency] || 'bg-gray-500'}`}
                      style={{ width: `${(count / maxUrgencyCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
