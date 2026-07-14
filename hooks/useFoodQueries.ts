"use client";
 
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { SharedFoodDTO, PublicFoodDTO, FoodDetailDTO } from "@/types/food";
 
async function fetchMySharedFood(): Promise<SharedFoodDTO[]> {
  const res = await fetch("/api/food/mine");
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to load your listings");
  }
  return json.data;
}
 
async function deleteFoodRequest(id: string): Promise<void> {
  const res = await fetch(`/api/food/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to remove food item");
  }
}
 
async function addFoodRequest(payload: FormData): Promise<SharedFoodDTO> {
  const res = await fetch("/api/food", { method: "POST", body: payload });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to add food item");
  }
  return json.data;
}
 
export function useMySharedFood() {
  const query = useQuery({
    queryKey: ["mysharedfood"],
    queryFn: fetchMySharedFood,
    retry: false,
  });
 
  return { mySharedFood: query.data ?? [], isLoading: query.isLoading };
}
 
// This mutation didn't exist at all in the original `foodService`
// (`deleteFood` was commented out), so "Remove" on a listing threw
// immediately. Wiring a real endpoint + mutation here fixes that.
export function useDeleteFood() {
  const queryClient = useQueryClient();
 
  const mutation = useMutation({
    mutationFn: deleteFoodRequest,
    onSuccess: () => {
      toast.success("Food item removed");
      queryClient.invalidateQueries({ queryKey: ["mysharedfood"] });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to remove food item"),
  });
 
  return {
    deleteFood: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
 
// Note: no onSuccess toast/invalidation here — the form component
// navigates away on success and shows its own toast, matching the
// original's behavior of redirecting to the dashboard immediately.
export function useAddFood() {
  const queryClient = useQueryClient();
 
  const mutation = useMutation({
    mutationFn: addFoodRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mysharedfood"] });
    },
  });
 
  return {
    addFood: mutation.mutateAsync,
    isAdding: mutation.isPending,
  };
}
 
// ---------------------------------------------------------------------
// Public food listing (AllFood browse page)
// ---------------------------------------------------------------------
 
export interface FoodFilters {
  supplierType: string;
  isDonation: string;
  maxDistance: number;
  minPrice: string;
  maxPrice: string;
  cuisineType: string;
  sortBy: string;
}
 
interface AllFoodResponse {
  data: PublicFoodDTO[];
  total: number;
  totalPages: number;
  count: number;
}
 
async function fetchAllFood(
  filters: FoodFilters,
  search: string,
  page: number,
  limit: number,
): Promise<AllFoodResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy: filters.sortBy,
  });
  if (search) params.set("search", search);
  if (filters.supplierType !== "all") params.set("supplierType", filters.supplierType);
  if (filters.isDonation !== "all") params.set("isDonation", filters.isDonation);
  if (filters.cuisineType !== "all") params.set("cuisineType", filters.cuisineType);
  if (filters.maxDistance) params.set("maxDistance", String(filters.maxDistance));
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
 
  const res = await fetch(`/api/food?${params.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to load food listings");
  }
  return json;
}
 
export function useAllFood(
  filters: FoodFilters,
  search: string,
  page: number,
  limit = 9,
) {
  const query = useQuery({
    queryKey: ["foods", filters, search, page, limit],
    queryFn: () => fetchAllFood(filters, search, page, limit),
    retry: false,
    placeholderData: (previous) => previous, // avoids a flash to empty state while paging
  });
 
  return {
    foods: query.data?.data ?? [],
    meta: query.data
      ? { total: query.data.total, totalPages: query.data.totalPages, count: query.data.count }
      : null,
    isLoading: query.isLoading,
  };
}
 
// ---------------------------------------------------------------------
// Homepage aggregate stats
// ---------------------------------------------------------------------
 
interface FoodStats {
  activeListings: number;
  donations: number;
  uniqueRestaurants: number;
}
 
async function fetchFoodStats(): Promise<FoodStats> {
  const res = await fetch("/api/food/stats");
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to load stats");
  }
  return json.data;
}
 
export function useFoodStats() {
  const query = useQuery({
    queryKey: ["foodStats"],
    queryFn: fetchFoodStats,
    retry: false,
  });
 
  return {
    stats: query.data ?? { activeListings: 0, donations: 0, uniqueRestaurants: 0 },
    isLoading: query.isLoading,
  };
}
 
// ---------------------------------------------------------------------
// Single food-details page
// ---------------------------------------------------------------------
 
async function fetchFoodDetails(id: string): Promise<FoodDetailDTO> {
  const res = await fetch(`/api/food/${id}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to load food details");
  }
  return json.data;
}
 
export function useFoodDetails(id: string) {
  const query = useQuery({
    queryKey: ["food", id],
    queryFn: () => fetchFoodDetails(id),
    retry: false,
    enabled: Boolean(id),
  });
 
  return { food: query.data ?? null, isLoading: query.isLoading, error: query.error as Error | null };
}