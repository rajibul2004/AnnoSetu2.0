export interface FoodImage {
  id: string
  url: string
  isPrimary: boolean
  displayOrder: number
}

export interface FoodSupplier {
  id: string
  name: string | null
  restaurantName?: string | null
  ngoName?: string | null
  profileImage?: string | null
}

export interface Food {
  id: string
  name: string
  description: string | null
  quantity: number
  availableQty?: number
  quantityUnit: string
  isDonation: boolean
  price: number
  originalPrice: number | null
  discountPct: number
  isHomeCooked: boolean
  isRaw: boolean
  cuisineType: string | null
  allergens: string[]
  tags: string[]
  images: FoodImage[]
  pickupAddress: string | null
  address?: string
  expiresAt: string
  createdAt: string
  supplierId: string
  supplierType?: string
  supplierName?: string
  supplier?: FoodSupplier
  isReserved?: boolean
  averageRating?: number
  reviewCount?: number
  distance?: number
}