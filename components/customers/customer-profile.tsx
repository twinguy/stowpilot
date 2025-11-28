'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, User, CreditCard, FileText, Calendar } from 'lucide-react'
import { type Customer } from '@/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CustomerProfileProps {
  customer: Customer
}

export function CustomerProfile({ customer }: CustomerProfileProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {customer.first_name} {customer.last_name}
          </h1>
          <p className="text-muted-foreground">Customer Profile</p>
        </div>
        <Button asChild>
          <Link href={`/customers/${customer.id}/edit`}>Edit Customer</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Primary contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div>{customer.address.street}</div>
                  <div className="text-sm text-muted-foreground">
                    {customer.address.city}, {customer.address.state} {customer.address.zip}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Verification</CardTitle>
            <CardDescription>Account status and background check</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
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
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Background Check</span>
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
            </div>
            {customer.credit_score && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Credit Score</span>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{customer.credit_score}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {customer.emergency_contact && (
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>Emergency contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Name: </span>
                <span className="font-medium">{customer.emergency_contact.name}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Phone: </span>
                <span>{customer.emergency_contact.phone}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Relationship: </span>
                <span>{customer.emergency_contact.relationship}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {customer.identification && (
          <Card>
            <CardHeader>
              <CardTitle>Identification</CardTitle>
              <CardDescription>Government-issued ID information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Type: </span>
                <span className="font-medium capitalize">
                  {customer.identification.type.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Number: </span>
                <span className="font-mono">{customer.identification.number}</span>
              </div>
              {customer.identification.expiry && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Expires: </span>
                  <span>
                    {new Date(customer.identification.expiry).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {customer.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Additional information about this customer</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Account creation and update dates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Created: </span>
            <span>{new Date(customer.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Last Updated: </span>
            <span>{new Date(customer.updated_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
