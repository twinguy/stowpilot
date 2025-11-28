import { create } from 'zustand'
import { type Unit, type UnitFilters } from '@/types'

interface UnitState {
  units: Unit[]
  currentUnit: Unit | null
  filters: UnitFilters
  isLoading: boolean
  error: string | null
  setUnits: (units: Unit[]) => void
  setCurrentUnit: (unit: Unit | null) => void
  setFilters: (filters: UnitFilters) => void
  addUnit: (unit: Unit) => void
  updateUnit: (id: string, unit: Partial<Unit>) => void
  removeUnit: (id: string) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearFilters: () => void
}

export const useUnitStore = create<UnitState>((set) => ({
  units: [],
  currentUnit: null,
  filters: {},
  isLoading: false,
  error: null,
  setUnits: (units) => set({ units }),
  setCurrentUnit: (unit) => set({ currentUnit: unit }),
  setFilters: (filters) => set({ filters }),
  addUnit: (unit) => set((state) => ({ units: [...state.units, unit] })),
  updateUnit: (id, updates) =>
    set((state) => ({
      units: state.units.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      currentUnit:
        state.currentUnit?.id === id ? { ...state.currentUnit, ...updates } : state.currentUnit,
    })),
  removeUnit: (id) =>
    set((state) => ({
      units: state.units.filter((u) => u.id !== id),
      currentUnit: state.currentUnit?.id === id ? null : state.currentUnit,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearFilters: () => set({ filters: {} }),
}))
