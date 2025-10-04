// New: src/components/DetailModal.tsx
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { XMarkIcon, PencilIcon, TrashIcon, CubeIcon} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { Item } from '../types/item'

interface DetailModalProps {
  item: Item | null
  onClose: () => void
  onEdit: (item: Item) => void
  onDelete: (id: string) => void
  isAdmin: boolean
  show: boolean
}

export default function DetailModal({ item, onClose, onEdit, onDelete, isAdmin, show }: DetailModalProps) {
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

            <div className="relative w-full h-64 rounded-t-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <CubeIcon className="w-24 h-24 text-purple-400 opacity-50" />
              )}
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{item.name}</h2>
                {item.description && (
                  <p className="text-gray-600 text-lg">{item.description}</p>
                )}
              </div>

              <div className="text-center">
                <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium border ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 mb-1">Quantity</p>
                  <p className="font-semibold text-gray-900">{item.quantity}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 mb-1">Price</p>
                  <p className="font-semibold text-gray-900">₱{(item.price ?? 0).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 mb-1">Total Value</p>
                  <p className="font-semibold text-gray-900">₱{(item.quantity * (item.price || 0)).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 mb-1">Date Added</p>
                  <p className="text-gray-900">{formatDate(item.inserted_at)}</p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onEdit(item)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4 inline mr-2" />
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onDelete(item.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4 inline mr-2" />
                    Delete
                  </motion.button>
                </div>
              )}
              {!isAdmin && (
                <div className="text-center text-gray-500 py-4 border-t">
                  View only
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function getStatus(quantity: number) {
  if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' }
  if (quantity < 10) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-800 border-orange-200' }
  return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' }
}