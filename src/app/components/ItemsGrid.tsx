// Updated: src/components/ItemsGrid.tsx
import { motion, AnimatePresence } from 'framer-motion'
import ItemCard from './ItemCard'
import { Item } from '../types/item'

interface ItemsGridProps {
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

export default function ItemsGrid({ 
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
}: ItemsGridProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onViewDetail={onViewDetail}
            onEdit={onEdit}
            onDelete={onDelete}
            isAdmin={isAdmin}
            inlineEditing={inlineEditing}
            tempValue={tempValue}
            uploadingImage={uploadingImage}
            startInlineEdit={startInlineEdit}
            cancelInlineEdit={cancelInlineEdit}
            handleInlineUpdate={handleInlineUpdate}
            handleImageChange={handleImageChange}
            setTempValue={setTempValue}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  )
}