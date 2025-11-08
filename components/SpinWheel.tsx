'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface SpinWheelProps {
  availableNumbers: number[]
  onSpinComplete: (number: number) => void
  isSpinning: boolean
  onSpinStart: () => void
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
  '#EC7063', '#5DADE2', '#58D68D', '#F4D03F', '#AF7AC5',
  '#76D7C4', '#F1948A', '#85C1E9', '#F9E79F', '#A9DFBF',
]

export default function SpinWheel({
  availableNumbers,
  onSpinComplete,
  isSpinning,
  onSpinStart,
}: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rotation, setRotation] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const spinAudioRef = useRef<HTMLAudioElement | null>(null)
  const stopAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio elements for sound effects
    if (typeof window !== 'undefined') {
      spinAudioRef.current = new Audio('/sounds/spin.mp3')
      stopAudioRef.current = new Audio('/sounds/stop.mp3')
      
      // Set error handlers to gracefully fallback to Web Audio API
      spinAudioRef.current.onerror = () => {
        spinAudioRef.current = null
      }
      stopAudioRef.current.onerror = () => {
        stopAudioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // Delay initial draw to ensure canvas is rendered
    const timer = setTimeout(() => {
      drawWheel()
    }, 100)
    
    // Handle window resize
    const handleResize = () => {
      setTimeout(() => drawWheel(), 100)
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', handleResize)
      }
    }
    
    return () => clearTimeout(timer)
  }, [availableNumbers])

  const drawWheel = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get actual display size
    const rect = canvas.getBoundingClientRect()
    const displayWidth = rect.width || 400
    const displayHeight = rect.height || 400
    
    // Set actual size in memory (scaled up for retina displays)
    const scale = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
    canvas.width = displayWidth * scale
    canvas.height = displayHeight * scale
    
    // Scale context to match device pixel ratio
    ctx.scale(scale, scale)
    
    // Set canvas display size
    canvas.style.width = displayWidth + 'px'
    canvas.style.height = displayHeight + 'px'

    const centerX = displayWidth / 2
    const centerY = displayHeight / 2
    const radius = Math.min(centerX, centerY) - 20

    // Clear canvas (after scaling)
    ctx.clearRect(0, 0, displayWidth, displayHeight)

    if (availableNumbers.length === 0) {
      ctx.fillStyle = '#E5E7EB'
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#6B7280'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('No numbers available', centerX, centerY)
      return
    }

    const anglePerSegment = (Math.PI * 2) / availableNumbers.length

    // Draw segments
    availableNumbers.forEach((number, index) => {
      const startAngle = index * anglePerSegment
      const endAngle = (index + 1) * anglePerSegment

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      ctx.fillStyle = COLORS[index % COLORS.length]
      ctx.fill()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw number text
      const textAngle = startAngle + anglePerSegment / 2
      const textX = centerX + Math.cos(textAngle) * (radius * 0.7)
      const textY = centerY + Math.sin(textAngle) * (radius * 0.7)

      ctx.save()
      ctx.translate(textX, textY)
      ctx.rotate(textAngle + Math.PI / 2)
      ctx.fillStyle = '#FFFFFF'
      // Responsive font size
      const fontSize = Math.max(12, Math.min(16, radius / 15))
      ctx.font = `bold ${fontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(number.toString(), 0, 0)
      ctx.restore()
    })

    // Draw center circle (responsive size)
    const centerRadius = Math.max(20, Math.min(30, radius / 10))
    ctx.beginPath()
    ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = Math.max(2, Math.min(3, radius / 100))
    ctx.stroke()

    // Draw pointer (responsive size)
    const pointerSize = Math.max(10, Math.min(15, radius / 20))
    const pointerHeight = Math.max(20, Math.min(30, radius / 10))
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - radius - pointerSize)
    ctx.lineTo(centerX - pointerSize, centerY - radius - pointerHeight)
    ctx.lineTo(centerX + pointerSize, centerY - radius - pointerHeight)
    ctx.closePath()
    ctx.fillStyle = '#FF0000'
    ctx.fill()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = Math.max(1, Math.min(2, radius / 150))
    ctx.stroke()
  }

  const playSpinSound = () => {
    if (spinAudioRef.current) {
      spinAudioRef.current.currentTime = 0
      spinAudioRef.current.play().catch(() => {
        // Fallback: create a tone using Web Audio API
        createTone(200, 0.1)
      })
    } else {
      createTone(200, 0.1)
    }
  }

  const playStopSound = () => {
    if (stopAudioRef.current) {
      stopAudioRef.current.currentTime = 0
      stopAudioRef.current.play().catch(() => {
        createTone(400, 0.2)
      })
    } else {
      createTone(400, 0.2)
    }
  }

  const createTone = (frequency: number, duration: number) => {
    if (typeof window === 'undefined') return
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration)
  }

  const handleSpin = () => {
    if (availableNumbers.length === 0 || isAnimating || isSpinning) return

    setIsAnimating(true)
    onSpinStart()
    playSpinSound()

    // Random rotation (multiple full rotations + random angle)
    const spins = 5 + Math.random() * 5 // 5-10 full rotations
    const randomIndex = Math.floor(Math.random() * availableNumbers.length)
    const anglePerSegment = (Math.PI * 2) / availableNumbers.length
    const targetAngle = randomIndex * anglePerSegment + anglePerSegment / 2
    const finalRotation = spins * 360 + (360 - (targetAngle * 180) / Math.PI)

    setRotation(finalRotation)

    // Stop sound and complete after animation
    setTimeout(() => {
      playStopSound()
      setTimeout(() => {
        setIsAnimating(false)
        onSpinComplete(availableNumbers[randomIndex])
      }, 500)
    }, 3000)
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative w-full max-w-[400px] aspect-square">
        <motion.canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-full rounded-full shadow-2xl"
          animate={{ rotate: rotation }}
          transition={{
            duration: 3,
            ease: [0.17, 0.67, 0.83, 0.67], // Ease out cubic
          }}
          style={{ transformOrigin: 'center' }}
        />
      </div>

      <motion.button
        onClick={handleSpin}
        disabled={availableNumbers.length === 0 || isAnimating || isSpinning}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-lg rounded-full shadow-lg hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isAnimating ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
            Spinning...
          </span>
        ) : (
          '🎡 Spin the Wheel!'
        )}
      </motion.button>

      {availableNumbers.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {availableNumbers.length} number{availableNumbers.length !== 1 ? 's' : ''} available
        </p>
      )}
    </div>
  )
}

