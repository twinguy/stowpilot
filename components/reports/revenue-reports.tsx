'use client'

import { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { type RevenueData } from '@/types'

interface RevenueReportsProps {
  revenueData: RevenueData[]
}

export function RevenueReports({ revenueData }: RevenueReportsProps) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const filteredData = revenueData.filter((item) => {
    if (dateFrom && item.date < dateFrom) return false
    if (dateTo && item.date > dateTo) return false
    return true
  })

  const totalIncome = filteredData.reduce((sum, item) => sum + item.income, 0)
  const totalExpenses = filteredData.reduce((sum, item) => sum + item.expenses, 0)
  const totalNet = filteredData.reduce((sum, item) => sum + item.net, 0)

  const maxValue = Math.max(
    ...filteredData.map((d) => Math.max(d.income, d.expenses, Math.abs(d.net))),
    1
  )

  if (revenueData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Expenses</CardTitle>
          <CardDescription>Financial performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No revenue data</h3>
            <p className="text-sm text-muted-foreground">
              Revenue data will appear here once transactions are recorded
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Expenses</CardTitle>
        <CardDescription>Financial performance over time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total Income
            </div>
            <div className="mt-1 text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Total Expenses
            </div>
            <div className="mt-1 text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Net Profit
            </div>
            <div
              className={`mt-1 text-2xl font-bold ${
                totalNet >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(totalNet)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Daily Breakdown</h3>
          <div className="space-y-3">
            {filteredData.slice(-30).map((item) => (
              <div key={item.date} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-600">Income: {formatCurrency(item.income)}</span>
                    <span className="text-red-600">Expenses: {formatCurrency(item.expenses)}</span>
                    <span
                      className={item.net >= 0 ? 'text-green-600' : 'text-red-600'}
                    >
                      Net: {formatCurrency(item.net)}
                    </span>
                  </div>
                </div>
                <div className="relative h-6 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute left-0 top-0 h-full bg-green-600"
                    style={{
                      width: `${(item.income / maxValue) * 100}%`,
                    }}
                  />
                  <div
                    className="absolute right-0 top-0 h-full bg-red-600"
                    style={{
                      width: `${(item.expenses / maxValue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
