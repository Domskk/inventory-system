// New: src/hooks/useInlineEdit.ts
'use client'
import { useState } from 'react'
import { createClient } from '../lib/supabase'
import { Item } from '../types/item'

export function useInlineEdit(items: Item[], onItemsUpdate: (items: Item[]) => void, isAdmin: boolean) {
  const [inlineEditing, setInlineEditing] = useState<{id: string, field: 'quantity' | 'price' | 'image'} | null>(null)
  const [tempValue, setTempValue] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  const supabase = createClient()

  const startInlineEdit = (field: 'quantity' | 'price' | 'image', id: string, initialValue?: string) => {
    if (!isAdmin) return
    setInlineEditing({ id, field })
    setTempValue(initialValue || '')
  }

  const cancelInlineEdit = () => {
    setInlineEditing(null)
    setTempValue('')
    setUploadingImage(null)
  }

  const handleInlineUpdate = async (field: 'quantity' | 'price', value: string, itemId: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0) {
      cancelInlineEdit()
      return false
    }

    const previousItems = [...items]
    onItemsUpdate(items.map(i => i.id === itemId ? { ...i, [field]: numValue } : i))

    const { error } = await supabase
      .from('items')
      .update({ [field]: numValue })
      .eq('id', itemId)

    if (error) {
      onItemsUpdate(previousItems)
      cancelInlineEdit()
      return false
    }
    cancelInlineEdit()
    return true
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, item: Item) => {
    const file = e.target.files?.[0]
    if (!file || !isAdmin) return false

    setUploadingImage(item.id)
    const previousItems = [...items]

    try {
      // Delete old image if exists
      if (item.image_url) {
        const url = new URL(item.image_url)
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
      }

      // Upload new
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = `images/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, file, { upsert: true })

      if (uploadError || !data) {
        throw new Error(uploadError?.message ?? 'Upload failed')
      }

      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath)

      // Update DB
      const { error: dbError } = await supabase
        .from('items')
        .update({ image_url: publicUrl })
        .eq('id', item.id)

      if (dbError) {
        throw new Error(dbError.message)
      }

      // Optimistic update
      onItemsUpdate(items.map(i => i.id === item.id ? { ...i, image_url: publicUrl } : i))
      return true

    } catch (err) {
      console.error(err)
      onItemsUpdate(previousItems)
      return false
    } finally {
      setUploadingImage(null)
      cancelInlineEdit()
      e.target.value = ''
    }
  }

  return { 
    inlineEditing, 
    tempValue, 
    uploadingImage, 
    setTempValue, 
    startInlineEdit, 
    cancelInlineEdit, 
    handleInlineUpdate, 
    handleImageChange 
  }
}