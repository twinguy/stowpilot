'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { profileUpdateSchema, type ProfileUpdateFormData } from '@/lib/validations/auth'
import { useUserStore } from '@/lib/stores/user-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ProfileSettings() {
  const { profile, setProfile } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      business_name: profile?.business_name || '',
      phone: profile?.phone || '',
    },
  })

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        business_name: profile.business_name || '',
        phone: profile.phone || '',
      })
    }
  }, [profile, form])

  const onSubmit = async (data: ProfileUpdateFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to update your profile')
        setIsLoading(false)
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          business_name: data.business_name || null,
          phone: data.phone || null,
        })
        .eq('id', user.id)

      if (updateError) {
        setError(updateError.message)
        setIsLoading(false)
        return
      }

      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          ...data,
        })
      }

      setSuccess(true)
      setIsLoading(false)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your personal information and business details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
                Profile updated successfully
              </div>
            )}

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Storage Business" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional: The name of your storage business
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional: Your contact phone number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

