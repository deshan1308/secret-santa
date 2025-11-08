import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { participantId, number } = await request.json()

    if (!participantId || number === undefined) {
      return NextResponse.json(
        { error: 'Participant ID and number are required' },
        { status: 400 }
      )
    }

    // Check if number is already assigned
    const { data: existingAssignment } = await supabase
      .from('assignments')
      .select('*')
      .eq('number', number)
      .single()

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Number is already assigned' },
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
      await supabase.from('audit_logs').insert({
        participant_id: participantId,
        action: 'reassigned',
        number: number,
      })

      // Remove old assignment
      await supabase
        .from('assignments')
        .delete()
        .eq('number', participant.assigned_number)
    } else {
      // Log as new assignment
      await supabase.from('audit_logs').insert({
        participant_id: participantId,
        action: 'assigned',
        number: number,
      })
    }

    // Update participant
    const { data: updatedParticipant, error: updateError } = await supabase
      .from('participants')
      .update({ assigned_number: number })
      .eq('id', participantId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Create assignment
    const { error: assignError } = await supabase
      .from('assignments')
      .insert({
        participant_id: participantId,
        number: number,
      })

    if (assignError) {
      throw assignError
    }

    return NextResponse.json(
      { participant: updatedParticipant },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to assign number' },
      { status: 500 }
    )
  }
}

