'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CubeIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Bars3Icon,
  Squares2X2Icon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { Item, Stats } from '../types/item'
import AddItemForm from '../components/AddItemForms'

export default function ViewItems() {
  const [items, setItems] = useState<Item[]>([])
  const [stats, setStats] = useState<Stats>({ totalItems: 0, totalQuantity: 0, lowStock: 0, outOfStock: 0 })
  const [search, setSearch] = useState('')
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')  // New: Toggle between grid/list

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    const { data } = await supabase.from('items').select('*').order('inserted_at', { ascending: false })
    setItems(data || [])
    calculateStats(data || [])
    setLoading(false)
  }

  const calculateStats = (data: Item[]) => {
    const totalItems = data.length
    const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0)
    const lowStock = data.filter(item => item.quantity > 0 && item.quantity < 10).length
    const outOfStock = data.filter(item => item.quantity === 0).length
    setStats({ totalItems, totalQuantity, lowStock, outOfStock })
  }

  const filteredItems = items
    .filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
    )
    .filter(item => !filterLowStock || item.quantity < 10)

  const getStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' }
    if (quantity < 10) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-800 border-orange-200' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this item?')) {
      await supabase.from('items').delete().eq('id', id)
      fetchItems()
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    fetchItems()
  }

  if (loading) return <div className="p-8 flex items-center justify-center">Loading...</div>

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at center, rgba(147, 51, 234, 0.2) 0%, 
                          rgba(139, 92, 246, 0.1) 50%, 
                          transparent 100%),
          linear-gradient(to bottom, #4c1d95 0%, #581c87 100%)
        `
      }}
    >
      {/* Subtle floating particles for aesthetic depth */}
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div 
          className="absolute top-20 left-10 w-4 h-4 bg-purple-300 rounded-full"
          animate={{ y: [0, -30, 0], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute top-40 right-20 w-3 h-3 bg-purple-200 rounded-full"
          animate={{ y: [0, 20, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div 
          className="absolute bottom-40 left-1/3 w-5 h-5 bg-purple-400 rounded-full"
          animate={{ y: [0, -15, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        <motion.div 
          className="absolute bottom-20 right-1/4 w-2 h-2 bg-purple-500 rounded-full"
          animate={{ y: [0, 10, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
      </motion.div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CubeIcon className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory System</h1>
                <p className="text-sm text-gray-500">Manage your inventory items with style and efficiency</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAdd}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <span>+</span>
              <span>Add New Item</span>
            </motion.button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 bg-white/90 backdrop-blur-sm rounded-xl p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <CubeIcon className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-500">Total Items</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <ChartBarIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-500">Total Quantity</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.totalQuantity}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-500">Low Stock</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <XMarkIcon className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-500">Out of Stock</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
          </div>
        </div>

        {/* Search & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 bg-white/90 backdrop-blur-sm rounded-xl p-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-gray-900 font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-500">Showing {filteredItems.length} of {items.length} items</p>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <Bars3Icon className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Items View: Grid or List */}
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-xl"
            >
              <CubeIcon className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Items Yet</h3>
              <p className="text-gray-500 mb-4">Start building your inventory by adding your first item.</p>
              <p className="text-sm text-gray-400">Click the Add New Item button to get started.</p>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredItems.map((item) => {
                const status = getStatus(item.quantity)
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <CubeIcon className="w-5 h-5 text-purple-400 mt-1" />
                      <div className="flex space-x-1">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1 text-lg">{item.name}</h3>
                    {item.description && <p className="text-gray-600 text-sm mb-3">{item.description}</p>}
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between"><span className="text-gray-500">Quantity:</span> <span className="font-semibold text-gray-900">{item.quantity}</span></p>
                      <p className="flex justify-between"><span className="text-gray-500">Status:</span> 
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                          {status.label}
                        </span>
                      </p>
                      <p className="flex justify-between"><span className="text-gray-500">Added:</span> <span className="text-gray-600">{formatDate(item.inserted_at)}</span></p>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => {
                      const status = getStatus(item.quantity)
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.inserted_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() => handleEdit(item)}
                              className="text-purple-600 hover:text-purple-900 p-1 rounded-lg hover:bg-purple-50 transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </motion.button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit/Add Modal */}
      <AnimatePresence>
        {showModal && (
          <AddItemForm
            item={editingItem}
            onClose={closeModal}
            isEdit={!!editingItem}
          />
        )}
      </AnimatePresence>
    </div>
  )
}