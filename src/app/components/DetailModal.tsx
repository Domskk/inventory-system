import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { XMarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { Item } from '../types/item'

interface Status {
  label: string
  color: string
}

interface DetailModalProps {
  show: boolean
  item: Item | null
  onClose: () => void
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
  isAdmin: boolean
}

function getStatus(quantity: number): Status {
  if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' }
  if (quantity < 10) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-800 border-orange-200' }
  return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' }
}

export default function DetailModal({ show, item, onClose, onEdit, onDelete, isAdmin }: DetailModalProps) {
  if (!item) return null

  const status = getStatus(item.quantity)
  const formatDate = (dateString: string) => format(new Date(dateString), 'MMM d, yyyy h:mm a')

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
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </button>

            <div className="p-6">
              {item.image_url && (
                <div className="relative w-full h-64 rounded-xl overflow-hidden mb-6">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{item.name}</h2>
              {item.description && <p className="text-gray-600 mb-6">{item.description}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Quantity: <span className="font-semibold text-gray-900">{item.quantity}</span></p>
                  {item.price !== undefined && (
                    <p className="text-gray-500">Price: <span className="font-semibold text-gray-900">₱{(item.price ?? 0).toFixed(2)}</span></p>
                  )}
                  <p className="text-gray-500">Total Value: <span className="font-semibold text-gray-900">₱{(item.quantity * (item.price || 0)).toFixed(2)}</span></p>
                </div>
                <div>
                  <p className="text-gray-500">Status: <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${status.color}`}>{status.label}</span></p>
                  <p className="text-gray-500">Added: <span className="text-gray-600">{formatDate(item.inserted_at)}</span></p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => onEdit(item)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4 inline mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4 inline mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}