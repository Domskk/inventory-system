import { motion, AnimatePresence } from 'framer-motion'

interface FiltersPanelProps {
  filterStatus: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  onFilterStatusChange: (status: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => void
  dateFrom: string
  onDateFromChange: (date: string) => void
  dateTo: string
  onDateToChange: (date: string) => void
  filterLowStock: boolean
  onFilterLowStockChange: (checked: boolean) => void
  show: boolean
}

export default function FiltersPanel({
  filterStatus,
  onFilterStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  filterLowStock,
  onFilterLowStockChange,
  show
}: FiltersPanelProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-xl p-4 mb-6 space-y-4 overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => onFilterStatusChange(e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock')}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filterLowStock}
                  onChange={(e) => onFilterLowStockChange(e.target.checked)}
                  className="rounded"
                />
                <span>Low Stock Only</span>
              </label>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}