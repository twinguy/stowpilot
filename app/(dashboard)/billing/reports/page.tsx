import { createClient } from '@/lib/supabase/server'
import { ReportGenerator } from '@/components/billing/report-generator'
import { type Invoice, type Payment, type LedgerEntry } from '@/types'

async function getAllBillingData() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      invoices: [],
      payments: [],
      ledgerEntries: [],
    }
  }

  const [invoicesResult, paymentsResult, ledgerResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, customers!inner(owner_id)')
      .eq('customers.owner_id', user.id),
    supabase
      .from('payments')
      .select('*, customers!inner(owner_id)')
      .eq('customers.owner_id', user.id),
    supabase.from('ledger_entries').select('*').eq('owner_id', user.id),
  ])

  return {
    invoices: (invoicesResult.data as Invoice[]) || [],
    payments: (paymentsResult.data as Payment[]) || [],
    ledgerEntries: (ledgerResult.data as LedgerEntry[]) || [],
  }
}

export default async function ReportsPage() {
  const { invoices, payments, ledgerEntries } = await getAllBillingData()

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">Generate and export financial reports</p>
      </div>

      <ReportGenerator
        invoices={invoices}
        payments={payments}
        ledgerEntries={ledgerEntries}
      />
    </div>
  )
}
