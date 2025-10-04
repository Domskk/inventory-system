export interface Item {
  id: string
  name: string
  description?: string
  quantity: number
  price? : number
  image_url?: string
  inserted_at: string // updated timestamp on eah update
}

export interface Stats {
    totalItems: number
    totalQuantity: number
    lowStock: number
    outOfStock: number
    totalValue: number
}

export interface Profile {
  id: string
  role: 'user' | 'admin'
}