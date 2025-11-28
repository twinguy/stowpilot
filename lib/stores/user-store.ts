import { create } from 'zustand'
import { type Profile, type UserRole, type SubscriptionTier } from '@/types'

interface UserState {
  user: {
    id: string
    email: string
    role: UserRole
  } | null
  profile: Profile | null
  subscription: {
    tier: SubscriptionTier
    status: string
  } | null
  permissions: string[]
  setUser: (user: { id: string; email: string; role: UserRole } | null) => void
  setProfile: (profile: Profile | null) => void
  setSubscription: (subscription: { tier: SubscriptionTier; status: string } | null) => void
  setPermissions: (permissions: string[]) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  profile: null,
  subscription: null,
  permissions: [],
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSubscription: (subscription) => set({ subscription }),
  setPermissions: (permissions) => set({ permissions }),
  clearUser: () => set({
    user: null,
    profile: null,
    subscription: null,
    permissions: [],
  }),
}))

