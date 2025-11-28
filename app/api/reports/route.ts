import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const occupancyData = facilities.map((facility) => {
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
    const revenueData: Record<string, { income: number; expenses: number; net: number }> = {}
    
    ledgerEntries.forEach((entry: any) => {
      const date = new Date(entry.date).toISOString().split('T')[0]
      if (!revenueData[date]) {
        revenueData[date] = { income: 0, expenses: 0, net: 0 }
      }
      if (entry.type === 'income') {
        revenueData[date].income += parseFloat(entry.amount)
      } else if (entry.type === 'expense') {
        revenueData[date].expenses += parseFloat(entry.amount)
      }
      revenueData[date].net = revenueData[date].income - revenueData[date].expenses
    })

    const revenueDataArray = Object.entries(revenueData).map(([date, data]) => ({
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

    const maintenanceMetrics = {
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

    const analyticsMetrics = {
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

    return NextResponse.json({
      occupancy_data: occupancyData,
      revenue_data: revenueDataArray,
      maintenance_metrics: maintenanceMetrics,
      analytics_metrics: analyticsMetrics,
    })
  } catch (error) {
    console.error('Error fetching reports data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
