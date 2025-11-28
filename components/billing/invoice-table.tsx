'use client'

import Link from 'next/link'
import { FileText, Calendar, DollarSign, Eye, Pencil } from 'lucide-react'
import { type Invoice } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { format } from 'date-fns'

interface InvoiceTableProps {
  invoices: Invoice[]
}

function getStatusBadgeVariant(status: Invoice['status']) {
  switch (status) {
    case 'paid':
      return 'default'
    case 'overdue':
      return 'destructive'
    case 'sent':
      return 'secondary'
    case 'draft':
      return 'outline'
    case 'cancelled':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No invoices yet</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Invoices will appear here once created
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Amount Due</TableHead>
            <TableHead>Amount Paid</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const amountRemaining = invoice.amount_due - invoice.amount_paid
            const isOverdue =
              invoice.status === 'overdue' ||
              (invoice.status === 'sent' &&
                new Date(invoice.due_date) < new Date() &&
                amountRemaining > 0)

            return (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.invoice_number}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/customers/${invoice.customer_id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Customer
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(invoice.period_start), 'MMM d')} -{' '}
                      {format(new Date(invoice.period_end), 'MMM d, yyyy')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 font-medium">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    {invoice.amount_due.toFixed(2)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className={invoice.amount_paid > 0 ? 'font-medium' : 'text-muted-foreground'}>
                      {invoice.amount_paid.toFixed(2)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`text-sm ${isOverdue ? 'font-medium text-destructive' : ''}`}>
                    {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild variant="outline" size="icon-sm" aria-label="View invoice">
                          <Link href={`/billing/invoices/${invoice.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild variant="outline" size="icon-sm" aria-label="Edit invoice">
                          <Link href={`/billing/invoices/${invoice.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
