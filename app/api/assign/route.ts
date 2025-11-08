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
    const { participantId, number } = await request.json()

    if (!participantId || number === undefined) {
      return NextResponse.json(
        { error: 'Participant ID and number are required' },
        { status: 400 }
      )
    }

    // Check if number is already assigned (with error handling)
    const { data: existingAssignment, error: checkError } = await supabase
      .from('assignments')
      .select('*')
      .eq('number', number)
      .maybeSingle()

    // If there's an error and it's not "not found", throw it
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingAssignment) {
      return NextResponse.json(
        { error: `Number ${number} is already assigned to another participant` },
        { status: 409 }
      )
    }

    // Get participant's current assignment
    const { data: participant } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single()

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    // If participant already has a number, log it as reassignment
    if (participant.assigned_number !== null) {
      // Remove old assignment first
      const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('number', participant.assigned_number)
      
      if (deleteError) {
        console.error('Error deleting old assignment:', deleteError)
        throw new Error(`Failed to remove old assignment: ${deleteError.message}`)
      }

      // Log as reassignment
      const { error: logError } = await supabase.from('audit_logs').insert({
        participant_id: participantId,
        action: 'reassigned',
        number: number,
      })
      
      if (logError) {
        console.error('Error logging reassignment:', logError)
        // Don't throw here, as the assignment is more important than the log
      }
    } else {
      // Log as new assignment
      const { error: logError } = await supabase.from('audit_logs').insert({
        participant_id: participantId,
        action: 'assigned',
        number: number,
      })
      
      if (logError) {
        console.error('Error logging assignment:', logError)
        // Don't throw here, as the assignment is more important than the log
      }
    }

    // Update participant
    const { data: updatedParticipant, error: updateError } = await supabase
      .from('participants')
      .update({ assigned_number: number })
      .eq('id', participantId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating participant:', updateError)
      throw new Error(`Failed to update participant: ${updateError.message}`)
    }

    if (!updatedParticipant) {
      throw new Error('Participant was not updated successfully')
    }

    // Verify the participant was updated correctly
    if (updatedParticipant.assigned_number !== number) {
      throw new Error(`Participant update mismatch: expected ${number}, got ${updatedParticipant.assigned_number}`)
    }

    // Create assignment
    const { data: newAssignment, error: assignError } = await supabase
      .from('assignments')
      .insert({
        participant_id: participantId,
        number: number,
      })
      .select()
      .single()

    if (assignError) {
      console.error('Error creating assignment:', assignError)
      // If assignment creation fails, try to rollback participant update
      await supabase
        .from('participants')
        .update({ assigned_number: participant.assigned_number })
        .eq('id', participantId)
      
      throw new Error(`Failed to create assignment: ${assignError.message}`)
    }

    // Verify the assignment was created
    if (!newAssignment) {
      throw new Error('Assignment was not created successfully')
    }

    // Double-check: Verify both participant and assignment exist
    const { data: verifyParticipant, error: verifyError } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single()

    if (verifyError || !verifyParticipant) {
      console.error('Verification error:', verifyError)
    } else if (verifyParticipant.assigned_number !== number) {
      console.error(`Verification mismatch: participant has ${verifyParticipant.assigned_number}, expected ${number}`)
    }

    const { data: verifyAssignment } = await supabase
      .from('assignments')
      .select('*')
      .eq('number', number)
      .single()

    if (!verifyAssignment) {
      console.error('Assignment verification failed: assignment not found after creation')
    }

    console.log('Assignment completed successfully:', {
      participantId,
      number,
      participantAssignedNumber: updatedParticipant.assigned_number,
      assignmentId: newAssignment.id
    })

    return NextResponse.json(
      { 
        participant: updatedParticipant,
        assignment: newAssignment,
        message: 'Number assigned successfully'
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to assign number' },
      { status: 500 }
    )
  }
}

