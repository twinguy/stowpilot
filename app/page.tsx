import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayoutClient } from '@/components/layouts/dashboard-layout-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function DashboardContent({ profile }: { profile: any }) {
  return (
    <div className="container mx-auto p-6 space-y-6 lg:pt-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
        <p className="text-muted-foreground mt-2">
          Manage your self-storage facilities from one place
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Facilities</CardTitle>
            <CardDescription>Manage your storage facilities</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">No facilities yet</p>
            <Button asChild className="mt-4 w-full">
              <Link href="/facilities/new">Add Facility</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Units</CardTitle>
            <CardDescription>Track unit inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">No units yet</p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/units">View Units</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Manage customer relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">No customers yet</p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/customers/new">Add Customer</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {profile && !profile.business_name && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Add your business information to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/settings">Go to Settings</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>
}) {
  const supabase = await createClient()
  let user = null
  try {
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Session check timeout')), 5000)
    )

    const {
      data: { session },
    } = await Promise.race([sessionPromise, timeoutPromise])
    user = session?.user
  } catch (error) {
    console.warn('Supabase connection failed in page:', error)
  }

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const params = await searchParams

  return (
    <DashboardLayoutClient
      userEmail={user.email}
      userName={profile?.full_name || undefined}
    >
      {params?.onboarding === 'true' && (
        <div className="bg-primary/10 border-b border-primary/20 p-4">
          <div className="container mx-auto">
            <p className="text-sm text-primary">
              🎉 Welcome to StowPilot! Get started by adding your first facility.
            </p>
          </div>
        </div>
      )}
      <Suspense fallback={<div className="container mx-auto p-6">Loading...</div>}>
        <DashboardContent profile={profile} />
      </Suspense>
    </DashboardLayoutClient>
  )
}
