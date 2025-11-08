import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Participant {
  id: string
  name: string
  employee_id: string
  assigned_number: number | null
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  participant_id: string
  number: number
  created_at: string
  participant?: Participant
}

export interface AuditLog {
  id: string
  participant_id: string
  action: 'assigned' | 'reassigned' | 'reset'
  number: number | null
  created_at: string
  participant?: Participant
}

