// New: src/components/Header.tsx
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
              <span>{userEmail}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Logout</span>
            </motion.button>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddItem}
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
  )
}