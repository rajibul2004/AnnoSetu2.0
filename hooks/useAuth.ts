"use client";
 
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";
 
export type UserRole = "restaurant" | "individual" | "ngo" | "admin";
 
export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
  restaurantName?: string;
}
 
export interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isRestaurant: boolean;
  isIndividual: boolean;
  isNGO: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}
 
export function useAuth(): UseAuthResult {
  const { data: session, status } = useSession();
  const router = useRouter();
 
  const user = (session?.user as AuthUser | undefined) ?? null;
  const role = user?.role;
 
  const logout = async () => {
    await nextAuthSignOut({ redirect: false });
    router.push("/auth/login");
  };
 
  return {
    user,
    loading: status === "loading",
    isAuthenticated: status === "authenticated",
    isRestaurant: role === "restaurant",
    isIndividual: role === "individual",
    isNGO: role === "ngo",
    isAdmin: role === "admin",
    logout,
  };
}