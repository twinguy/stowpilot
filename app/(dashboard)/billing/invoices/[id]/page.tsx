import Link from 'next/link'
import { ArrowLeft, DollarSign, Calendar, FileText, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { type Invoice } from '@/types'

async function getInvoice(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('invoices')
    .select('*, customers!inner(owner_id, first_name, last_name, email, phone)')
    .eq('id', id)
    .eq('customers.owner_id', user.id)
    .single()

  return data as Invoice & {
    customers: {
      first_name: string
      last_name: string
      email: string | null
      phone: string | null
    }
  } | null
}

async function getPayments(invoiceId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('payments')
    .select('*, customers!inner(owner_id)')
    .eq('invoice_id', invoiceId)
    .eq('customers.owner_id', user.id)
    .order('created_at', { ascending: false })

  return data || []
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

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const invoice = await getInvoice(id)
  const payments = await getPayments(id)

  if (!invoice) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invoice not found</h1>
          <p className="text-muted-foreground mt-2">
            The invoice you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button asChild className="mt-4">
            <Link href="/billing">Back to Billing</Link>
          </Button>
        </div>
      </div>
    )
  }

  const amountRemaining = invoice.amount_due - invoice.amount_paid
  const isOverdue =
    invoice.status === 'overdue' ||
    (invoice.status === 'sent' &&
      new Date(invoice.due_date) < new Date() &&
      amountRemaining > 0)

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/billing">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Invoice {invoice.invoice_number}</h1>
          <p className="text-muted-foreground">Invoice details and payment history</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
            <CardDescription>Details about this invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={getStatusBadgeVariant(invoice.status)}>
                {invoice.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Customer</span>
              <div className="text-right">
                <Link
                  href={`/customers/${invoice.customer_id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {invoice.customers.first_name} {invoice.customers.last_name}
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Period</span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(invoice.period_start), 'MMM d')} -{' '}
                {format(new Date(invoice.period_end), 'MMM d, yyyy')}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Due Date</span>
              <div className={`text-sm ${isOverdue ? 'font-medium text-destructive' : ''}`}>
                {format(new Date(invoice.due_date), 'MMM d, yyyy')}
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Amount Due</span>
                <div className="flex items-center gap-1 font-medium">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  {invoice.amount_due.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Amount Paid</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  {invoice.amount_paid.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-medium">Remaining</span>
                <div className={`flex items-center gap-1 font-bold ${amountRemaining > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  <DollarSign className="h-4 w-4" />
                  {amountRemaining.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Payments applied to this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No payments recorded yet
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <div className="font-medium">${payment.amount.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {payment.processed_at
                          ? format(new Date(payment.processed_at), 'MMM d, yyyy')
                          : format(new Date(payment.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
