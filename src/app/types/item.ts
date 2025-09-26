export interface Item {
  id: string
  name: string
  description?: string
  quantity: number
  inserted_at: string
}

export interface Stats {
    totalItems: number
    totalQuantity: number
    lowStock: number
    outOfStock: number
}