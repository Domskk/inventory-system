'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'

interface NotificationToastProps {
  show: boolean
  type: 'success' | 'error'
  message: string
  onClose: () => void
}

export default function NotificationToast({ show, type, message, onClose }: NotificationToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -300, y: 50 }} 
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -300, y: 50 }}
          className={`fixed top-4 left-4 z-50 flex items-center space-x-3 px-6 py-4 rounded-lg shadow-xl max-w-sm ${
            type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          {type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircleIcon className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium flex-1">{message}</span>
          <button
            onClick={onClose}
            className="ml-2 text-white hover:text-gray-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}