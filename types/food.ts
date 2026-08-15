export type QuantityUnit = "servings" | "plates" | "kg" | "units" | "packets";

export type Allergen =
  | "nuts"
  | "dairy"
  | "gluten"
  | "seafood"
  | "eggs"
  | "soy"
  | "sesame"
  | "shellfish"
  | "mustard"
  | "sulphites"
  | "other";
 
export interface FoodImageDTO {
  id: string;
  url: string;
  isPrimary: boolean;
  displayOrder: number;
}
 
export interface SharedFoodReservationSummary {
  id: string;
  quantity: number;
  status: "pending" | "confirmed" | "picked_up" | "cancelled" | "expired";
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  pickupTime: string;
  createdAt: string;
  reserverName?: string;
}

export interface SharedFoodDTO {
  id: string;
  name: string;
  description: string | null;

  supplierId: string;
  supplierName: string;

  quantity: number;
  availableQty: number;
  confirmedQty?: number;
  pendingQty?: number;
  pendingCount?: number;
  confirmedCount?: number;
  quantityUnit: QuantityUnit;

  isDonation: boolean;
  price: number;
  originalPrice: number | null;
  discountPct: number;

  isHomeCooked: boolean;
  isActive: boolean;
  deletedAt: string | null;

  expiresAt: string;

  images: FoodImageDTO[];
  averageRating: number;
  reviewCount: number;
  reservations?: SharedFoodReservationSummary[];
}

export function isFoodExpired(food: Pick<SharedFoodDTO, "expiresAt">): boolean {
  return new Date(food.expiresAt).getTime() <= Date.now();
}

export function isFoodReserved(availableQty: number): boolean {
  return availableQty <= 0;
}
  
export interface PublicFoodDTO {
  id: string;
  name: string;
  description: string | null;
  supplierId: string;
  supplierName: string;
  supplierType: "restaurant" | "individual" | "ngo" | "admin";
  isHomeCooked: boolean;
  quantity: number;
  availableQty: number;
  quantityUnit: QuantityUnit;
  isDonation: boolean;
  price: number;
  originalPrice: number | null;
  discountPct: number;
  isRaw: boolean;
  allergens: Allergen[];
  cuisineType: string | null;
  pickupAddress: string | null;
  expiresAt: string;
  images: FoodImageDTO[];
  averageRating: number;
  reviewCount: number;
  pendingCount?: number;
  distance: number | null;
}
 
export interface FoodListMeta {
  total: number;
  totalPages: number;
  count: number;
}

 
export interface FoodReviewDTO {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string;
  supplierReply: string | null;
}
 
export interface FoodDetailDTO extends PublicFoodDTO {
  safetyGuidelines: string | null;
  viewCount: number;
  supplierPhone: string | null;
  supplierEmail: string | null;
  reviews: FoodReviewDTO[];
  userReservationId?: string | null;
}