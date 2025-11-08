import { NextRequest, NextResponse } from 'next/server'
import { supabase, checkSupabaseEnv } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const envCheck = checkSupabaseEnv()
  if (!envCheck.isValid) {
    return NextResponse.json(
      { error: envCheck.error },
      { status: 500 }
    )
  }

  try {
    // Step 1: Get all assignments to delete
    const { data: allAssignments, error: fetchAssignmentsError } = await supabase
      .from('assignments')
      .select('id')
    
    if (fetchAssignmentsError) {
      throw new Error(`Failed to fetch assignments: ${fetchAssignmentsError.message}`)
    }

    // Step 2: Get all participants with assigned numbers
    const { data: participantsWithNumbers, error: fetchParticipantsError } = await supabase
      .from('participants')
      .select('id, assigned_number')
      .not('assigned_number', 'is', null)

    if (fetchParticipantsError) {
      throw new Error(`Failed to fetch participants: ${fetchParticipantsError.message}`)
    }

    // Step 3: Delete all assignments using batch delete with .in()
    if (allAssignments && allAssignments.length > 0) {
      const assignmentIds = allAssignments.map(a => a.id)
      
      // Delete in batches of 100 (Supabase limit)
      const batchSize = 100
      for (let i = 0; i < assignmentIds.length; i += batchSize) {
        const batch = assignmentIds.slice(i, i + batchSize)
        const { error: deleteError } = await supabase
          .from('assignments')
          .delete()
          .in('id', batch)
        
        if (deleteError) {
          throw new Error(`Failed to delete assignments batch: ${deleteError.message}`)
        }
      }
    }

    // Step 4: Clear assigned numbers from all participants using batch update
    if (participantsWithNumbers && participantsWithNumbers.length > 0) {
      const participantIds = participantsWithNumbers.map(p => p.id)
      
      // Update in batches of 100
      const batchSize = 100
      for (let i = 0; i < participantIds.length; i += batchSize) {
        const batch = participantIds.slice(i, i + batchSize)
        const { error: updateError } = await supabase
          .from('participants')
          .update({ assigned_number: null })
          .in('id', batch)
        
        if (updateError) {
          throw new Error(`Failed to update participants batch: ${updateError.message}`)
        }
      }
    }

    // Step 5: Log reset action
    const { error: logError } = await supabase.from('audit_logs').insert({
      participant_id: null,
      action: 'reset',
      number: null,
    })

    if (logError) {
      console.warn('Failed to log reset action:', logError.message)
      // Don't throw here, as the reset was successful
    }

    // Step 6: Verify the reset was successful
    const { data: remainingAssignments, error: verifyAssignmentsError } = await supabase
      .from('assignments')
      .select('id')
      .limit(1)

    if (verifyAssignmentsError) {
      console.warn('Could not verify assignments deletion:', verifyAssignmentsError.message)
    } else if (remainingAssignments && remainingAssignments.length > 0) {
      throw new Error('Some assignments were not deleted. Please try again.')
    }

    const { data: remainingParticipants, error: verifyParticipantsError } = await supabase
      .from('participants')
      .select('id, assigned_number')
      .not('assigned_number', 'is', null)
      .limit(1)

    if (verifyParticipantsError) {
      console.warn('Could not verify participants reset:', verifyParticipantsError.message)
    } else if (remainingParticipants && remainingParticipants.length > 0) {
      throw new Error('Some participants still have assigned numbers. Please try again.')
    }

    return NextResponse.json(
      { 
        message: 'All assignments have been reset successfully',
        deletedAssignments: allAssignments?.length || 0,
        resetParticipants: participantsWithNumbers?.length || 0
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Reset error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reset assignments' },
      { status: 500 }
    )
  }
}

