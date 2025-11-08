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
    // Fetch participants with assigned numbers, ordered by assignment time
    const { data: participants, error } = await supabase
      .from('participants')
      .select('*')
      .not('assigned_number', 'is', null)
      .order('updated_at', { ascending: false }) // Order by most recently updated first

    if (error) {
      console.error('Error fetching assignments:', error)
      throw error
    }

    // Also verify assignments table matches
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('number, participant_id, created_at')
      .order('created_at', { ascending: false })

    if (assignmentsError) {
      console.error('Error fetching assignments table:', assignmentsError)
    }

    return NextResponse.json({ 
      participants: participants || [],
      assignmentsCount: assignments?.length || 0,
      timestamp: new Date().toISOString()
    }, { status: 200 })
  } catch (error: any) {
    console.error('Failed to fetch assignments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

