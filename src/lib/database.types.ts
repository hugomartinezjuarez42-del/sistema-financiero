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
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          id_number: string | null
          nickname: string | null
          rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          id_number?: string | null
          nickname?: string | null
          rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          id_number?: string | null
          nickname?: string | null
          rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          amount: number
          interest_rate: number
          payment_frequency_days: number
          loan_date: string
          unpaid_interest: number
          status: 'active' | 'paid' | 'overdue' | 'cancelled' | 'refinanced'
          collateral_type: 'vehicle' | 'property' | 'jewelry' | 'electronics' | 'other' | 'none'
          collateral_description: string
          collateral_value: number
          collateral_notes: string
          due_date: string | null
          days_overdue: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          amount: number
          interest_rate?: number
          payment_frequency_days?: number
          loan_date: string
          unpaid_interest?: number
          status?: 'active' | 'paid' | 'overdue' | 'cancelled' | 'refinanced'
          collateral_type?: 'vehicle' | 'property' | 'jewelry' | 'electronics' | 'other' | 'none'
          collateral_description?: string
          collateral_value?: number
          collateral_notes?: string
          due_date?: string | null
          days_overdue?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          amount?: number
          interest_rate?: number
          payment_frequency_days?: number
          loan_date?: string
          unpaid_interest?: number
          status?: 'active' | 'paid' | 'overdue' | 'cancelled' | 'refinanced'
          collateral_type?: 'vehicle' | 'property' | 'jewelry' | 'electronics' | 'other' | 'none'
          collateral_description?: string
          collateral_value?: number
          collateral_notes?: string
          due_date?: string | null
          days_overdue?: number
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          loan_id: string
          payment_type: 'capital' | 'interest'
          amount: number
          payment_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          loan_id: string
          payment_type: 'capital' | 'interest'
          amount: number
          payment_date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          payment_type?: 'capital' | 'interest'
          amount?: number
          payment_date?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}
