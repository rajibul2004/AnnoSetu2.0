"use client";
 
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ReservationDTO } from "@/types/reservation";
 
async function fetchMyReservations(): Promise<ReservationDTO[]> {
  const res = await fetch("/api/reservations");
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to load reservations");
  }
  return json.data;
}
 
async function cancelReservationRequest(id: string): Promise<ReservationDTO> {
  const res = await fetch(`/api/reservations/${id}/cancel`, { method: "PUT" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to cancel reservation");
  }
  return json.data;
}
 
export function useMyReservations() {
  const query = useQuery({
    queryKey: ["myreservations"],
    queryFn: fetchMyReservations,
    retry: false,
  });
 
  return { reservations: query.data ?? [], isLoading: query.isLoading };
}
 
export function useCancelReservation() {
  const queryClient = useQueryClient();
 
  const mutation = useMutation({
    mutationFn: cancelReservationRequest,
    onSuccess: () => {
      toast.success("Reservation cancelled successfully");
      // This replaces the missing `fetchAllData`/`onRefresh` from the
      // original component — invalidating the query re-fetches it
      // automatically, no manual refresh callback needed.
      queryClient.invalidateQueries({ queryKey: ["myreservations"] });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to cancel reservation"),
  });
 
  return {
    cancelReservation: mutation.mutateAsync,
    isCancelling: mutation.isPending,
  };
}
 