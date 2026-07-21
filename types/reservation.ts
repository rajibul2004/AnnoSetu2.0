export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "picked_up"
  | "cancelled"
  | "expired";
 
export interface ReservationFoodSummary {
  id: string;
  name: string;
  quantityUnit: string;
  originalPrice: number | null;
  supplierId: string;
  // Resolved server-side from the supplier's role-specific profile —
  // see lib/supplier.ts. Not a column on Food.
  supplierName: string;
  images?: { id: string; url: string; isPrimary: boolean; displayOrder: number }[];
}
 
export interface ReservationDTO {
  id: string;
  quantity: number;
  totalPrice: number;
  status: ReservationStatus;
  pickupTime: string;
  pickupAddress: string;
  pickupCode: string | null;
  createdAt: string;
  food: ReservationFoodSummary;
  reserverName?: string;
  reserverPhone?: string | null;
}
 
// ---------------------------------------------------------------------
// Reservation detail / confirm page
// ---------------------------------------------------------------------
 
export interface ReservationDetailFood {
  id: string;
  name: string;
  description: string | null;
  quantityUnit: string;
  expiresAt: string;
  images: { id: string; url: string; isPrimary: boolean; displayOrder: number }[];
}
 
export interface ReservationReserverInfo {
  name: string;
  phone: string | null;
  email: string;
  address: string | null;
}
 
export interface ReservationDetailDTO {
  id: string;
  status: ReservationStatus;
  quantity: number;
  totalPrice: number;
  pickupTime: string;
  pickupCode: string | null;
  createdAt: string;
  supplierId: string;
  reserverId: string;
  pickupAddress: string;
  food: ReservationDetailFood;
  reserver: ReservationReserverInfo;
  supplierName: string;
  supplierPhone: string | null;
  supplierEmail: string;
  totalOrders: number;
  isSupplierView: boolean;
}
 
export interface CreateReservationInput {
  foodId: string;
  quantity: number;
  pickupTime: string;
  acceptedTerms: boolean;
}
 
export interface PickupVerificationResult {
  id: string;
  foodName: string;
  quantity: number;
}
 
export interface RecentPickupDTO {
  id: string;
  pickupCode: string | null;
  foodName: string;
  pickedUpAt: string;
}