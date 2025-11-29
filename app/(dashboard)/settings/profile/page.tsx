import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileSettings } from '@/components/settings/profile-settings'
import { PasswordChangeForm } from '@/components/settings/password-change-form'

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Update your personal information and business details</p>
      </div>

      <ProfileSettings />
      
      <PasswordChangeForm />
    </div>
  )
}
