"use client";
 
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { ProfileDTO } from "@/types/profile";
 
async function fetchProfile(): Promise<ProfileDTO> {
  const res = await fetch("/api/profile");
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to load profile");
  }
  return json.data;
}
 
async function updateProfileRequest(payload: FormData): Promise<void> {
  const res = await fetch("/api/profile", { method: "PATCH", body: payload });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to update profile");
  }
}
 
export function useProfile() {
  const query = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    retry: false,
  });
 
  return { profile: query.data ?? null, isLoading: query.isLoading };
}
 
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { update: updateSession } = useSession();
 
  const mutation = useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Refreshes the NextAuth session so the Navbar/session.user picks
      // up a changed display name immediately, without requiring a
      // full re-login. This replaces the old Firebase AuthContext's
      // updateUser(updatedUser) call, which no longer exists.
      await updateSession();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update profile"),
  });
 
  return {
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
 