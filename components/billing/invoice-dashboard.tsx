'use client'

import { type Invoice } from '@/types'
import { InvoiceTable } from './invoice-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DollarSign, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface InvoiceDashboardProps {
  invoices: Invoice[]
}

export function InvoiceDashboard({ invoices }: InvoiceDashboardProps) {
  const totalAmountDue = invoices.reduce((sum, inv) => sum + inv.amount_due, 0)
  const totalAmountPaid = invoices.reduce((sum, inv) => sum + inv.amount_paid, 0)
  const overdueCount = invoices.filter(
    (inv) =>
      inv.status === 'overdue' ||
      (inv.status === 'sent' &&
        new Date(inv.due_date) < new Date() &&
        inv.amount_due - inv.amount_paid > 0)
  ).length
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmountDue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across {invoices.length} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmountPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {paidCount} paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Invoices past due date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              All invoice statuses
            </p>
          </CardContent>
        </Card>
      </div>

      <InvoiceTable invoices={invoices} />
    </div>
  )
}
