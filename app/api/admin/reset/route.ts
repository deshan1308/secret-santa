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
    console.log('Starting reset process...')
    
    // Step 1: Get all assignments to delete
    const { data: allAssignments, error: fetchAssignmentsError } = await supabase
      .from('assignments')
      .select('id, number')
    
    if (fetchAssignmentsError) {
      console.error('Error fetching assignments:', fetchAssignmentsError)
      throw new Error(`Failed to fetch assignments: ${fetchAssignmentsError.message}`)
    }

    console.log(`Found ${allAssignments?.length || 0} assignments to delete`)

    // Step 2: Get all participants with assigned numbers
    const { data: participantsWithNumbers, error: fetchParticipantsError } = await supabase
      .from('participants')
      .select('id, assigned_number')
      .not('assigned_number', 'is', null)

    if (fetchParticipantsError) {
      console.error('Error fetching participants:', fetchParticipantsError)
      throw new Error(`Failed to fetch participants: ${fetchParticipantsError.message}`)
    }

    console.log(`Found ${participantsWithNumbers?.length || 0} participants to reset`)

    // Step 3: Delete all assignments - try multiple approaches
    let deletedCount = 0
    if (allAssignments && allAssignments.length > 0) {
      // First try: Delete by number (more reliable than ID)
      const numbers = allAssignments.map(a => a.number)
      const batchSize = 100
      
      for (let i = 0; i < numbers.length; i += batchSize) {
        const batch = numbers.slice(i, i + batchSize)
        const { data: deleted, error: deleteError } = await supabase
          .from('assignments')
          .delete()
          .in('number', batch)
          .select()
        
        if (deleteError) {
          console.error(`Error deleting batch ${i / batchSize + 1}:`, deleteError)
          // Try individual deletes as fallback
          for (const number of batch) {
            const { error: individualError } = await supabase
              .from('assignments')
              .delete()
              .eq('number', number)
            
            if (individualError) {
              console.error(`Error deleting assignment ${number}:`, individualError)
            } else {
              deletedCount++
            }
          }
        } else {
          deletedCount += deleted?.length || 0
        }
      }
      
      console.log(`Deleted ${deletedCount} assignments`)
    }

    // Step 4: Clear assigned numbers from all participants
    let updatedCount = 0
    if (participantsWithNumbers && participantsWithNumbers.length > 0) {
      // Try updating all at once first
      const { data: updated, error: updateAllError } = await supabase
        .from('participants')
        .update({ assigned_number: null })
        .not('assigned_number', 'is', null)
        .select()
      
      if (updateAllError) {
        console.warn('Bulk update failed, trying batch updates:', updateAllError)
        // Fallback to batch updates
        const participantIds = participantsWithNumbers.map(p => p.id)
        const batchSize = 100
        
        for (let i = 0; i < participantIds.length; i += batchSize) {
          const batch = participantIds.slice(i, i + batchSize)
          const { data: batchUpdated, error: updateError } = await supabase
            .from('participants')
            .update({ assigned_number: null })
            .in('id', batch)
            .select()
          
          if (updateError) {
            console.error(`Error updating batch ${i / batchSize + 1}:`, updateError)
            // Try individual updates as fallback
            for (const id of batch) {
              const { error: individualError } = await supabase
                .from('participants')
                .update({ assigned_number: null })
                .eq('id', id)
              
              if (individualError) {
                console.error(`Error updating participant ${id}:`, individualError)
              } else {
                updatedCount++
              }
            }
          } else {
            updatedCount += batchUpdated?.length || 0
          }
        }
      } else {
        updatedCount = updated?.length || 0
      }
      
      console.log(`Updated ${updatedCount} participants`)
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

    // Step 6: Verify the reset was successful (with retry)
    let remainingAssignments: any[] = []
    let remainingParticipants: any[] = []
    
    // Wait a bit for database to sync
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Check assignments
    const { data: verifyAssignments, error: verifyAssignmentsError } = await supabase
      .from('assignments')
      .select('id, number')
      .limit(100)

    if (verifyAssignmentsError) {
      console.warn('Could not verify assignments deletion:', verifyAssignmentsError.message)
    } else {
      remainingAssignments = verifyAssignments || []
    }

    // Check participants
    const { data: verifyParticipants, error: verifyParticipantsError } = await supabase
      .from('participants')
      .select('id, assigned_number')
      .not('assigned_number', 'is', null)
      .limit(100)

    if (verifyParticipantsError) {
      console.warn('Could not verify participants reset:', verifyParticipantsError.message)
    } else {
      remainingParticipants = verifyParticipants || []
    }

    // If there are remaining items, try to clean them up
    if (remainingAssignments.length > 0) {
      console.warn(`Found ${remainingAssignments.length} remaining assignments, attempting cleanup...`)
      for (const assignment of remainingAssignments) {
        await supabase.from('assignments').delete().eq('id', assignment.id)
      }
    }

    if (remainingParticipants.length > 0) {
      console.warn(`Found ${remainingParticipants.length} remaining participants, attempting cleanup...`)
      for (const participant of remainingParticipants) {
        await supabase.from('participants').update({ assigned_number: null }).eq('id', participant.id)
      }
    }

    console.log('Reset process completed:', {
      deletedAssignments: deletedCount,
      resetParticipants: updatedCount,
      remainingAssignments: remainingAssignments.length,
      remainingParticipants: remainingParticipants.length
    })

    return NextResponse.json(
      { 
        message: 'All assignments have been reset successfully',
        deletedAssignments: deletedCount,
        resetParticipants: updatedCount,
        remainingAssignments: remainingAssignments.length,
        remainingParticipants: remainingParticipants.length
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

