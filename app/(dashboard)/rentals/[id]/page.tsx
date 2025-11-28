import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RentalTimeline } from '@/components/rentals/rental-timeline'
import { DocumentViewer } from '@/components/rentals/document-viewer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { type Rental, type RentalDocument } from '@/types'
import { ArrowLeft, User, Package, Calendar, DollarSign, FileText } from 'lucide-react'

async function getRental(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('rentals')
    .select('*, customers(*), units(*, facilities(*))')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  return data as Rental | null
}

async function getRentalDocuments(rentalId: string): Promise<RentalDocument[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('rental_documents')
    .select('*')
    .eq('rental_id', rentalId)
    .order('created_at', { ascending: false })

  return (data as RentalDocument[]) || []
}

const statusConfig: Record<Rental['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending_signature: { label: 'Pending Signature', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  terminated: { label: 'Terminated', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'destructive' },
}

export default async function RentalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const rental = await getRental(id)

  if (!rental) {
    notFound()
  }

  const documents = await getRentalDocuments(id)
  const customer = (rental as any).customers
  const unit = (rental as any).units
  const facility = unit?.facilities
  const status = statusConfig[rental.status]

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/rentals">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Rentals
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Rental Agreement</h1>
            <p className="text-muted-foreground">View rental agreement details</p>
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer ? (
              <div className="space-y-2">
                <p className="font-semibold">
                  {customer.first_name} {customer.last_name}
                </p>
                {customer.email && (
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                )}
                {customer.phone && (
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                )}
                <Button variant="outline" size="sm" asChild className="mt-4">
                  <Link href={`/customers/${customer.id}`}>View Customer</Link>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">Customer information not available</p>
            )}
          </CardContent>
        </Card>

        {/* Unit Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Unit Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unit ? (
              <div className="space-y-2">
                <p className="font-semibold">{unit.unit_number}</p>
                <p className="text-sm text-muted-foreground">
                  {unit.size.square_feet} sq ft • {unit.type}
                </p>
                {facility && (
                  <p className="text-sm text-muted-foreground">{facility.name}</p>
                )}
                <Button variant="outline" size="sm" asChild className="mt-4">
                  <Link href={`/units/${unit.id}`}>View Unit</Link>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">Unit information not available</p>
            )}
          </CardContent>
        </Card>

        {/* Rental Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rental Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Start Date:</span>
                <span className="font-medium">
                  {new Date(rental.start_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">End Date:</span>
                <span className="font-medium">
                  {rental.end_date
                    ? new Date(rental.end_date).toLocaleDateString()
                    : 'Month-to-month'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monthly Rate:</span>
                <span className="font-medium">${rental.monthly_rate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Security Deposit:</span>
                <span className="font-medium">${rental.security_deposit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Late Fee Rate:</span>
                <span className="font-medium">${rental.late_fee_rate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Auto-Renew:</span>
                <span className="font-medium">{rental.auto_renew ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Information */}
        {rental.insurance_required && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Insurance Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rental.insurance_provider && (
                  <p>
                    <span className="text-sm text-muted-foreground">Provider:</span>{' '}
                    <span className="font-medium">{rental.insurance_provider}</span>
                  </p>
                )}
                {rental.insurance_policy_number && (
                  <p>
                    <span className="text-sm text-muted-foreground">Policy Number:</span>{' '}
                    <span className="font-medium">{rental.insurance_policy_number}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Special Terms */}
        {rental.special_terms && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Special Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{rental.special_terms}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timeline */}
      <RentalTimeline rental={rental} />

      {/* Documents */}
      <DocumentViewer documents={documents} rentalId={id} />
    </div>
  )
}
