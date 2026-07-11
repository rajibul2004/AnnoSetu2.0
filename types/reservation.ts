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
}
 
export interface ReservationDTO {
  id: string;
  quantity: number;
  totalPrice: number;
  status: ReservationStatus;
  pickupTime: string;
  pickupAddress: string;
  pickupCode: string | null;
  food: ReservationFoodSummary;
}