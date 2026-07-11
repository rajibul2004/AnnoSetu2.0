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
 
export const SUPPLIER_NAME_SELECT = {
  role: true,
  individualProfile: { select: { name: true } },
  restaurantProfile: { select: { restaurantName: true } },
  ngoProfile: { select: { ngoName: true } },
} as const;