import { motion, AnimatePresence } from 'framer-motion'

interface FiltersPanelProps {
  filterInStock: boolean
  onFilterInStockChange: (checked: boolean) => void
  filterLowStock: boolean
  onFilterLowStockChange: (checked: boolean) => void
  filterOutOfStock: boolean
  onFilterOutOfStockChange: (checked: boolean) => void
  show: boolean
}

export default function FiltersPanel({
  filterInStock,
  onFilterInStockChange,
  filterLowStock,
  onFilterLowStockChange,
  filterOutOfStock,
  onFilterOutOfStockChange,
  show
}: FiltersPanelProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-xl p-4 mb-6 overflow-hidden"
        >
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterInStock}
                onChange={(e) => onFilterInStockChange(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="font-medium">In Stock</span>
            </label>
            
            <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e) => onFilterLowStockChange(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="font-medium">Low Stock</span>
            </label>
            
            <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOutOfStock}
                onChange={(e) => onFilterOutOfStockChange(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="font-medium">Out of Stock</span>
            </label>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}