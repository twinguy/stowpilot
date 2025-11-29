import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayoutClient } from '@/components/layouts/dashboard-layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  let user = null
  try {
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Session check timeout')), 5000)
    )

    const result = await Promise.race([sessionPromise, timeoutPromise])
    user = result.data?.session?.user ?? null
  } catch (error) {
    console.warn('Supabase connection failed in dashboard layout:', error)
  }

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <DashboardLayoutClient
      userEmail={user.email}
      userName={profile?.full_name || undefined}
    >
      {children}
    </DashboardLayoutClient>
  )
}

