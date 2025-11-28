import { create } from 'zustand'
import { type Customer, type CustomerFilters } from '@/types'

interface CustomerState {
  customers: Customer[]
  currentCustomer: Customer | null
  filters: CustomerFilters
  isLoading: boolean
  error: string | null
  setCustomers: (customers: Customer[]) => void
  setCurrentCustomer: (customer: Customer | null) => void
  setFilters: (filters: CustomerFilters) => void
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, customer: Partial<Customer>) => void
  removeCustomer: (id: string) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearFilters: () => void
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  currentCustomer: null,
  filters: {},
  isLoading: false,
  error: null,
  setCustomers: (customers) => set({ customers }),
  setCurrentCustomer: (customer) => set({ currentCustomer: customer }),
  setFilters: (filters) => set({ filters }),
  addCustomer: (customer) =>
    set((state) => ({ customers: [...state.customers, customer] })),
  updateCustomer: (id, updates) =>
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      currentCustomer:
        state.currentCustomer?.id === id
          ? { ...state.currentCustomer, ...updates }
          : state.currentCustomer,
    })),
  removeCustomer: (id) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
      currentCustomer: state.currentCustomer?.id === id ? null : state.currentCustomer,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearFilters: () => set({ filters: {} }),
}))
