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
    // First, get all assignments to see what exists
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('number, participant_id, created_at')
      .order('created_at', { ascending: false })

    if (assignmentsError) {
      console.error('Error fetching assignments table:', assignmentsError)
    }

    console.log(`Found ${assignments?.length || 0} assignments in assignments table`)

    // Fetch participants with assigned numbers, ordered by assignment time
    const { data: participants, error } = await supabase
      .from('participants')
      .select('*')
      .not('assigned_number', 'is', null)
      .order('updated_at', { ascending: false }) // Order by most recently updated first

    if (error) {
      console.error('Error fetching participants:', error)
      // Don't throw - try to get participants from assignments if available
    }

    // If we have assignments but no participants, try to fetch participants by IDs
    let finalParticipants = participants || []
    
    // Always try to reconstruct from assignments if there's a mismatch
    if (assignments && assignments.length > 0) {
      const participantIds = assignments.map(a => a.participant_id).filter(id => id)
      
      if (participantIds.length > 0) {
        const { data: participantsByIds, error: fetchByIdError } = await supabase
          .from('participants')
          .select('*')
          .in('id', participantIds)
        
        if (!fetchByIdError && participantsByIds) {
          // Create a map of participant IDs to assignments
          const assignmentMap = new Map(assignments.map(a => [a.participant_id, a.number]))
          
          // Merge participants with their assignments
          const reconstructedParticipants = participantsByIds.map(p => {
            const assignedNumber = assignmentMap.get(p.id) || p.assigned_number
            return {
              ...p,
              assigned_number: assignedNumber
            }
          }).filter(p => p.assigned_number !== null && p.assigned_number !== undefined)
          
          // Use reconstructed if we have more than what we got from the query
          if (reconstructedParticipants.length > finalParticipants.length) {
            console.log(`Using reconstructed participants: ${reconstructedParticipants.length} vs ${finalParticipants.length}`)
            finalParticipants = reconstructedParticipants
          } else if (finalParticipants.length === 0 && reconstructedParticipants.length > 0) {
            console.log(`Reconstructed ${reconstructedParticipants.length} participants from assignments table`)
            finalParticipants = reconstructedParticipants
          }
        }
      }
    }

    // Log for debugging
    console.log('Admin assignments fetch:', {
      participantsCount: finalParticipants?.length || 0,
      assignmentsCount: assignments?.length || 0,
      participants: finalParticipants?.map(p => ({ id: p.id, name: p.name, number: p.assigned_number })) || []
    })

    // If there's a mismatch, log it but still return participants
    if (finalParticipants && assignments) {
      const participantNumbers = new Set(finalParticipants.map(p => p.assigned_number).filter(n => n !== null))
      const assignmentNumbers = new Set(assignments.map(a => a.number))
      
      if (participantNumbers.size !== assignmentNumbers.size) {
        console.warn('Mismatch detected:', {
          participantNumbers: Array.from(participantNumbers),
          assignmentNumbers: Array.from(assignmentNumbers),
          missingInParticipants: Array.from(assignmentNumbers).filter(n => !participantNumbers.has(n)),
          extraInParticipants: Array.from(participantNumbers).filter(n => !assignmentNumbers.has(n))
        })
      }
    }

    return NextResponse.json({ 
      participants: finalParticipants || [],
      assignmentsCount: assignments?.length || 0,
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('Failed to fetch assignments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

