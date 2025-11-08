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
      console.error('Error fetching participants:', error)
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

    // Log for debugging
    console.log('Admin assignments fetch:', {
      participantsCount: participants?.length || 0,
      assignmentsCount: assignments?.length || 0,
      participants: participants?.map(p => ({ id: p.id, name: p.name, number: p.assigned_number })) || []
    })

    // If there's a mismatch, log it but still return participants
    if (participants && assignments) {
      const participantNumbers = new Set(participants.map(p => p.assigned_number).filter(n => n !== null))
      const assignmentNumbers = new Set(assignments.map(a => a.number))
      
      if (participantNumbers.size !== assignmentNumbers.size) {
        console.warn('Mismatch detected:', {
          participantNumbers: Array.from(participantNumbers),
          assignmentNumbers: Array.from(assignmentNumbers)
        })
      }
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

