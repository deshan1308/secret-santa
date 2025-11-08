import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Provide dummy values for build time
    // Runtime errors will be handled by API routes
    supabaseClient = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    )
    return supabaseClient
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

export function checkSupabaseEnv(): { isValid: boolean; error?: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      isValid: false,
      error: 'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
    }
  }

  return { isValid: true }
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

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

