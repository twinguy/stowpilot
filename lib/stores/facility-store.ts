import { create } from 'zustand'
import { type Facility, type FacilityFilters } from '@/types'

interface FacilityState {
  facilities: Facility[]
  currentFacility: Facility | null
  filters: FacilityFilters
  isLoading: boolean
  error: string | null
  setFacilities: (facilities: Facility[]) => void
  setCurrentFacility: (facility: Facility | null) => void
  setFilters: (filters: FacilityFilters) => void
  addFacility: (facility: Facility) => void
  updateFacility: (id: string, facility: Partial<Facility>) => void
  removeFacility: (id: string) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearFilters: () => void
}

export const useFacilityStore = create<FacilityState>((set) => ({
  facilities: [],
  currentFacility: null,
  filters: {},
  isLoading: false,
  error: null,
  setFacilities: (facilities) => set({ facilities }),
  setCurrentFacility: (facility) => set({ currentFacility: facility }),
  setFilters: (filters) => set({ filters }),
  addFacility: (facility) =>
    set((state) => ({ facilities: [...state.facilities, facility] })),
  updateFacility: (id, updates) =>
    set((state) => ({
      facilities: state.facilities.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      currentFacility:
        state.currentFacility?.id === id
          ? { ...state.currentFacility, ...updates }
          : state.currentFacility,
    })),
  removeFacility: (id) =>
    set((state) => ({
      facilities: state.facilities.filter((f) => f.id !== id),
      currentFacility: state.currentFacility?.id === id ? null : state.currentFacility,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearFilters: () => set({ filters: {} }),
}))
