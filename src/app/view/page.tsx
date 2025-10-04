'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
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
  TrashIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { createClient } from '../lib/supabase'
import { Item, Stats, Profile } from '../types/item'
import { User, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { format } from 'date-fns'
import AddItemForm from '../components/AddItemForms'

interface PostgresChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  commit_timestamp: string;
  old?: Partial<Item>;
  new?: Partial<Item>;
}

export default function ViewItems() {
  const [items, setItems] = useState<Item[]>([])
  const [stats, setStats] = useState<Stats>({ totalItems: 0, totalQuantity: 0, lowStock: 0, outOfStock: 0, totalValue: 0 })
  const [search, setSearch] = useState('')
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' })
  const supabase = createClient()

 /** Fetch user auth & items */
  const fetchAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (profileData) {
        const typedProfile = profileData as Profile
        setProfile(typedProfile)
        setIsAdmin(typedProfile.role === 'admin')
      }

      const { data: itemsData, error } = await supabase
        .from('items')
        .select('*')
        .order('inserted_at', { ascending: false })

      if (error) {
        showNotification('error', 'Failed to load items.')
      } else {
        const mappedItems: Item[] = (itemsData || []).map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description ?? undefined,
          quantity: row.quantity ?? 0,
          price: row.price ?? undefined,
          image_url: row.image_url ?? undefined,
          inserted_at: row.inserted_at ?? new Date().toISOString(),
        }))
        setItems(mappedItems)
        calculateStats(mappedItems)
      }
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAuth() }, [fetchAuth])

  // Realtime subscription for items table
  useEffect(() => {
    if (!user) return

    const channel = supabase.channel('items-realtime')

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
        },
        (payload: PostgresChangePayload) => {
          const newItem = payload.new
          const oldItem = payload.old

          if (payload.eventType === 'INSERT') {
            const mappedNewItem: Item = {
              id: newItem?.id ?? '',
              name: newItem?.name ?? '',
              description: newItem?.description ?? undefined,
              quantity: newItem?.quantity ?? 0,
              price: newItem?.price ?? undefined,
              image_url: newItem?.image_url ?? undefined,
              inserted_at: newItem?.inserted_at ?? new Date().toISOString(),
            }
            setItems((prev) => {
              const updated = [...prev, mappedNewItem]
              calculateStats(updated)
              return updated
            })
          } else if (payload.eventType === 'UPDATE') {
            const mappedNewItem: Item = {
              id: newItem?.id ?? '',
              name: newItem?.name ?? '',
              description: newItem?.description ?? undefined,
              quantity: newItem?.quantity ?? 0,
              price: newItem?.price ?? undefined,
              image_url: newItem?.image_url ?? undefined,
              inserted_at: newItem?.inserted_at ?? new Date().toISOString(),
            }
            setItems((prev) => {
              const updated = prev.map((item) =>
                item.id === mappedNewItem.id ? mappedNewItem : item
              )
              calculateStats(updated)
              return updated
            })
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) => {
              const updated = prev.filter((item) => item.id !== oldItem?.id)
              calculateStats(updated)
              return updated
            })
          }
        }
      )
      .subscribe((status: REALTIME_SUBSCRIBE_STATES) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Subscription error')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  /** Calculate stats for dashboard */
  const calculateStats = (data: Item[]) => {
    const totalItems = data.length
    const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0)
    const lowStock = data.filter(item => item.quantity > 0 && item.quantity < 10).length
    const outOfStock = data.filter(item => item.quantity === 0).length
    const totalValue = data.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0)
    setStats({ totalItems, totalQuantity, lowStock, outOfStock, totalValue })
  }

  /** Filtered items */
  const filteredItems = items
    .filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
    )
    .filter(item => !filterLowStock || item.quantity < 10)
    .filter(item => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'in_stock') return item.quantity >= 10
      if (filterStatus === 'low_stock') return item.quantity > 0 && item.quantity < 10
      if (filterStatus === 'out_of_stock') return item.quantity === 0
      return true
    })
    .filter(item => {
      if (!dateFrom && !dateTo) return true
      const insertedDate = new Date(item.inserted_at)
      const fromDate = dateFrom ? new Date(dateFrom) : new Date(0)
      const toDate = dateTo ? new Date(dateTo) : new Date()
      return insertedDate >= fromDate && insertedDate <= toDate
    })

  /** Status helpers */
  const getStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' }
    if (quantity < 10) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-800 border-orange-200' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' }
  }

  const formatDate = (dateString: string) => format(new Date(dateString), 'MMM d, yyyy h:mm a')
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message })
    setTimeout(() => setNotification({ show: false, type: 'success', message: '' }), 3000)
  }

  /** Add/Edit handlers */
  const handleEdit = (item: Item) => {
    if (!isAdmin) return showNotification('error', 'Only admins can edit items.')
    setEditingItem(item)
    setShowModal(true)
  }

  const handleAdd = () => {
    if (!isAdmin) return showNotification('error', 'Only admins can add items.')
    setEditingItem(null)
    setShowModal(true)
  }

  /** Optimistic Delete */
  const handleDelete = async (id: string) => {
    if (!isAdmin) return showNotification('error', 'Only admins can delete items.')
    if (confirm('Delete this item?')) {
      const previousItems = [...items]
      setItems(items.filter(item => item.id !== id))
      calculateStats(items.filter(item => item.id !== id))

      const { error } = await supabase.from('items').delete().eq('id', id)
      if (error) {
        setItems(previousItems)
        calculateStats(previousItems)
        showNotification('error', 'Failed to delete item.')
      } else {
        showNotification('success', 'Item deleted successfully.')
      }
    }
  }

  /** Close Modal with optimistic add/edit */
  const closeModal = (updatedItem?: Item) => {
    setShowModal(false)
    const wasEdit = editingItem !== null;
    setEditingItem(null)

    if (updatedItem) {
      setItems(prev => {
        const exists = prev.find(i => i.id === updatedItem.id)
        const newItems = exists
          ? prev.map(i => (i.id === updatedItem.id ? updatedItem : i))
          : [updatedItem, ...prev]
        calculateStats(newItems)
        return newItems
      })
      const message = updatedItem.id ? 'Item updated successfully.' : 'Item added successfully.'
      showNotification('success', message)
    } else {
      const message = wasEdit ? 'Failed to update item. Please try again.' : 'Failed to add item. Please try again.'
      showNotification('error', message)
    }
  }

  /** Logout */
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }
  
    const exportToCSV = () => {
      const headers = ['Name', 'Description', 'Quantity', 'Price', 'Total Value', 'Status', 'Date Added']
      const rows = filteredItems.map(item => [
        item.name,
        item.description || '',
        item.quantity,
        item.price || 0,
        (item.quantity * (item.price || 0)).toFixed(2),
        getStatus(item.quantity).label,
        formatDate(item.inserted_at)
      ])
      const csvContent = [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      showNotification('success', 'Inventory exported to CSV.')
    }

    if (loading) return <div className="p-8 flex items-center justify-center">Loading...</div>

    if (!user) return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <button 
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Login with GitHub
          </button>
        </div>
      </div>
    )
    const getFilterLabel = (status: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => {
    switch (status) {
    case 'all':
      return 'your search or filters'
    case 'in_stock':
      return 'items that are In Stock'
    case 'low_stock':
      return 'items that are Low Stock'
    case 'out_of_stock':
      return 'items that are Out of Stock'
  }
}
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
        <header className="bg-white/0 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CubeIcon className="w-8 h-8 text-purple-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Inventrack</h1>
                  <p className="text-sm text-gray-300">Manage your inventory items with style and efficiency</p>
                  {profile && <p className="text-xs text-gray-300">Role: {profile.role}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <UserIcon className="w-5 h-5" />
                  <span>{user.email}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Logout</span>
                </motion.button>
                {isAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAdd}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>Add New Item</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8 bg-white/90 backdrop-blur-sm rounded-xl p-4">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <CalendarIcon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
              <p className="text-2xl font-bold text-gray-900">₱{stats.totalValue.toFixed(2)}</p>
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
            <div className="flex flex-wrap items-center space-x-2">
              <p className="text-sm text-gray-500">Showing {filteredItems.length} of {items.length} items</p>
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
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={exportToCSV}
                className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                title="Export to CSV"
              >
                📊
              </motion.button>
              <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={() => setShowFilters(!showFilters)}>
                <FunnelIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Additional Filters */}
          <AnimatePresence>
            {showFilters && (
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
                      onChange={(e) => setFilterStatus(e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock')}
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
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center space-x-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={filterLowStock}
                        onChange={(e) => setFilterLowStock(e.target.checked)}
                        className="rounded"
                      />
                      <span>Low Stock Only</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {items.length === 0 ? 'No Items Yet' :`No items match ${getFilterLabel(filterStatus)}`}
                </h3>

                <p className="text-gray-500 mb-4">
                  {items.length === 0 
                    ? 'Start building your inventory by adding your first item.' 
                    : 'Try adjusting your filters or search terms.'}
                </p>
                {items.length === 0 && isAdmin && (
                  <p className="text-sm text-gray-400">Click the Add New Item button to get started.</p>
                )}
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
                      {item.image_url && (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <CubeIcon className="w-5 h-5 text-purple-400 mt-1" />
                        <div className="flex space-x-1">
                          {isAdmin && (
                            <>
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
                            </>
                          )}
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1 text-lg">{item.name}</h3>
                      {item.description && <p className="text-gray-600 text-sm mb-3">{item.description}</p>}
                      <div className="space-y-2 text-sm">
                        <p className="flex justify-between"><span className="text-gray-500">Quantity:</span> <span className="font-semibold text-gray-900">{item.quantity}</span></p>
                        {item.price && <p className="flex justify-between"><span className="text-gray-500">Price:</span> <span className="font-semibold text-gray-900">₱{item.price.toFixed(2)}</span></p>}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.image_url ? (
                                <Image src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              ) : (
                                'No Image'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{item.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{(item.price || 0).toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{(item.quantity * (item.price || 0)).toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.inserted_at)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              {isAdmin ? (
                                <>
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
            )}
          </AnimatePresence>
        </div>

        {/* Notification Toast - Top Right */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, x: -300, y: 50 }} 
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -300, y: 50 }}
              className={`fixed top-4 -4 z-50 flex items-center space-x-3 px-6 py-4 rounded-lg shadow-xl max-w-sm ${
                notification.type === 'success' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircleIcon className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="font-medium flex-1">{notification.message}</span>
              <button
                onClick={() => setNotification({ show: false, type: 'success', message: '' })}
                className="ml-2 text-white hover:text-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit/Add Modal */}
        <AnimatePresence>
          {showModal && isAdmin && (
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