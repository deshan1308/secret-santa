'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import NameForm from '@/components/NameForm'
import SpinWheel from '@/components/SpinWheel'
import AssignedResult from '@/components/AssignedResult'
import Link from 'next/link'

interface Participant {
  id: string
  name: string
  employee_id: string
  assigned_number: number | null
  created_at: string
  updated_at: string
}

export default function Home() {
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [assignedNumber, setAssignedNumber] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if user already has a session
    const storedEmployeeId = sessionStorage.getItem('employeeId')
    if (storedEmployeeId) {
      fetchParticipant(storedEmployeeId)
    }
    fetchAvailableNumbers()
  }, [])

  const fetchParticipant = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/participants?employee_id=${employeeId}`)
      const data = await response.json()
      if (data.participant) {
        setParticipant(data.participant)
        if (data.participant.assigned_number) {
          setAssignedNumber(data.participant.assigned_number)
        }
      }
    } catch (err) {
      console.error('Error fetching participant:', err)
    }
  }

  const fetchAvailableNumbers = async () => {
    try {
      const response = await fetch('/api/available-numbers')
      const data = await response.json()
      setAvailableNumbers(data.available || [])
    } catch (err) {
      console.error('Error fetching available numbers:', err)
    }
  }

  const handleFormSubmit = async (name: string, employeeId: string) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, employeeId }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409 && data.participant) {
          // Employee ID already exists
          setParticipant(data.participant)
          if (data.participant.assigned_number) {
            setAssignedNumber(data.participant.assigned_number)
          } else {
            setError('You already have an account. You can spin now!')
          }
        } else {
          setError(data.error || 'Failed to submit. Please try again.')
        }
        setIsLoading(false)
        return
      }

      setParticipant(data.participant)
      sessionStorage.setItem('employeeId', employeeId)
      setIsLoading(false)
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
      setIsLoading(false)
    }
  }

  const handleSpinStart = () => {
    setIsSpinning(true)
    setError('')
  }

  const handleSpinComplete = async (number: number) => {
    if (!participant) return

    setIsSpinning(false)
    setIsLoading(true)

    try {
      const response = await fetch('/api/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: participant.id,
          number,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to assign number. Please try again.'
        console.error('Assignment error:', errorMsg, data)
        setError(errorMsg)
        setIsLoading(false)
        // Refresh available numbers
        fetchAvailableNumbers()
        return
      }

      // Verify we got the participant data back
      if (!data.participant) {
        console.error('No participant data returned from assignment')
        setError('Assignment completed but data was not returned. Please refresh the page.')
        setIsLoading(false)
        fetchAvailableNumbers()
        return
      }

      console.log('Assignment successful:', {
        number,
        participantId: data.participant.id,
        assignment: data.assignment
      })

      setAssignedNumber(number)
      setParticipant(data.participant)
      setIsLoading(false)
      // Refresh available numbers immediately to remove assigned number from wheel
      fetchAvailableNumbers()
    } catch (err: any) {
      console.error('Network error during assignment:', err)
      setError(`Network error: ${err.message || 'Please check your connection and try again.'}`)
      setIsLoading(false)
      fetchAvailableNumbers()
    }
  }

  const handleReset = () => {
    sessionStorage.removeItem('employeeId')
    setParticipant(null)
    setAssignedNumber(null)
    setError('')
    fetchAvailableNumbers()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            🎄 Secret Santa
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Spin the wheel to get your unique number!
          </p>
          <Link
            href="/admin/login"
            className="inline-block mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Admin Panel →
          </Link>
        </motion.header>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200"
            >
              {error}
            </motion.div>
          )}

          {assignedNumber !== null && participant ? (
            <AssignedResult
              number={assignedNumber}
              name={participant.name}
              canSpinAgain={false}
            />
          ) : participant && !isSpinning ? (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Welcome, {participant.name}!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Ready to spin? Click the button below!
                </p>
              </div>
              <SpinWheel
                availableNumbers={availableNumbers}
                onSpinComplete={handleSpinComplete}
                isSpinning={isSpinning}
                onSpinStart={handleSpinStart}
              />
              <div className="text-center">
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
                >
                  Use a different account
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <NameForm onSubmit={handleFormSubmit} isLoading={isLoading} />
              {participant && isSpinning && (
                <SpinWheel
                  availableNumbers={availableNumbers}
                  onSpinComplete={handleSpinComplete}
                  isSpinning={isSpinning}
                  onSpinStart={handleSpinStart}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <p>Have fun and happy holidays! 🎅</p>
        </motion.footer>
      </div>
    </main>
  )
}

