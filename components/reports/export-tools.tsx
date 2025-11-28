'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type OccupancyData,
  type RevenueData,
  type MaintenanceMetrics,
  type AnalyticsMetrics,
} from '@/types'

interface ExportToolsProps {
  occupancyData: OccupancyData[]
  revenueData: RevenueData[]
  maintenanceMetrics: MaintenanceMetrics
  analyticsMetrics: AnalyticsMetrics
}

type ExportFormat = 'csv' | 'json' | 'txt'

export function ExportTools({
  occupancyData,
  revenueData,
  maintenanceMetrics,
  analyticsMetrics,
}: ExportToolsProps) {
  const [exportType, setExportType] = useState<'all' | 'occupancy' | 'revenue' | 'maintenance' | 'analytics'>('all')
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const exportData = () => {
    let data: any = {}
    let filename = ''

    switch (exportType) {
      case 'occupancy':
        data = occupancyData
        filename = `occupancy_report_${new Date().toISOString().split('T')[0]}`
        break
      case 'revenue':
        data = revenueData.filter((item) => {
          if (dateFrom && item.date < dateFrom) return false
          if (dateTo && item.date > dateTo) return false
          return true
        })
        filename = `revenue_report_${new Date().toISOString().split('T')[0]}`
        break
      case 'maintenance':
        data = maintenanceMetrics
        filename = `maintenance_report_${new Date().toISOString().split('T')[0]}`
        break
      case 'analytics':
        data = analyticsMetrics
        filename = `analytics_report_${new Date().toISOString().split('T')[0]}`
        break
      case 'all':
        data = {
          occupancy: occupancyData,
          revenue: revenueData.filter((item) => {
            if (dateFrom && item.date < dateFrom) return false
            if (dateTo && item.date > dateTo) return false
            return true
          }),
          maintenance: maintenanceMetrics,
          analytics: analyticsMetrics,
        }
        filename = `full_report_${new Date().toISOString().split('T')[0]}`
        break
    }

    let content = ''
    let mimeType = ''

    if (format === 'csv') {
      content = convertToCSV(data, exportType)
      mimeType = 'text/csv'
      filename += '.csv'
    } else if (format === 'json') {
      content = JSON.stringify(data, null, 2)
      mimeType = 'application/json'
      filename += '.json'
    } else {
      content = convertToTXT(data, exportType)
      mimeType = 'text/plain'
      filename += '.txt'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const convertToCSV = (data: any, type: string): string => {
    if (type === 'all') {
      let csv = 'Report Type,Data\n'
      csv += `Occupancy,${JSON.stringify(data.occupancy)}\n`
      csv += `Revenue,${JSON.stringify(data.revenue)}\n`
      csv += `Maintenance,${JSON.stringify(data.maintenance)}\n`
      csv += `Analytics,${JSON.stringify(data.analytics)}\n`
      return csv
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return ''
      const headers = Object.keys(data[0]).join(',')
      const rows = data.map((item) => Object.values(item).join(','))
      return [headers, ...rows].join('\n')
    }

    // For objects, convert to key-value pairs
    const rows = Object.entries(data).map(([key, value]) => `${key},${value}`)
    return ['Key,Value', ...rows].join('\n')
  }

  const convertToTXT = (data: any, type: string): string => {
    let txt = `Report Generated: ${new Date().toLocaleString()}\n`
    txt += `Report Type: ${type}\n`
    txt += `Date Range: ${dateFrom || 'All time'} to ${dateTo || 'Present'}\n\n`

    if (type === 'all') {
      txt += '=== OCCUPANCY DATA ===\n'
      txt += JSON.stringify(data.occupancy, null, 2) + '\n\n'
      txt += '=== REVENUE DATA ===\n'
      txt += JSON.stringify(data.revenue, null, 2) + '\n\n'
      txt += '=== MAINTENANCE METRICS ===\n'
      txt += JSON.stringify(data.maintenance, null, 2) + '\n\n'
      txt += '=== ANALYTICS METRICS ===\n'
      txt += JSON.stringify(data.analytics, null, 2) + '\n'
    } else {
      txt += JSON.stringify(data, null, 2)
    }

    return txt
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
        <CardDescription>Export reports in various formats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Export Type</label>
          <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Data</SelectItem>
              <SelectItem value="occupancy">Occupancy Data</SelectItem>
              <SelectItem value="revenue">Revenue Data</SelectItem>
              <SelectItem value="maintenance">Maintenance Metrics</SelectItem>
              <SelectItem value="analytics">Analytics Metrics</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Export Format</label>
          <Select value={format} onValueChange={(value: ExportFormat) => setFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  JSON
                </div>
              </SelectItem>
              <SelectItem value="txt">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Text
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(exportType === 'revenue' || exportType === 'all') && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                From Date (Optional)
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                To Date (Optional)
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        )}

        <Button onClick={exportData} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Export {exportType === 'all' ? 'All Data' : exportType.charAt(0).toUpperCase() + exportType.slice(1)} as {format.toUpperCase()}
        </Button>
      </CardContent>
    </Card>
  )
}
