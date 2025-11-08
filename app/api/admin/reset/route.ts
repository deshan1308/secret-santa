import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Log reset action
    await supabase.from('audit_logs').insert({
      participant_id: null,
      action: 'reset',
      number: null,
    })

    // Clear all assignments
    const { error: deleteAssignmentsError } = await supabase
      .from('assignments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteAssignmentsError) {
      throw deleteAssignmentsError
    }

    // Clear assigned numbers from participants
    const { error: updateParticipantsError } = await supabase
      .from('participants')
      .update({ assigned_number: null })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

    if (updateParticipantsError) {
      throw updateParticipantsError
    }

    return NextResponse.json(
      { message: 'All assignments have been reset' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to reset assignments' },
      { status: 500 }
    )
  }
}

