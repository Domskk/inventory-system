// New: src/components/EmptyState.tsx
import { motion } from 'framer-motion'
import { CubeIcon } from '@heroicons/react/24/outline'

interface EmptyStateProps {
  hasItems: boolean
  filterLabel: string
  isAdmin: boolean
}

export default function EmptyState({ hasItems, filterLabel, isAdmin }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-xl"
    >
      <CubeIcon className="w-16 h-16 text-purple-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {hasItems ? `No items match ${filterLabel}` : 'No Items Yet'}
      </h3>

      <p className="text-gray-500 mb-4">
        {hasItems 
          ? 'Try adjusting your filters or search terms.' 
          : 'Start building your inventory by adding your first item.'}
      </p>
      {hasItems === false && isAdmin && (
        <p className="text-sm text-gray-400">Click the Add New Item button to get started.</p>
      )}
    </motion.div>
  )
}