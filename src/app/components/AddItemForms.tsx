'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createClient } from '../lib/supabase'
import Image from 'next/image'
import type { TablesInsert, TablesUpdate } from '@/types/supabase'
import { Item } from '../types/item' 

type ItemUpdate = TablesUpdate<'items'>
type ItemInsert = TablesInsert<'items'>

interface AddItemFormProps {
  item?: Item | null
  onClose?: (updatedItem?: Item) => void
  isEdit?: boolean
}

export default function AddItemForm({
  item,
  onClose,
  isEdit = false,
}: AddItemFormProps) {
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [quantity, setQuantity] = useState(item?.quantity?.toString() ?? '')
  const [price, setPrice] = useState(item?.price?.toString() ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleImageUpload = useCallback(async (oldImageUrl?: string | null) => {
    if (!imageFile) return null

    // Delete old image if editing
    if (isEdit && oldImageUrl) {
      try {
        const url = new URL(oldImageUrl)
        const pathname = url.pathname
        const publicIndex = pathname.indexOf('/public/')
        if (publicIndex !== -1) {
          const pathAfterPublic = pathname.substring(publicIndex + 8)
          const parts = pathAfterPublic.split('/')
          if (parts.length > 1) {
            const oldPath = parts.slice(1).join('/')
            const { error: deleteError } = await supabase.storage
              .from('item-images')
              .remove([oldPath])
            if (deleteError) {
              console.warn('Failed to delete old image:', deleteError)
            }
          }
        }
      } catch (err) {
        console.warn('Failed to parse old image URL for deletion:', err)
      }
    }

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = `images/${fileName}`

    const { data, error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(filePath, imageFile, { upsert: true })

    if (uploadError || !data) {
      throw new Error(uploadError?.message ?? 'Upload failed')
    }

    const { data: { publicUrl } } = supabase.storage
      .from('item-images')
      .getPublicUrl(filePath)

    return publicUrl ?? null
  }, [imageFile, isEdit, supabase])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const numQuantity = quantity ? Number(quantity) : 0
    const numPrice = price ? Number(price) : 0
    if (!name || numQuantity < 0 || numPrice < 0) {
      setError('Please fill in a name and valid quantity/price.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      let imageUrl = item?.image_url ?? null
      if (imageFile) {
        imageUrl = await handleImageUpload(imageUrl)
      }

      const updateData: ItemUpdate = {
        name,
        description: description || null,
        quantity:  numQuantity,
        price : numPrice,
        image_url: imageUrl,
      }

      let updatedItem: Item | null = null

      if (isEdit && item?.id) {
        const { data, error } = await supabase
          .from('items')
          .update(updateData)
          .eq('id', item.id)
          .select('*')
          .single()

        if (error) throw error
        updatedItem = data as Item
      } else {
        const { data, error } = await supabase
          .from('items')
          .insert([updateData as ItemInsert])
          .select('*')
          .single()

        if (error) throw error
        updatedItem = data as Item
      }

      onClose?.(updatedItem)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save item. Please try again.'
      setError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }, [name, description, quantity, price, imageFile, item, isEdit, supabase, onClose, handleImageUpload])

  const handleClose = useCallback(() => {
    setError('')
    onClose?.()
  }, [onClose])

  const getSubmitText = useCallback(() => {
    if (submitting) {
      return `Saving${isEdit ? '... updated' : '... added'}`
    }
    return isEdit ? 'Update Item' : 'Add Item'
  }, [submitting, isEdit])

    const handleWheel = useCallback((e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, []);
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/30"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={handleClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 text-gray-900"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 text-gray-900"
                  placeholder="Enter item description (optional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onWheel={handleWheel}
                  min={0}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 text-gray-900"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱) *</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onWheel={handleWheel}
                  min={0}
                  step="0.01"
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 text-gray-900"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {item?.image_url && !imageFile && (
                  <div className="mt-2">
                    <Image
                      src={item.image_url}
                      alt="Current"
                      width={400}
                      height={200}
                      className="w-full h-24 object-cover rounded"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{getSubmitText()}</span>
                    </>
                  ) : (
                    <span>{getSubmitText()}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}