import { CubeIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { Profile } from '../types/item'

interface HeaderProps {
  profile: Profile | null
  userEmail: string
  onLogout: () => void
  onAddItem: () => void
  isAdmin: boolean
}

export default function Header({ profile, userEmail, onLogout, onAddItem, isAdmin }: HeaderProps) {
  return (
    <header className="bg-white/0 relative z-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <CubeIcon className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inventrack</h1>
              <p className="text-xs sm:text-sm text-gray-300 truncate max-w-[200px] sm:max-w-none">Manage your inventory items with style and efficiency</p>
              {profile && <p className="text-xs text-gray-300">Role: {profile.role}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 pt-2 sm:pt-0">
            <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-300 min-w-0">
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">{userEmail}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm hover:bg-red-700 transition-colors flex items-center space-x-1 sm:space-x-2 flex-shrink-0"
            >
              <ArrowRightOnRectangleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Log out</span>
            </motion.button>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddItem}
                className="bg-purple-600 text-white px-3 sm:px-6 py-2 rounded-lg font-medium text-xs sm:text-sm hover:bg-purple-700 transition-colors flex items-center space-x-1 sm:space-x-2 flex-shrink-0"
              >
                <span>+</span>
                <span className="hidden sm:inline">Add New Item</span>
                <span className="sm:hidden">Add Item</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}