import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsDashboard } from '@/components/reports/analytics-dashboard'
import { OccupancyChart } from '@/components/reports/occupancy-chart'
import { RevenueReports } from '@/components/reports/revenue-reports'
import { MaintenanceAnalytics } from '@/components/reports/maintenance-analytics'
import { ExportTools } from '@/components/reports/export-tools'
import {
  type OccupancyData,
  type RevenueData,
  type MaintenanceMetrics,
  type AnalyticsMetrics,
} from '@/types'

async function getReportsData() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      occupancyData: [],
      revenueData: [],
      maintenanceMetrics: {
        total_requests: 0,
        open_requests: 0,
        completed_requests: 0,
        average_completion_time: null,
        total_cost: 0,
        requests_by_status: {},
        requests_by_category: {},
        requests_by_urgency: {},
      },
      analyticsMetrics: {
        total_facilities: 0,
        total_units: 0,
        total_customers: 0,
        active_rentals: 0,
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0,
        average_occupancy_rate: 0,
        total_maintenance_requests: 0,
      },
    }
  }

  try {
    // Get all data in parallel
    const [facilitiesResult, unitsResult, customersResult, rentalsResult, ledgerResult, maintenanceResult] = await Promise.all([
      supabase.from('facilities').select('*').eq('owner_id', user.id),
      supabase
        .from('units')
        .select('*, facilities!inner(owner_id)')
        .eq('facilities.owner_id', user.id),
      supabase.from('customers').select('*').eq('owner_id', user.id),
      supabase
        .from('rentals')
        .select('*, customers!inner(owner_id)')
        .eq('customers.owner_id', user.id)
        .eq('status', 'active'),
      supabase.from('ledger_entries').select('*').eq('owner_id', user.id),
      supabase
        .from('maintenance_requests')
        .select('*, facilities!inner(owner_id)')
        .eq('facilities.owner_id', user.id),
    ])

    const facilities = facilitiesResult.data || []
    const units = unitsResult.data || []
    const customers = customersResult.data || []
    const rentals = rentalsResult.data || []
    const ledgerEntries = ledgerResult.data || []
    const maintenanceRequests = maintenanceResult.data || []

    // Calculate occupancy data
    const occupancyData: OccupancyData[] = facilities.map((facility: any) => {
      const facilityUnits = units.filter((u: any) => u.facility_id === facility.id)
      const occupied = facilityUnits.filter((u: any) => u.status === 'occupied').length
      const available = facilityUnits.filter((u: any) => u.status === 'available').length
      const reserved = facilityUnits.filter((u: any) => u.status === 'reserved').length
      const maintenance = facilityUnits.filter((u: any) => u.status === 'maintenance').length
      const total = facilityUnits.length
      const occupancyRate = total > 0 ? (occupied / total) * 100 : 0

      return {
        facility_id: facility.id,
        facility_name: facility.name,
        total_units: total,
        occupied_units: occupied,
        available_units: available,
        reserved_units: reserved,
        maintenance_units: maintenance,
        occupancy_rate: occupancyRate,
      }
    })

    // Calculate revenue data
    const revenueDataMap: Record<string, { income: number; expenses: number; net: number }> = {}
    
    ledgerEntries.forEach((entry: any) => {
      const date = new Date(entry.date).toISOString().split('T')[0]
      if (!revenueDataMap[date]) {
        revenueDataMap[date] = { income: 0, expenses: 0, net: 0 }
      }
      if (entry.type === 'income') {
        revenueDataMap[date].income += parseFloat(entry.amount)
      } else if (entry.type === 'expense') {
        revenueDataMap[date].expenses += parseFloat(entry.amount)
      }
      revenueDataMap[date].net = revenueDataMap[date].income - revenueDataMap[date].expenses
    })

    const revenueData: RevenueData[] = Object.entries(revenueDataMap).map(([date, data]) => ({
      date,
      income: data.income,
      expenses: data.expenses,
      net: data.net,
    })).sort((a, b) => a.date.localeCompare(b.date))

    // Calculate maintenance metrics
    const completedRequests = maintenanceRequests.filter((r: any) => r.status === 'completed')
    const completionTimes = completedRequests
      .filter((r: any) => r.created_at && r.actual_completion)
      .map((r: any) => {
        const created = new Date(r.created_at).getTime()
        const completed = new Date(r.actual_completion).getTime()
        return (completed - created) / (1000 * 60 * 60 * 24) // days
      })
    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : null

    const requestsByStatus: Record<string, number> = {}
    const requestsByCategory: Record<string, number> = {}
    const requestsByUrgency: Record<string, number> = {}

    maintenanceRequests.forEach((req: any) => {
      requestsByStatus[req.status] = (requestsByStatus[req.status] || 0) + 1
      requestsByCategory[req.category] = (requestsByCategory[req.category] || 0) + 1
      requestsByUrgency[req.urgency] = (requestsByUrgency[req.urgency] || 0) + 1
    })

    const totalMaintenanceCost = maintenanceRequests
      .filter((r: any) => r.cost)
      .reduce((sum, r: any) => sum + parseFloat(r.cost || 0), 0)

    const maintenanceMetrics: MaintenanceMetrics = {
      total_requests: maintenanceRequests.length,
      open_requests: maintenanceRequests.filter((r: any) => r.status === 'open').length,
      completed_requests: completedRequests.length,
      average_completion_time: averageCompletionTime,
      total_cost: totalMaintenanceCost,
      requests_by_status: requestsByStatus,
      requests_by_category: requestsByCategory,
      requests_by_urgency: requestsByUrgency,
    }

    // Calculate analytics metrics
    const totalRevenue = ledgerEntries
      .filter((e: any) => e.type === 'income')
      .reduce((sum, e: any) => sum + parseFloat(e.amount), 0)
    
    const totalExpenses = ledgerEntries
      .filter((e: any) => e.type === 'expense')
      .reduce((sum, e: any) => sum + parseFloat(e.amount), 0)

    const averageOccupancyRate = occupancyData.length > 0
      ? occupancyData.reduce((sum, d) => sum + d.occupancy_rate, 0) / occupancyData.length
      : 0

    const analyticsMetrics: AnalyticsMetrics = {
      total_facilities: facilities.length,
      total_units: units.length,
      total_customers: customers.length,
      active_rentals: rentals.length,
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_profit: totalRevenue - totalExpenses,
      average_occupancy_rate: averageOccupancyRate,
      total_maintenance_requests: maintenanceRequests.length,
    }

    return {
      occupancyData,
      revenueData,
      maintenanceMetrics,
      analyticsMetrics,
    }
  } catch (error) {
    console.error('Error fetching reports data:', error)
    return {
      occupancyData: [],
      revenueData: [],
      maintenanceMetrics: {
        total_requests: 0,
        open_requests: 0,
        completed_requests: 0,
        average_completion_time: null,
        total_cost: 0,
        requests_by_status: {},
        requests_by_category: {},
        requests_by_urgency: {},
      },
      analyticsMetrics: {
        total_facilities: 0,
        total_units: 0,
        total_customers: 0,
        active_rentals: 0,
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0,
        average_occupancy_rate: 0,
        total_maintenance_requests: 0,
      },
    }
  }
}

export default async function ReportsPage() {
  const { occupancyData, revenueData, maintenanceMetrics, analyticsMetrics } =
    await getReportsData()

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into your storage business performance
        </p>
      </div>

      <Suspense fallback={<div>Loading analytics...</div>}>
        <AnalyticsDashboard metrics={analyticsMetrics} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<div>Loading occupancy data...</div>}>
          <OccupancyChart occupancyData={occupancyData} />
        </Suspense>

        <Suspense fallback={<div>Loading revenue data...</div>}>
          <RevenueReports revenueData={revenueData} />
        </Suspense>
      </div>

      <Suspense fallback={<div>Loading maintenance analytics...</div>}>
        <MaintenanceAnalytics metrics={maintenanceMetrics} />
      </Suspense>

      <Suspense fallback={<div>Loading export tools...</div>}>
        <ExportTools
          occupancyData={occupancyData}
          revenueData={revenueData}
          maintenanceMetrics={maintenanceMetrics}
          analyticsMetrics={analyticsMetrics}
        />
      </Suspense>
    </div>
  )
}
