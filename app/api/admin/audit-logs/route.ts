import { NextResponse } from 'next/server'
import { supabase, checkSupabaseEnv } from '@/lib/supabase'

export async function GET() {
  const envCheck = checkSupabaseEnv()
  if (!envCheck.isValid) {
    return NextResponse.json(
      { error: envCheck.error },
      { status: 500 }
    )
  }

  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        participant:participants(*)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      throw error
    }

    return NextResponse.json({ logs }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

