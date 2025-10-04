// Updated: src/app/view/page.tsx (Integrate DeleteItemModal)
'use client'
import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import AddItemForm from '../components/AddItemForms'
import { Item } from '../types/item'
import { useAuth } from '../hooks/useAuth'
import { useItems } from '../hooks/useItems'
import { useStats } from '../hooks/useStats'
import { useInlineEdit } from '../hooks/useInlineEdit'
import NotificationToast from '../components/NotificationToast'
import StatsRow from '../components/StatsRow'
import SearchControls from '../components/SearchControls'
import FiltersPanel from '../components/FiltersPanel'
import ItemsGrid from '../components/ItemsGrid'
import ItemsList from '../components/ItemsList'
import DetailModal from '../components/DetailModal'
import EmptyState from '../components/EmptyState'
import Header from '../components/Header'
import LogoutModal from '../components/LogoutModal'
import DeleteItemModal from '../components/DeleteItemModal'
import { format } from 'date-fns'

export default function ViewItems() {
  const { user, profile, isAdmin, loading: authLoading, signOut } = useAuth()
  const { items, loading: itemsLoading, deleteItem } = useItems()
  const stats = useStats(items)
  const [itemsState, setItems] = useState<Item[]>(items)

  // Sync items from hook to local state
  useEffect(() => {
    setItems(items)
  }, [items])

  const {
    startInlineEdit,
    handleInlineUpdate,
    handleImageChange,
    cancelInlineEdit,
    inlineEditing,
    tempValue,
    uploadingImage,
    setTempValue
  } = useInlineEdit(itemsState, setItems, isAdmin)

  const [search, setSearch] = useState('')
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pendingDeleteItem, setPendingDeleteItem] = useState<Item | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' })

  const loading = authLoading || itemsLoading

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message })
  }, [])

  const filteredItems = itemsState
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

  const getFilterLabel = useCallback((status: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => {
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
  }, [])

  const handleAdd = useCallback(() => {
    if (!isAdmin) return showNotification('error', 'Only admins can add items.')
    setEditingItem(null)
    setShowModal(true)
  }, [isAdmin, showNotification])

  const handleEdit = useCallback((item: Item) => {
    if (!isAdmin) return showNotification('error', 'Only admins can edit items.')
    setEditingItem(item)
    setShowModal(true)
  }, [isAdmin, showNotification])

  const handleDelete = useCallback((item: Item) => {
    if (!isAdmin) return showNotification('error', 'Only admins can delete items.')
    setPendingDeleteItem(item)
    setShowDeleteModal(true)
  }, [isAdmin, showNotification])

  const handleDeleteConfirm = useCallback(async (id: string) => {
    setShowDeleteModal(false)
    setPendingDeleteItem(null)
    const success = await deleteItem(id)
    if (success) {
      showNotification('success', 'Item deleted successfully.')
    } else {
      showNotification('error', 'Failed to delete item.')
    }
  }, [deleteItem, showNotification])

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false)
    setPendingDeleteItem(null)
  }, [])

  const handleViewDetail = useCallback((item: Item) => {
    setSelectedItem(item)
    setShowDetailModal(true)
  }, [])

  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false)
    setSelectedItem(null)
  }, [])

  const handleEditFromDetail = useCallback((item: Item) => {
    closeDetailModal()
    handleEdit(item)
  }, [closeDetailModal, handleEdit])

  const handleDeleteFromDetail = useCallback((item: Item) => {
    closeDetailModal()
    handleDelete(item)
  }, [closeDetailModal, handleDelete])

  const closeModal = useCallback((updatedItem?: Item) => {
    setShowModal(false)
    const wasEdit = editingItem !== null
    setEditingItem(null)

    if (updatedItem) {
      setItems(prev => {
        const exists = prev.find(i => i.id === updatedItem.id)
        const newItems = exists
          ? prev.map(i => (i.id === updatedItem.id ? updatedItem : i))
          : [updatedItem, ...prev]
        return newItems
      })
      const message = updatedItem.id ? 'Item updated successfully.' : 'Item added successfully.'
      showNotification('success', message)
    } else {
      const message = wasEdit ? 'Failed to update item. Please try again.' : 'Failed to add item. Please try again.'
      showNotification('error', message)
    }
  }, [editingItem, showNotification])

  const handleLogoutOpen = useCallback(() => {
    setShowLogoutModal(true)
  }, [])

  const handleLogoutConfirm = useCallback(async () => {
    setShowLogoutModal(false)
    setIsLoggingOut(true)
    // Immediately redirect without waiting for signOut
    // The signOut will complete in the background
    signOut().catch(error => console.error('Logout error:', error))
    // Use a small timeout to ensure state is set before redirect
    setTimeout(() => {
      window.location.replace('/')
    }, 100)
  }, [signOut])

  const handleLogoutClose = useCallback(() => {
    setShowLogoutModal(false)
  }, [])

  const handleLogout = useCallback(() => {
    handleLogoutOpen()
  }, [handleLogoutOpen])

  const exportToCSV = useCallback(() => {
    const headers = ['Name', 'Description', 'Quantity', 'Price', 'Total Value', 'Status', 'Date Added']
    const rows = filteredItems.map(item => [
      item.name,
      item.description || '',
      item.quantity,
      item.price || 0,
      (item.quantity * (item.price || 0)).toFixed(2),
      item.quantity >= 10 ? 'In Stock' : item.quantity > 0 ? 'Low Stock' : 'Out of Stock',
      format(new Date(item.inserted_at), 'MMM d, yyyy h:mm a')
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
  }, [filteredItems, showNotification])

  if (loading || isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-900">
        <div className="p-8 flex items-center justify-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    // Redirect to homepage if not authenticated
    if (typeof window !== 'undefined') {
      window.location.replace('/')
    }
    return null
  }

  const backgroundStyle = {
    background: `
      radial-gradient(circle at center, rgba(147, 51, 234, 0.2) 0%, 
                      rgba(139, 92, 246, 0.1) 50%, 
                      transparent 100%),
      linear-gradient(to bottom, #4c1d95 0%, #581c87 100%)
    `
  } as React.CSSProperties

  const inlineEditProps = {
    inlineEditing,
    tempValue,
    uploadingImage,
    startInlineEdit,
    cancelInlineEdit,
    handleInlineUpdate,
    handleImageChange,
    setTempValue
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={backgroundStyle}>
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div className="absolute top-20 left-10 w-4 h-4 bg-purple-300 rounded-full" animate={{ y: [0, -30, 0], opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute top-40 right-20 w-3 h-3 bg-purple-200 rounded-full" animate={{ y: [0, 20, 0], opacity: [0.6, 1, 0.6] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
        <motion.div className="absolute bottom-40 left-1/3 w-5 h-5 bg-purple-400 rounded-full" animate={{ y: [0, -15, 0], opacity: [0.7, 1, 0.7] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
        <motion.div className="absolute bottom-20 right-1/4 w-2 h-2 bg-purple-500 rounded-full" animate={{ y: [0, 10, 0], opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }} />
      </motion.div>

      <Header 
        profile={profile} 
        userEmail={user.email || ''} 
        onLogout={handleLogout} 
        onAddItem={handleAdd} 
        isAdmin={isAdmin} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <StatsRow stats={stats} />

        <SearchControls
          search={search}
          onSearchChange={setSearch}
          filteredItemsLength={filteredItems.length}
          totalItemsLength={itemsState.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onExport={exportToCSV}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        <FiltersPanel
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          filterLowStock={filterLowStock}
          onFilterLowStockChange={setFilterLowStock}
          show={showFilters}
        />

        {filteredItems.length === 0 ? (
          <EmptyState 
            hasItems={itemsState.length > 0} 
            filterLabel={getFilterLabel(filterStatus)} 
            isAdmin={isAdmin} 
          />
        ) : viewMode === 'grid' ? (
          <ItemsGrid
            items={filteredItems}
            onViewDetail={handleViewDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isAdmin={isAdmin}
            {...inlineEditProps}
          />
        ) : (
          <ItemsList
            items={filteredItems}
            onViewDetail={handleViewDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isAdmin={isAdmin}
            {...inlineEditProps}
          />
        )}
      </div>

      <NotificationToast 
        show={notification.show} 
        type={notification.type} 
        message={notification.message} 
        onClose={() => setNotification({ show: false, type: 'success', message: '' })} 
      />

      {showModal && (
        <AddItemForm
          item={editingItem}
          onClose={closeModal}
          isEdit={!!editingItem}
        />
      )}

      <DetailModal
        item={selectedItem}
        onClose={closeDetailModal}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
        isAdmin={isAdmin}
        show={showDetailModal}
      />

      <LogoutModal
        show={showLogoutModal}
        onClose={handleLogoutClose}
        onConfirm={handleLogoutConfirm}
      />

      <DeleteItemModal
        show={showDeleteModal}
        item={pendingDeleteItem}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}