import { NextResponse } from 'next/server'
import { supabase, checkSupabaseEnv } from '@/lib/supabase'

// Define the range of available numbers (1-100)
const TOTAL_NUMBERS = 100

export async function GET() {
  const envCheck = checkSupabaseEnv()
  if (!envCheck.isValid) {
    return NextResponse.json(
      { error: envCheck.error, available: [], total: TOTAL_NUMBERS, assigned: 0 },
      { status: 500 }
    )
  }

  try {
    // Get all assigned numbers
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('number')

    if (error) {
      throw error
    }

    const assignedNumbers = new Set(
      assignments?.map((a) => a.number) || []
    )

    // Generate available numbers
    const availableNumbers: number[] = []
    for (let i = 1; i <= TOTAL_NUMBERS; i++) {
      if (!assignedNumbers.has(i)) {
        availableNumbers.push(i)
      }
    }

    return NextResponse.json(
      {
        available: availableNumbers,
        total: TOTAL_NUMBERS,
        assigned: assignedNumbers.size,
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch available numbers' },
      { status: 500 }
    )
  }
}

