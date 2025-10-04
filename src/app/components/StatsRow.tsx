import { CubeIcon, ChartBarIcon, ExclamationTriangleIcon, XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { Stats } from '../types/item'

interface StatsRowProps {
  stats: Stats
}

export default function StatsRow({ stats }: StatsRowProps) {
  return (
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
  )
}