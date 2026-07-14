interface SupplierUserLike {
  role: string;
  individualProfile: { name: string } | null;
  restaurantProfile: { restaurantName: string } | null;
  ngoProfile: { ngoName: string } | null;
}
 
/**
 * The schema has no denormalized supplierName/supplierType on Food (unlike
 * my earlier draft) — the display name has to be resolved from whichever
 * profile matches the supplier's role, at read time.
 */
export function resolveSupplierName(user: SupplierUserLike): string {
  if (user.role === "restaurant") {
    return user.restaurantProfile?.restaurantName ?? "Restaurant";
  }
  if (user.role === "ngo") {
    return user.ngoProfile?.ngoName ?? "NGO";
  }
  return user.individualProfile?.name ?? "Individual";
}
 
interface SupplierPhoneLike {
  role: string;
  individualProfile: { phone: string | null } | null;
  restaurantProfile: { phone: string | null } | null;
  ngoProfile: { phone: string | null } | null;
}
 
export function resolveSupplierPhone(user: SupplierPhoneLike): string | null {
  if (user.role === "restaurant") return user.restaurantProfile?.phone ?? null;
  if (user.role === "ngo") return user.ngoProfile?.phone ?? null;
  return user.individualProfile?.phone ?? null;
}
 
interface SupplierAddressLike {
  role: string;
  individualProfile: { address: string | null } | null;
  restaurantProfile: { address: string | null } | null;
  ngoProfile: { address: string | null } | null;
}
 
export function resolveSupplierAddress(user: SupplierAddressLike): string | null {
  if (user.role === "restaurant") return user.restaurantProfile?.address ?? null;
  if (user.role === "ngo") return user.ngoProfile?.address ?? null;
  return user.individualProfile?.address ?? null;
}
 
export const SUPPLIER_NAME_SELECT = {
  role: true,
  individualProfile: { select: { name: true, phone: true, address: true } },
  restaurantProfile: { select: { restaurantName: true, phone: true, address: true } },
  ngoProfile: { select: { ngoName: true, phone: true, address: true } },
} as const;
 