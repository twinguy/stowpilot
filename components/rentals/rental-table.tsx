'use client'

import Link from 'next/link'
import { Calendar, DollarSign, Package, User, Eye } from 'lucide-react'
import { type Rental } from '@/types'
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

interface RentalTableProps {
  rentals: Rental[]
}

const statusConfig: Record<Rental['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending_signature: { label: 'Pending Signature', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  terminated: { label: 'Terminated', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'destructive' },
}

export function RentalTable({ rentals }: RentalTableProps) {
  if (rentals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No rentals yet</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Get started by creating your first rental agreement
        </p>
        <Button asChild>
          <Link href="/rentals/new">Create Rental</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Monthly Rate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rentals.map((rental: any) => {
            const customer = rental.customers
            const unit = rental.units
            const status = statusConfig[rental.status]

            return (
              <TableRow key={rental.id}>
                <TableCell className="font-medium">
                  {customer ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {customer.first_name} {customer.last_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </TableCell>
                <TableCell>
                  {unit ? (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{unit.unit_number}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{new Date(rental.start_date).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {rental.end_date ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{new Date(rental.end_date).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Month-to-month</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span>${rental.monthly_rate.toFixed(2)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild variant="outline" size="icon-sm" aria-label="View rental">
                          <Link href={`/rentals/${rental.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View</p>
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
