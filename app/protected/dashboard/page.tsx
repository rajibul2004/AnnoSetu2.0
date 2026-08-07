"use client";
import { Suspense } from "react";

import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import IndividualDashboard from "@/components/dashboard/IndividualDashboard";
import RestaurantDashboard from "@/components/dashboard/RestaurantDashboard";
import NgoDashboard from "@/components/dashboard/NgoDashboard";

function DashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const role = searchParams.get("role")?.toLowerCase() || user?.role?.toLowerCase();

  switch (role) {
    case "restaurant":
      return <RestaurantDashboard />;
    case "ngo":
      return <NgoDashboard />;
    case "individual":
    default:
      return <IndividualDashboard />;
  }
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
