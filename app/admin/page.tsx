'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Participant {
  id: string
  name: string
  employee_id: string
  assigned_number: number | null
  created_at: string
  updated_at: string
}

interface AuditLog {
  id: string
  participant_id: string | null
  action: 'assigned' | 'reassigned' | 'reset'
  number: number | null
  created_at: string
  participant?: Participant | null
}

export default function AdminPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [activeTab, setActiveTab] = useState<'assignments' | 'logs'>('assignments')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [assignmentsRes, logsRes] = await Promise.all([
        fetch('/api/admin/assignments'),
        fetch('/api/admin/audit-logs'),
      ])

      const assignmentsData = await assignmentsRes.json()
      const logsData = await logsRes.json()

      setParticipants(assignmentsData.participants || [])
      setAuditLogs(logsData.logs || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all assignments? This action cannot be undone.')) {
      return
    }

    setIsResetting(true)
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reset assignments')
      }

      await fetchData()
      alert('All assignments have been reset successfully!')
    } catch (err) {
      alert('Failed to reset assignments. Please try again.')
      console.error('Error resetting:', err)
    } finally {
      setIsResetting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Admin Panel
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage assignments and track activity
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/"
                className="px-4 py-2 text-primary-600 dark:text-primary-400 hover:underline"
              >
                ← Back to Wheel
              </Link>
              <motion.button
                onClick={handleReset}
                disabled={isResetting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isResetting ? 'Resetting...' : 'Reset All'}
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                activeTab === 'assignments'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Assignments ({participants.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                activeTab === 'logs'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Audit Logs ({auditLogs.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <svg
                className="animate-spin h-12 w-12 text-primary-600 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          ) : activeTab === 'assignments' ? (
            <div className="overflow-x-auto">
              {participants.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No assignments yet. Participants will appear here after they spin the wheel.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Number
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Employee ID
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Assigned At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant, index) => (
                      <motion.tr
                        key={participant.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-bold">
                            {participant.assigned_number}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-900 dark:text-gray-100">
                          {participant.name}
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                          {participant.employee_id}
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm">
                          {formatDate(participant.updated_at)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No audit logs yet.
                </div>
              ) : (
                auditLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            log.action === 'assigned'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : log.action === 'reassigned'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {log.action.toUpperCase()}
                        </span>
                        <div>
                          <p className="text-gray-900 dark:text-gray-100 font-medium">
                            {log.participant
                              ? `${log.participant.name} (${log.participant.employee_id})`
                              : 'System'}
                          </p>
                          {log.number && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Number: <span className="font-semibold">{log.number}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-500">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

