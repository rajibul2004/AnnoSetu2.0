export type QuantityUnit = "servings" | "plates" | "kg" | "units" | "packets";
 
// Expanded to match every value the schema's Allergen enum actually
// supports. The original UI only offered 7 of these 11 — sesame,
// shellfish, mustard, and sulphites were never selectable at all.
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
 
export interface SharedFoodDTO {
  id: string;
  name: string;
  description: string | null;
 
  supplierId: string;
  // Not a DB column — the schema has no denormalized name on Food, so
  // this is resolved server-side (see lib/supplier.ts) and attached here
  // purely for display convenience.
  supplierName: string;
 
  quantity: number;
  availableQty: number;
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
}
 
// Derived, not stored — the schema dropped the isExpired/isReserved
// booleans that used to live on Food directly.
export function isFoodExpired(food: Pick<SharedFoodDTO, "expiresAt">): boolean {
  return new Date(food.expiresAt).getTime() <= Date.now();
}
 
export function isFoodReserved(food: Pick<SharedFoodDTO, "availableQty">): boolean {
  return food.availableQty <= 0;
}
 