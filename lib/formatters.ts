import { format, formatDistanceToNow, isPast } from "date-fns";
 
export function formatDate(date: string | Date | null | undefined, formatStr = "PPpp"): string {
  if (!date) return "N/A";
  return format(new Date(date), formatStr);
}
 
export function formatTimeRemaining(date: string | Date | null | undefined): string {
  if (!date) return "Expired";
  if (isPast(new Date(date))) return "Expired";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
 
// The original mixed "$" (here) and "INR" (in the dashboard's stats banner)
// inconsistently. Standardized to ₹ everywhere since the rest of the app
// (phone numbers, addresses) is India-specific.
export function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `₹${price.toFixed(2)}`;
}