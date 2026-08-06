"use client";
 
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type {
  ReservationDTO,
  ReservationDetailDTO,
  CreateReservationInput,
  PickupVerificationResult,
  RecentPickupDTO,
} from "@/types/reservation";
 
async function fetchMyReservations(): Promise<ReservationDTO[]> {
  const res = await fetch("/api/reservations");
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to load reservations");
  }
  return json.data;
}
 
async function cancelReservationRequest({ id, note }: { id: string; note?: string }): Promise<ReservationDTO> {
  const res = await fetch(`/api/reservations/${id}/cancel`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note ? { note } : {}),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to cancel reservation");
  }
  return json.data;
}
 
const EMPTY_RESERVATIONS: ReservationDTO[] = [];

export function useMyReservations() {
  const query = useQuery({
    queryKey: ["myreservations"],
    queryFn: fetchMyReservations,
    retry: false,
  });
 
  return { reservations: query.data ?? EMPTY_RESERVATIONS, isLoading: query.isLoading };
}
 
async function fetchIncomingRequests(foodId?: string): Promise<ReservationDTO[]> {
  const url = foodId 
    ? `/api/reservations?type=incoming&foodId=${foodId}` 
    : "/api/reservations?type=incoming";
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to load incoming requests");
  }
  return json.data;
}
 
export function useIncomingRequests(foodId?: string) {
  const query = useQuery({
    queryKey: ["incoming-reservations", foodId],
    queryFn: () => fetchIncomingRequests(foodId),
    retry: false,
  });
 
  return { requests: query.data ?? EMPTY_RESERVATIONS, isLoading: query.isLoading };
}
 
export function useCancelReservation() {
  const queryClient = useQueryClient();
 
  const mutation = useMutation({
    mutationFn: cancelReservationRequest,
    onSuccess: (_data, { id }) => {
      toast.success("Reservation cancelled successfully");
      // This replaces the missing `fetchAllData`/`onRefresh` from the
      // original component — invalidating the query re-fetches it
      // automatically, no manual refresh callback needed.
      queryClient.invalidateQueries({ queryKey: ["myreservations"] });
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
      queryClient.invalidateQueries({ queryKey: ["incoming-reservations"] });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to cancel reservation"),
  });
 
  return {
    cancelReservation: mutation.mutateAsync,
    isCancelling: mutation.isPending,
  };
}
 
async function fetchReservationDetails(id: string): Promise<ReservationDetailDTO> {
  const res = await fetch(`/api/reservations/${id}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to load reservation");
  }
  return json.data;
}
 
export function useReservationDetails(id: string) {
  const query = useQuery({
    queryKey: ["reservation", id],
    queryFn: () => fetchReservationDetails(id),
    retry: false,
    enabled: Boolean(id),
  });
 
  return { reservation: query.data ?? null, isLoading: query.isLoading };
}
 
async function confirmReservationRequest(id: string): Promise<void> {
  const res = await fetch(`/api/reservations/${id}/confirm`, { method: "PUT" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to confirm reservation");
  }
}
 
export function useConfirmReservationRequest() {
  const queryClient = useQueryClient();
 
  const mutation = useMutation({
    mutationFn: confirmReservationRequest,
    onSuccess: (_data, id) => {
      toast.success("Reservation confirmed");
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
      queryClient.invalidateQueries({ queryKey: ["myreservations"] });
      queryClient.invalidateQueries({ queryKey: ["incoming-reservations"] });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to confirm reservation"),
  });
 
  return {
    confirmReservation: mutation.mutateAsync,
    isConfirming: mutation.isPending,
  };
}
 
async function createReservationRequest(input: CreateReservationInput): Promise<{ id: string }> {
  const res = await fetch("/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to reserve food");
  }
  return json.data;
}
 
export function useCreateReservation() {
  const queryClient = useQueryClient();
 
  const mutation = useMutation({
    mutationFn: createReservationRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myreservations"] });
    },
  });
 
  return {
    createReservation: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}
 
async function verifyPickupRequest(pickupCode: string): Promise<PickupVerificationResult> {
  const res = await fetch("/api/reservations/verify-pickup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickupCode }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Verification failed");
  }
  return json.data;
}
 
// Replaces the original's fake QR-scan simulation (a setTimeout that
// always "succeeded" without decoding anything) and its OTP tab (no
// schema support, no working handler) with one real, working
// verification path used by both manual code entry and actual QR decode.
export function useVerifyPickup() {
  const queryClient = useQueryClient();
 
  const mutation = useMutation({
    mutationFn: verifyPickupRequest,
    onSuccess: () => {
      toast.success("Pickup verified successfully!");
      queryClient.invalidateQueries({ queryKey: ["recentPickups"] });
      queryClient.invalidateQueries({ queryKey: ["mysharedfood"] });
      queryClient.invalidateQueries({ queryKey: ["incoming-reservations"] });
    },
    onError: (error: Error) => toast.error(error.message || "Verification failed"),
  });
 
  return {
    verifyPickup: mutation.mutateAsync,
    isVerifying: mutation.isPending,
    verificationData: mutation.data,
    reset: mutation.reset,
  };
}
 
async function fetchRecentPickups(): Promise<RecentPickupDTO[]> {
  const res = await fetch("/api/reservations/recent-pickups");
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to load recent pickups");
  }
  return json.data;
}
 
export function useRecentPickups() {
  const query = useQuery({
    queryKey: ["recentPickups"],
    queryFn: fetchRecentPickups,
    retry: false,
  });
 
  return { recentPickups: query.data ?? [], isLoading: query.isLoading, refetch: query.refetch };
}