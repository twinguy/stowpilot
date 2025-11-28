'use client'

import Link from 'next/link'
import { DollarSign, Calendar, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { type Payment } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface PaymentHistoryProps {
  payments: Payment[]
}

function getStatusBadgeVariant(status: Payment['status']) {
  switch (status) {
    case 'completed':
      return 'default'
    case 'failed':
      return 'destructive'
    case 'refunded':
      return 'secondary'
    case 'pending':
      return 'outline'
    default:
      return 'outline'
  }
}

function getStatusIcon(status: Payment['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-600" />
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-600" />
    default:
      return null
  }
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No payments yet</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Payment history will appear here once payments are recorded
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {payment.processed_at
                    ? format(new Date(payment.processed_at), 'MMM d, yyyy')
                    : format(new Date(payment.created_at), 'MMM d, yyyy')}
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/billing/invoices/${payment.invoice_id}`}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <FileText className="h-3 w-3" />
                  View Invoice
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 font-medium">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  {payment.amount.toFixed(2)}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground font-mono">
                  {payment.transaction_id || 'N/A'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(payment.status)}
                  <Badge variant={getStatusBadgeVariant(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {payment.notes || '-'}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
