import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">StowPilot</h1>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

