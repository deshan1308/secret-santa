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
    const { data: participants, error } = await supabase
      .from('participants')
      .select('*')
      .not('assigned_number', 'is', null)
      .order('assigned_number', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ participants }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

