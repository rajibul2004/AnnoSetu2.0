"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const ROLE_DASHBOARD: Record<string, string> = {
  restaurant: "/protected/dashboard/restaurant",
  individual: "/protected/dashboard/individual",
  ngo: "/protected/dashboard/ngo",
  admin: "/protected/dashboard/admin",
};

/**
 * Role-aware dashboard redirect.
 *
 * Automatically sends authenticated users to their role-specific dashboard.
 * This eliminates the 404 that previously occurred when visiting /protected/dashboard
 * without a role sub-path.
 */
export default function DashboardRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    const target = ROLE_DASHBOARD[user.role] ?? "/protected/dashboard/individual";
    router.replace(target);
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner text="Redirecting to your dashboard..." />
    </div>
  );
}
