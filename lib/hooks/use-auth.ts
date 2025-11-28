'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user-store'
import type { Profile } from '@/types'

export function useAuth() {
  const { user, profile, setUser, setProfile, clearUser } = useUserStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            role: (session.user.user_metadata?.role as 'owner' | 'manager' | 'staff') || 'owner',
          })

          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileData) {
            setProfile(profileData as Profile)
          }
        } else {
          clearUser()
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        clearUser()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: (session.user.user_metadata?.role as 'owner' | 'manager' | 'staff') || 'owner',
        })

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileData) {
          setProfile(profileData as Profile)
        }
      } else if (event === 'SIGNED_OUT') {
        clearUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, clearUser])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearUser()
  }

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  }
}

