// New: src/hooks/useStats.ts
import { useMemo } from 'react'
import { Item, Stats } from '../types/item'

export function useStats(items: Item[]): Stats {
  return useMemo(() => {
    const totalItems = items.length
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const lowStock = items.filter(item => item.quantity > 0 && item.quantity < 10).length
    const outOfStock = items.filter(item => item.quantity === 0).length
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0)
    return { totalItems, totalQuantity, lowStock, outOfStock, totalValue }
  }, [items])
}