'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminLogin from '@/components/AdminLogin'

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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'assignments' | 'logs'>('assignments')
  const router = useRouter()

  const fetchData = async (showLoading = false) => {
    if (showLoading) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    try {
      // Add cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime()
      const [assignmentsRes, logsRes] = await Promise.all([
        fetch(`/api/admin/assignments?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }),
        fetch(`/api/admin/audit-logs?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }),
      ])

      const assignmentsData = await assignmentsRes.json()
      const logsData = await logsRes.json()

      if (assignmentsData.error) {
        console.error('Error fetching assignments:', assignmentsData.error)
        setParticipants([])
      } else {
        const participantsList = assignmentsData.participants || []
        console.log(`Admin Panel: Fetched ${participantsList.length} assignments at ${assignmentsData.timestamp || 'unknown time'}`)
        console.log('Participants data:', participantsList.map((p: Participant) => ({
          id: p.id,
          name: p.name,
          employee_id: p.employee_id,
          assigned_number: p.assigned_number,
          updated_at: p.updated_at
        })))
        
        // Verify we have valid participants
        const validParticipants = participantsList.filter((p: Participant) => 
          p && p.assigned_number !== null && p.assigned_number !== undefined
        )
        
        if (validParticipants.length !== participantsList.length) {
          console.warn(`Filtered out ${participantsList.length - validParticipants.length} invalid participants`)
        }
        
        setParticipants(validParticipants)
      }

      if (logsData.error) {
        console.error('Error fetching logs:', logsData.error)
        setAuditLogs([])
      } else {
        setAuditLogs(logsData.logs || [])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Check authentication
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const authenticated = sessionStorage.getItem('adminAuthenticated') === 'true'
        setIsAuthenticated(authenticated)
        setIsCheckingAuth(false)
        
        if (authenticated) {
          fetchData()
          
          // Auto-refresh every 3 seconds to show latest assignments (more frequent)
          const interval = setInterval(() => {
            fetchData(false) // Don't show loading spinner on auto-refresh
          }, 3000)
          
          return () => clearInterval(interval)
        }
      }
    }

    const cleanup = checkAuth()
    return cleanup
  }, [])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('adminAuthenticated')
      sessionStorage.removeItem('adminLoginTime')
      router.push('/admin/login')
    }
  }

  // Show login page if not authenticated
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin />
  }

  const handleManualRefresh = () => {
    fetchData(true)
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all assignments? This action cannot be undone.')) {
      return
    }

    setIsResetting(true)
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset assignments')
      }

      // Show success message with details
      const deletedCount = data.deletedAssignments || 0
      const resetCount = data.resetParticipants || 0
      alert(`Reset successful!\n\n- Deleted ${deletedCount} assignment(s)\n- Reset ${resetCount} participant(s)\n\nThe spin wheel will now show all numbers again.`)
      
      // Refresh data immediately
      await fetchData(true)
      
      // Notify other tabs/windows about the reset using BroadcastChannel
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('secret-santa-reset')
        channel.postMessage({ type: 'reset', timestamp: Date.now() })
        channel.close()
      }
      
      // Small delay before reload to ensure data is refreshed
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err: any) {
      alert(`Failed to reset assignments: ${err.message || 'Please try again.'}`)
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
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/"
                className="px-4 py-2 text-primary-600 dark:text-primary-400 hover:underline"
              >
                ← Back to Wheel
              </Link>
              <motion.button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isRefreshing ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
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
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={handleReset}
                disabled={isResetting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isResetting ? 'Resetting...' : 'Reset All'}
              </motion.button>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all flex items-center gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
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
                  <p className="mb-2">No assignments yet.</p>
                  <p className="text-sm">Participants will appear here after they spin the wheel.</p>
                </div>
              ) : (
                <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Assignments: <span className="font-semibold">{participants.length}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Auto-refreshes every 3 seconds
                  </div>
                </div>
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
                        key={`${participant.id}-${participant.assigned_number}-${participant.updated_at}`}
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
                </>
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

