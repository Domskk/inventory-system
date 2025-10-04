import { motion } from 'framer-motion'
import Image from 'next/image'
import { CubeIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { Item } from '../types/item'
import { InlineQuantityEditor, InlinePriceEditor, InlineImageEditor } from './InlineEditors'
import type { KeyboardEvent } from 'react'

interface Status {
  label: string
  color: string
}

interface ItemCardProps {
  item: Item
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

export default function ItemCard({ 
  item, 
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
}: ItemCardProps) {
  const status = getStatus(item.quantity)
  const isEditingQuantity = inlineEditing?.id === item.id && inlineEditing.field === 'quantity'
  const isEditingPrice = inlineEditing?.id === item.id && inlineEditing.field === 'price'
  const isEditingImage = inlineEditing?.id === item.id && inlineEditing.field === 'image'
  const isUploading = uploadingImage === item.id

  const formatDate = (dateString: string) => format(new Date(dateString), 'MMM d, yyyy h:mm a')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, field: 'quantity' | 'price') => {
    if (e.key === 'Enter') {
      handleInlineUpdate(field, tempValue, item.id)
    }
    if (e.key === 'Escape') {
      cancelInlineEdit()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => !isEditingQuantity && !isEditingPrice && !isEditingImage && onViewDetail(item)}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer relative"
    >
      <div className="relative w-full h-32 rounded-lg mb-3 overflow-hidden">
        {isEditingImage ? (
          <div className="flex flex-col items-center justify-center h-full bg-gray-100">
            <InlineImageEditor item={item} onChange={(e) => handleImageChange(e, item)} />
            {isUploading && <div className="text-xs text-purple-600 mt-1">Uploading...</div>}
          </div>
        ) : item.image_url ? (
          <>
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); startInlineEdit('image', item.id); }}
                className="absolute top-2 right-2 bg-white/80 rounded-full p-1 hover:bg-white transition-colors"
                title="Change Image"
              >
                <PencilIcon className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-lg">
            <CubeIcon className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500">No Image</span>
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); startInlineEdit('image', item.id); }}
                className="text-xs text-purple-600 hover:underline mt-1"
              >
                Add Image
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex items-start justify-between mb-3">
        <CubeIcon className="w-5 h-5 text-purple-400 mt-1" />
        <div className="flex space-x-1">
          {isAdmin && !isEditingQuantity && !isEditingPrice && !isEditingImage && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Edit"
              >
                <PencilIcon className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <TrashIcon className="w-4 h-4" />
              </motion.button>
            </>
          )}
          {(isEditingQuantity || isEditingPrice || isEditingImage) && (
            <button
              onClick={cancelInlineEdit}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Cancel"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <h3 className="font-bold text-gray-900 mb-1 text-lg">{item.name}</h3>
      {item.description && <p className="text-gray-600 text-sm mb-3">{item.description}</p>}
      <div className="space-y-2 text-sm">
        <p className="flex justify-between items-center">
          <span className="text-gray-500">Quantity:</span> 
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
              onDoubleClick={() => startInlineEdit('quantity', item.id, item.quantity.toString())}
            >
              {item.quantity}
            </span>
          )}
        </p>
        {item.price !== undefined && (
          <p className="flex justify-between items-center">
            <span className="text-gray-500">Price:</span> 
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
                className="font-semibold text-gray-900 cursor-pointer hover:text-purple-600"
                onDoubleClick={() => startInlineEdit('price', item.id, item.price?.toFixed(2))}
              >
                ₱{(item.price ?? 0).toFixed(2)}
              </span>
            )}
          </p>
        )}
        <p className="flex justify-between">
          <span className="text-gray-500">Status:</span> 
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
            {status.label}
          </span>
        </p>
        <p className="flex justify-between">
          <span className="text-gray-500">Added:</span> 
          <span className="text-gray-600">{formatDate(item.inserted_at)}</span>
        </p>
      </div>
    </motion.div>
  )
}