// Database types - these should be generated from Supabase CLI
// For now, defining the essential types based on the schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          business_name: string | null
          phone: string | null
          role: 'owner' | 'manager' | 'staff'
          subscription_tier: 'free' | 'pro' | 'enterprise'
          subscription_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          business_name?: string | null
          phone?: string | null
          role?: 'owner' | 'manager' | 'staff'
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          business_name?: string | null
          phone?: string | null
          role?: 'owner' | 'manager' | 'staff'
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          owner_id: string
          email: string
          full_name: string | null
          role: 'manager' | 'staff'
          permissions: Json
          invited_at: string
          joined_at: string | null
          status: 'pending' | 'active' | 'inactive'
        }
        Insert: {
          id?: string
          owner_id: string
          email: string
          full_name?: string | null
          role?: 'manager' | 'staff'
          permissions?: Json
          invited_at?: string
          joined_at?: string | null
          status?: 'pending' | 'active' | 'inactive'
        }
        Update: {
          id?: string
          owner_id?: string
          email?: string
          full_name?: string | null
          role?: 'manager' | 'staff'
          permissions?: Json
          invited_at?: string
          joined_at?: string | null
          status?: 'pending' | 'active' | 'inactive'
        }
      }
      facilities: {
        Row: {
          id: string
          owner_id: string
          name: string
          address: Json
          total_units: number
          amenities: Json
          contact_info: Json | null
          operating_hours: Json | null
          photos: Json
          notes: string | null
          status: 'active' | 'inactive' | 'maintenance'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          address: Json
          total_units?: number
          amenities?: Json
          contact_info?: Json | null
          operating_hours?: Json | null
          photos?: Json
          notes?: string | null
          status?: 'active' | 'inactive' | 'maintenance'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          address?: Json
          total_units?: number
          amenities?: Json
          contact_info?: Json | null
          operating_hours?: Json | null
          photos?: Json
          notes?: string | null
          status?: 'active' | 'inactive' | 'maintenance'
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          facility_id: string
          unit_number: string
          size: Json
          type: 'standard' | 'climate_controlled' | 'outdoor' | 'vehicle'
          floor_level: number
          features: Json
          monthly_rate: number
          status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'out_of_service'
          photos: Json
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          facility_id: string
          unit_number: string
          size: Json
          type?: 'standard' | 'climate_controlled' | 'outdoor' | 'vehicle'
          floor_level?: number
          features?: Json
          monthly_rate: number
          status?: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'out_of_service'
          photos?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          facility_id?: string
          unit_number?: string
          size?: Json
          type?: 'standard' | 'climate_controlled' | 'outdoor' | 'vehicle'
          floor_level?: number
          features?: Json
          monthly_rate?: number
          status?: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'out_of_service'
          photos?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          customer_id: string
          rental_id: string | null
          invoice_number: string
          period_start: string
          period_end: string
          amount_due: number
          amount_paid: number
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date: string
          paid_at: string | null
          payment_method_id: string | null
          stripe_invoice_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          rental_id?: string | null
          invoice_number: string
          period_start: string
          period_end: string
          amount_due: number
          amount_paid?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date: string
          paid_at?: string | null
          payment_method_id?: string | null
          stripe_invoice_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          rental_id?: string | null
          invoice_number?: string
          period_start?: string
          period_end?: string
          amount_due?: number
          amount_paid?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date?: string
          paid_at?: string | null
          payment_method_id?: string | null
          stripe_invoice_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'owner' | 'manager' | 'staff'
      subscription_tier: 'free' | 'pro' | 'enterprise'
    }
  }
}

// Application types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type TeamMember = Database['public']['Tables']['team_members']['Row']
export type FacilityRow = Database['public']['Tables']['facilities']['Row']
export type UnitRow = Database['public']['Tables']['units']['Row']

