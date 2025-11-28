'use client'

import { useState } from 'react'
import { Calendar, Download, FileText } from 'lucide-react'
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
import { type Invoice, type Payment, type LedgerEntry } from '@/types'

interface ReportGeneratorProps {
  invoices: Invoice[]
  payments: Payment[]
  ledgerEntries: LedgerEntry[]
}

type ReportType = 'financial_summary' | 'invoice_summary' | 'payment_summary' | 'ledger_summary'

export function ReportGenerator({
  invoices,
  payments,
  ledgerEntries,
}: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('financial_summary')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const generateReport = () => {
    const filteredInvoices = invoices.filter((inv) => {
      if (startDate && new Date(inv.created_at) < new Date(startDate)) return false
      if (endDate && new Date(inv.created_at) > new Date(endDate)) return false
      return true
    })

    const filteredPayments = payments.filter((pay) => {
      const date = pay.processed_at || pay.created_at
      if (startDate && new Date(date) < new Date(startDate)) return false
      if (endDate && new Date(date) > new Date(endDate)) return false
      return true
    })

    const filteredLedger = ledgerEntries.filter((entry) => {
      if (startDate && new Date(entry.date) < new Date(startDate)) return false
      if (endDate && new Date(entry.date) > new Date(endDate)) return false
      return true
    })

    let reportData = ''

    switch (reportType) {
      case 'financial_summary':
        const totalIncome = filteredLedger
          .filter((e) => e.type === 'income')
          .reduce((sum, e) => sum + e.amount, 0)
        const totalExpenses = filteredLedger
          .filter((e) => e.type === 'expense')
          .reduce((sum, e) => sum + e.amount, 0)
        const totalInvoices = filteredInvoices.reduce((sum, inv) => sum + inv.amount_due, 0)
        const totalPaid = filteredPayments
          .filter((p) => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0)

        reportData = `Financial Summary Report
Generated: ${new Date().toLocaleDateString()}
Period: ${startDate || 'All time'} to ${endDate || 'Present'}

INVOICES
Total Invoices: ${filteredInvoices.length}
Total Amount Due: $${totalInvoices.toFixed(2)}
Total Paid: $${totalPaid.toFixed(2)}
Outstanding: $${(totalInvoices - totalPaid).toFixed(2)}

LEDGER
Total Income: $${totalIncome.toFixed(2)}
Total Expenses: $${totalExpenses.toFixed(2)}
Net Amount: $${(totalIncome - totalExpenses).toFixed(2)}
`
        break

      case 'invoice_summary':
        reportData = `Invoice Summary Report
Generated: ${new Date().toLocaleDateString()}
Period: ${startDate || 'All time'} to ${endDate || 'Present'}

Total Invoices: ${filteredInvoices.length}
Paid: ${filteredInvoices.filter((inv) => inv.status === 'paid').length}
Overdue: ${filteredInvoices.filter((inv) => inv.status === 'overdue').length}
Pending: ${filteredInvoices.filter((inv) => inv.status === 'sent').length}

INVOICES
${filteredInvoices
  .map(
    (inv) =>
      `${inv.invoice_number} | $${inv.amount_due.toFixed(2)} | ${inv.status} | Due: ${inv.due_date}`
  )
  .join('\n')}
`
        break

      case 'payment_summary':
        reportData = `Payment Summary Report
Generated: ${new Date().toLocaleDateString()}
Period: ${startDate || 'All time'} to ${endDate || 'Present'}

Total Payments: ${filteredPayments.length}
Completed: ${filteredPayments.filter((p) => p.status === 'completed').length}
Failed: ${filteredPayments.filter((p) => p.status === 'failed').length}
Pending: ${filteredPayments.filter((p) => p.status === 'pending').length}

Total Amount: $${filteredPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}

PAYMENTS
${filteredPayments
  .map(
    (pay) =>
      `$${pay.amount.toFixed(2)} | ${pay.status} | ${pay.processed_at || pay.created_at} | ${pay.transaction_id || 'N/A'}`
  )
  .join('\n')}
`
        break

      case 'ledger_summary':
        reportData = `Ledger Summary Report
Generated: ${new Date().toLocaleDateString()}
Period: ${startDate || 'All time'} to ${endDate || 'Present'}

Total Entries: ${filteredLedger.length}
Income Entries: ${filteredLedger.filter((e) => e.type === 'income').length}
Expense Entries: ${filteredLedger.filter((e) => e.type === 'expense').length}

LEDGER ENTRIES
${filteredLedger
  .map(
    (entry) =>
      `${entry.date} | ${entry.type.toUpperCase()} | ${entry.category} | $${entry.amount.toFixed(2)} | ${entry.description}`
  )
  .join('\n')}
`
        break
    }

    // Create and download file
    const blob = new Blob([reportData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
        <CardDescription>Export financial data as a text file</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Report Type</label>
          <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial_summary">Financial Summary</SelectItem>
              <SelectItem value="invoice_summary">Invoice Summary</SelectItem>
              <SelectItem value="payment_summary">Payment Summary</SelectItem>
              <SelectItem value="ledger_summary">Ledger Summary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date (Optional)</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date (Optional)</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={generateReport} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Generate & Download Report
        </Button>
      </CardContent>
    </Card>
  )
}
