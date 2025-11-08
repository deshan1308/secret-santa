'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

interface AssignedResultProps {
  number: number
  name: string
  onSpinAgain?: () => void
  canSpinAgain?: boolean
}

export default function AssignedResult({
  number,
  name,
  onSpinAgain,
  canSpinAgain = false,
}: AssignedResultProps) {
  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="w-full max-w-md mx-auto text-center space-y-6"
    >
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="relative"
      >
        <div className="text-8xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent mb-4">
          {number}
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          className="absolute -top-4 -right-4 text-4xl"
        >
          🎉
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-semibold text-gray-800 dark:text-gray-200"
      >
        Congratulations, {name}!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-lg text-gray-600 dark:text-gray-400"
      >
        Your secret number is <span className="font-bold text-primary-600 dark:text-primary-400">{number}</span>
      </motion.p>

      {canSpinAgain && onSpinAgain && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={onSpinAgain}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
        >
          Spin Again
        </motion.button>
      )}

      {!canSpinAgain && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-gray-500 dark:text-gray-500 italic"
        >
          You&apos;ve already received your number. Thank you for participating!
        </motion.p>
      )}
    </motion.div>
  )
}

