'use client'

import { DollarSign, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { type LedgerEntry } from '@/types'
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

interface LedgerViewProps {
  entries: LedgerEntry[]
}

function getTypeBadgeVariant(type: LedgerEntry['type']) {
  switch (type) {
    case 'income':
      return 'default'
    case 'expense':
      return 'destructive'
    case 'adjustment':
      return 'secondary'
    default:
      return 'outline'
  }
}

function getTypeIcon(type: LedgerEntry['type']) {
  switch (type) {
    case 'income':
      return <TrendingUp className="h-4 w-4 text-green-600" />
    case 'expense':
      return <TrendingDown className="h-4 w-4 text-red-600" />
    case 'adjustment':
      return <Minus className="h-4 w-4 text-yellow-600" />
    default:
      return null
  }
}

export function LedgerView({ entries }: LedgerViewProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No ledger entries yet</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Ledger entries will appear here once transactions are recorded
        </p>
      </div>
    )
  }

  const totalIncome = entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0)
  const totalExpenses = entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0)
  const netAmount = totalIncome - totalExpenses

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Income</div>
          <div className="mt-1 text-2xl font-bold text-green-600">
            ${totalIncome.toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Expenses</div>
          <div className="mt-1 text-2xl font-bold text-red-600">
            ${totalExpenses.toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Net Amount</div>
          <div className={`mt-1 text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${netAmount.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {format(new Date(entry.date), 'MMM d, yyyy')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(entry.type)}
                    <Badge variant={getTypeBadgeVariant(entry.type)}>
                      {entry.type}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{entry.category}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{entry.description}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className={`flex items-center justify-end gap-1 font-medium ${
                      entry.type === 'income'
                        ? 'text-green-600'
                        : entry.type === 'expense'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                    }`}
                  >
                    {entry.type === 'expense' && '-'}
                    <DollarSign className="h-4 w-4" />
                    {entry.amount.toFixed(2)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
