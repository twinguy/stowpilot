import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileSettings } from '@/components/settings/profile-settings'
import { SubscriptionSettings } from '@/components/settings/subscription-settings'
import { TeamManagement } from '@/components/settings/team-management'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, CreditCard, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const activeTab = params.tab || 'profile'

  const tabs = [
    { id: 'profile', label: 'Profile', href: '/settings?tab=profile', icon: User },
    { id: 'subscription', label: 'Subscription', href: '/settings?tab=subscription', icon: CreditCard },
    { id: 'team', label: 'Team', href: '/settings?tab=team', icon: Users },
  ]

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-64 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'subscription' && <SubscriptionSettings />}
          {activeTab === 'team' && <TeamManagement />}
        </div>
      </div>
    </div>
  )
}
