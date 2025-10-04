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
  const [selectedItem, setSelectedItem] = useState<Item | null>(null) // New state for detail modal
  const [showDetailModal, setShowDetailModal] = useState(false) // New state for detail modal
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' })
  // Inline editing states
  const [inlineEditing, setInlineEditing] = useState<{id: string, field: 'quantity' | 'price' | 'image'} | null>(null)
  const [tempValue, setTempValue] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
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

  // Inline editing helpers
  const startInlineEdit = (field: 'quantity' | 'price' | 'image', id: string, initialValue?: string) => {
    if (!isAdmin) return showNotification('error', 'Only admins can edit items.')
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
      showNotification('error', 'Invalid value.')
      cancelInlineEdit()
      return
    }

    const previousItems = [...items]
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: numValue } : i))
    calculateStats(items.map(i => i.id === itemId ? { ...i, [field]: numValue } : i))

    const { error } = await supabase
      .from('items')
      .update({ [field]: numValue })
      .eq('id', itemId)

    if (error) {
      setItems(previousItems)
      calculateStats(previousItems)
      showNotification('error', `Failed to update ${field}.`)
    } else {
      showNotification('success', `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully.`)
    }
    cancelInlineEdit()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, item: Item) => {
    const file = e.target.files?.[0]
    if (!file || !isAdmin) return

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
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, image_url: publicUrl } : i))
      calculateStats(items.map(i => i.id === item.id ? { ...i, image_url: publicUrl } : i))
      showNotification('success', 'Image updated successfully.')

    } catch (err) {
      setItems(previousItems)
      calculateStats(previousItems)
      showNotification('error', `Failed to update image: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setUploadingImage(null)
      cancelInlineEdit()
      // Reset file input
      e.target.value = ''
    }
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

  /** Detail modal handlers */
  const handleViewDetail = (item: Item) => {
    setSelectedItem(item)
    setShowDetailModal(true)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedItem(null)
  }

  const handleEditFromDetail = (item: Item) => {
    closeDetailModal()
    handleEdit(item)
  }

  const handleDeleteFromDetail = async (id: string) => {
    closeDetailModal()
    handleDelete(id)
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

  // Inline editing components
  const InlineQuantityEditor = ({ item }: { item: Item }) => (
    <input
      type="number"
      min={0}
      value={tempValue}
      onChange={(e) => setTempValue(e.target.value)}
      onBlur={() => handleInlineUpdate('quantity', tempValue, item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleInlineUpdate('quantity', tempValue, item.id)
        if (e.key === 'Escape') cancelInlineEdit()
      }}
      className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
      autoFocus
    />
  )

  const InlinePriceEditor = ({ item }: { item: Item }) => (
    <input
      type="number"
      min={0}
      step="0.01"
      value={tempValue}
      onChange={(e) => setTempValue(e.target.value)}
      onBlur={() => handleInlineUpdate('price', tempValue, item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleInlineUpdate('price', tempValue, item.id)
        if (e.key === 'Escape') cancelInlineEdit()
      }}
      className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-right"
      autoFocus
    />
  )

  const InlineImageEditor = ({ item }: { item: Item }) => (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImageChange(e, item)}
        className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
      />
      {uploadingImage === item.id && (
        <div className="text-xs text-purple-600 mt-1">Uploading...</div>
      )}
    </>
  )

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
                {items.length === 0 ? 'No Items Yet' : `No items match ${getFilterLabel(filterStatus)}`}
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
                const isEditingQuantity = inlineEditing?.id === item.id && inlineEditing.field === 'quantity'
                const isEditingPrice = inlineEditing?.id === item.id && inlineEditing.field === 'price'
                const isEditingImage = inlineEditing?.id === item.id && inlineEditing.field === 'image'
                const isUploading = uploadingImage === item.id
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => !isEditingQuantity && !isEditingPrice && !isEditingImage && handleViewDetail(item)}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer relative"
                  >
                    <div className="relative w-full h-32 rounded-lg mb-3 overflow-hidden">
                      {isEditingImage ? (
                        <div className="flex flex-col items-center justify-center h-full bg-gray-100">
                          <InlineImageEditor item={item} />
                          {isUploading && <div className="text-xs text-purple-600 mt-2">Uploading...</div>}
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
                              onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
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
                          <InlineQuantityEditor item={item} />
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
                            <InlinePriceEditor item={item} />
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => {
                      const status = getStatus(item.quantity)
                      const isEditingQuantity = inlineEditing?.id === item.id && inlineEditing.field === 'quantity'
                      const isEditingPrice = inlineEditing?.id === item.id && inlineEditing.field === 'price'
                      const isEditingImage = inlineEditing?.id === item.id && inlineEditing.field === 'image'
                      const isUploading = uploadingImage === item.id
                      return (
                        <tr key={item.id} className="hover:bg-gray-50" onClick={() => !isEditingQuantity && !isEditingPrice && !isEditingImage && handleViewDetail(item)}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditingImage ? (
                              <div className="flex flex-col">
                                <InlineImageEditor item={item} />
                                {isUploading && <div className="text-xs text-purple-600">Uploading...</div>}
                              </div>
                            ) : item.image_url ? (
                              <div className="relative w-12 h-12 rounded overflow-hidden cursor-pointer hover:opacity-80">
                                <Image src={item.image_url} alt={item.name} fill className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                {isAdmin && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); startInlineEdit('image', item.id); }}
                                    className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow"
                                    title="Change Image"
                                  >
                                    <PencilIcon className="w-3 h-3 text-gray-600" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400 text-xs">No Image</span>
                                {isAdmin && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); startInlineEdit('image', item.id); }}
                                    className="text-purple-600 text-xs hover:underline"
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {isEditingQuantity ? (
                              <InlineQuantityEditor item={item} />
                            ) : (
                              <span 
                                className="font-semibold text-gray-900 cursor-pointer hover:text-purple-600"
                                onDoubleClick={(e) => { e.stopPropagation(); startInlineEdit('quantity', item.id, item.quantity.toString()); }}
                              >
                                {item.quantity}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {isEditingPrice ? (
                              <InlinePriceEditor item={item} />
                            ) : (
                              <span 
                                className="text-gray-900 cursor-pointer hover:text-purple-600"
                                onDoubleClick={(e) => { e.stopPropagation(); startInlineEdit('price', item.id, (item.price ?? 0).toString()); }}
                              >
                                ₱{(item.price ?? 0).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{(item.quantity * (item.price || 0)).toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.inserted_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {(isEditingQuantity || isEditingPrice || isEditingImage) ? (
                              <button
                                onClick={cancelInlineEdit}
                                className="text-gray-500 hover:text-gray-700"
                                title="Cancel"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            ) : isAdmin ? (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                  className="text-purple-600 hover:text-purple-900 p-1 rounded-lg hover:bg-purple-50 transition-colors"
                                  title="Edit"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
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

      {/* Notification Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: -300, y: 50 }} 
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -300, y: 50 }}
            className={`fixed top-4 left-4 z-50 flex items-center space-x-3 px-6 py-4 rounded-lg shadow-xl max-w-sm ${
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

      {/* New Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeDetailModal} // Close on outside click
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()} // Prevent close on modal click
            >
              {/* Close Button */}
              <button
                onClick={closeDetailModal}
                className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>

              {/* Large Image or Placeholder */}
              <div className="relative w-full h-64 rounded-t-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                {selectedItem.image_url ? (
                  <Image
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    fill
                    className="object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <CubeIcon className="w-24 h-24 text-purple-400 opacity-50" />
                )}
              </div>

              {/* Item Details */}
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedItem.name}</h2>
                  {selectedItem.description && (
                    <p className="text-gray-600 text-lg">{selectedItem.description}</p>
                  )}
                </div>

                {/* Status Badge */}
                <div className="text-center">
                  <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium border ${getStatus(selectedItem.quantity).color}`}>
                    {getStatus(selectedItem.quantity).label}
                  </span>
                </div>

                {/* Detailed Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-500 mb-1">Quantity</p>
                    <p className="font-semibold text-gray-900">{selectedItem.quantity}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-500 mb-1">Price</p>
                    <p className="font-semibold text-gray-900">₱{(selectedItem.price ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-500 mb-1">Total Value</p>
                    <p className="font-semibold text-gray-900">₱{(selectedItem.quantity * (selectedItem.price || 0)).toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-500 mb-1">Date Added</p>
                    <p className="text-gray-900">{formatDate(selectedItem.inserted_at)}</p>
                  </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleEditFromDetail(selectedItem)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4 inline mr-2" />
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleDeleteFromDetail(selectedItem.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4 inline mr-2" />
                      Delete
                    </motion.button>
                  </div>
                )}
                {!isAdmin && (
                  <div className="text-center text-gray-500 py-4 border-t">
                    View only
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}