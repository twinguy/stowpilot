import { create } from 'zustand'
import { type Rental, type RentalFilters } from '@/types'

interface RentalState {
  rentals: Rental[]
  currentRental: Rental | null
  filters: RentalFilters
  isLoading: boolean
  error: string | null
  setRentals: (rentals: Rental[]) => void
  setCurrentRental: (rental: Rental | null) => void
  setFilters: (filters: RentalFilters) => void
  addRental: (rental: Rental) => void
  updateRental: (id: string, rental: Partial<Rental>) => void
  removeRental: (id: string) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearFilters: () => void
}

export const useRentalStore = create<RentalState>((set) => ({
  rentals: [],
  currentRental: null,
  filters: {},
  isLoading: false,
  error: null,
  setRentals: (rentals) => set({ rentals }),
  setCurrentRental: (rental) => set({ currentRental: rental }),
  setFilters: (filters) => set({ filters }),
  addRental: (rental) =>
    set((state) => ({ rentals: [...state.rentals, rental] })),
  updateRental: (id, updates) =>
    set((state) => ({
      rentals: state.rentals.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      currentRental:
        state.currentRental?.id === id
          ? { ...state.currentRental, ...updates }
          : state.currentRental,
    })),
  removeRental: (id) =>
    set((state) => ({
      rentals: state.rentals.filter((r) => r.id !== id),
      currentRental: state.currentRental?.id === id ? null : state.currentRental,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearFilters: () => set({ filters: {} }),
}))
