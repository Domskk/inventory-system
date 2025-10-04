import { MagnifyingGlassIcon, Bars3Icon, Squares2X2Icon, FunnelIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface SearchControlsProps {
  search: string
  onSearchChange: (value: string) => void
  filteredItemsLength: number
  totalItemsLength: number
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onExport: () => void
  onToggleFilters: () => void
}

export default function SearchControls({
  search,
  onSearchChange,
  filteredItemsLength,
  totalItemsLength,
  viewMode,
  onViewModeChange,
  onExport,
  onToggleFilters
}: SearchControlsProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 bg-white/90 backdrop-blur-sm rounded-xl p-4">
      <div className="relative flex-1 max-w-md">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-gray-900 font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        />
      </div>
      <div className="flex flex-wrap items-center space-x-2">
        <p className="text-sm text-gray-500">Showing {filteredItemsLength} of {totalItemsLength} items</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewModeChange('list')}
          className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          <Bars3Icon className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewModeChange('grid')}
          className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          <Squares2X2Icon className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onExport}
          className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
          title="Export to CSV"
        >
          📊
        </motion.button>
        <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={onToggleFilters}>
          <FunnelIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </div>
  )
}