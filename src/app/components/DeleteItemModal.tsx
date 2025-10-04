// New: src/components/DeleteItemModal.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Item } from '../types/item'

interface DeleteItemModalProps {
  show: boolean
  item?: Item | null
  onClose: () => void
  onConfirm: (id: string) => void
}

export default function DeleteItemModal({ show, item, onClose, onConfirm }: DeleteItemModalProps) {
  if (!item) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </button>

            <div className="text-center space-y-4">
              <TrashIcon className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold text-gray-900">Delete Item</h2>
              <p className="text-gray-600">Are you sure you want to delete {item.name}? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onConfirm(item.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}