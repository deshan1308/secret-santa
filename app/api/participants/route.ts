import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { name, employeeId } = await request.json()

    if (!name || !employeeId) {
      return NextResponse.json(
        { error: 'Name and Employee ID are required' },
        { status: 400 }
      )
    }

    // Check if employee ID already exists
    const { data: existing } = await supabase
      .from('participants')
      .select('*')
      .eq('employee_id', employeeId)
      .single()

    if (existing) {
      return NextResponse.json(
        { 
          error: 'Employee ID already exists',
          participant: existing,
          hasNumber: existing.assigned_number !== null
        },
        { status: 409 }
      )
    }

    // Create new participant
    const { data, error } = await supabase
      .from('participants')
      .insert({
        name,
        employee_id: employeeId,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ participant: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create participant' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id')

    if (employeeId) {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('employee_id', employeeId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ participant: null }, { status: 200 })
        }
        throw error
      }

      return NextResponse.json({ participant: data }, { status: 200 })
    }

    // Get all participants
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ participants: data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch participants' },
      { status: 500 }
    )
  }
}

