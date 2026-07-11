"use client";
 
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { SharedFoodDTO } from "@/types/food";
 
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
 