import { motion } from 'framer-motion'
import Image from 'next/image'
import { PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { Item } from '../types/item'
import { InlineQuantityEditor, InlinePriceEditor, InlineImageEditor } from './InlineEditors'
import type { KeyboardEvent } from 'react'

interface Status {
  label: string
  color: string
}

interface ItemsListProps {
  items: Item[]
  onViewDetail: (item: Item) => void
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
  isAdmin: boolean
  inlineEditing: { id: string; field: 'quantity' | 'price' | 'image' } | null
  tempValue: string
  uploadingImage: string | null
  startInlineEdit: (field: 'quantity' | 'price' | 'image', id: string, initialValue?: string) => void
  cancelInlineEdit: () => void
  handleInlineUpdate: (field: 'quantity' | 'price', value: string, itemId: string) => Promise<boolean>
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>, item: Item) => Promise<boolean>
  setTempValue: (value: string) => void
}

function getStatus(quantity: number): Status {
  if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' }
  if (quantity < 10) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-800 border-orange-200' }
  return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' }
}

export default function ItemsList({ 
  items, 
  onViewDetail, 
  onEdit, 
  onDelete, 
  isAdmin, 
  inlineEditing, 
  tempValue, 
  uploadingImage, 
  startInlineEdit, 
  cancelInlineEdit, 
  handleInlineUpdate, 
  handleImageChange, 
  setTempValue 
}: ItemsListProps) {
  const formatDate = (dateString: string) => format(new Date(dateString), 'MMM d, yyyy h:mm a')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, field: 'quantity' | 'price') => {
    if (e.key === 'Enter') {
      handleInlineUpdate(field, tempValue, inlineEditing?.id || '')
    }
    if (e.key === 'Escape') {
      cancelInlineEdit()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => {
              const status = getStatus(item.quantity)
              const isEditingQuantity = inlineEditing?.id === item.id && inlineEditing.field === 'quantity'
              const isEditingPrice = inlineEditing?.id === item.id && inlineEditing.field === 'price'
              const isEditingImage = inlineEditing?.id === item.id && inlineEditing.field === 'image'
              const isUploading = uploadingImage === item.id
              return (
                <tr key={item.id} className="hover:bg-gray-50" onClick={() => !isEditingQuantity && !isEditingPrice && !isEditingImage && onViewDetail(item)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditingImage ? (
                      <div className="flex flex-col">
                        <InlineImageEditor item={item} onChange={(e) => handleImageChange(e, item)} />
                        {isUploading && <div className="text-xs text-purple-600">Uploading...</div>}
                      </div>
                    ) : item.image_url ? (
                      <div className="relative w-12 h-12 rounded overflow-hidden cursor-pointer hover:opacity-80">
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        {isAdmin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); startInlineEdit('image', item.id); }}
                            className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow"
                            title="Change Image"
                          >
                            <PencilIcon className="w-3 h-3 text-gray-600" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-xs">No Image</span>
                        {isAdmin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); startInlineEdit('image', item.id); }}
                            className="text-purple-600 text-xs hover:underline"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isEditingQuantity ? (
                      <InlineQuantityEditor 
                        item={item}
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => handleInlineUpdate('quantity', tempValue, item.id)}
                        onKeyDown={(e) => handleKeyDown(e, 'quantity')}
                      />
                    ) : (
                      <span 
                        className="font-semibold text-gray-900 cursor-pointer hover:text-purple-600"
                        onDoubleClick={(e) => { e.stopPropagation(); startInlineEdit('quantity', item.id, item.quantity.toString()); }}
                      >
                        {item.quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isEditingPrice ? (
                      <InlinePriceEditor 
                        item={item}
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => handleInlineUpdate('price', tempValue, item.id)}
                        onKeyDown={(e) => handleKeyDown(e, 'price')}
                      />
                    ) : (
                      <span 
                        className="text-gray-900 cursor-pointer hover:text-purple-600"
                        onDoubleClick={(e) => { e.stopPropagation(); startInlineEdit('price', item.id, (item.price ?? 0).toFixed(2)); }}
                      >
                        ₱{(item.price ?? 0).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{(item.quantity * (item.price || 0)).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.inserted_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {(isEditingQuantity || isEditingPrice || isEditingImage) ? (
                      <button
                        onClick={cancelInlineEdit}
                        className="text-gray-500 hover:text-gray-700"
                        title="Cancel"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    ) : isAdmin ? (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded-lg hover:bg-purple-50 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                          className="text-red-600 hover:text-red-900 p-1 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </motion.button>
                      </>
                    ) : (
                      <span className="text-gray-400">View only</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}