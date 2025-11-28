'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, User } from 'lucide-react'
import { type Customer } from '@/types'
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

interface CustomerTableProps {
  customers: Customer[]
}

export function CustomerTable({ customers }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No customers yet</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Get started by adding your first customer
        </p>
        <Button asChild>
          <Link href="/customers/new">Add Customer</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Background Check</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">
                {customer.first_name} {customer.last_name}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {customer.email && (
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{customer.phone}</span>
                    </div>
                  )}
                  {!customer.email && !customer.phone && (
                    <span className="text-sm text-muted-foreground">No contact info</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {customer.address ? (
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {customer.address.city}, {customer.address.state}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No address</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    customer.background_check_status === 'approved'
                      ? 'default'
                      : customer.background_check_status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {customer.background_check_status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    customer.status === 'active'
                      ? 'default'
                      : customer.status === 'delinquent'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {customer.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/customers/${customer.id}`}>View</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/customers/${customer.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
