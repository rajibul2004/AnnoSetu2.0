"use client";
import { Suspense } from "react";

import { useSearchParams } from "next/navigation";
import IndividualDashboard from "@/components/dashboard/IndividualDashboard";
import RestaurantDashboard from "@/components/dashboard/RestaurantDashboard";
import NgoDashboard from "@/components/dashboard/NgoDashboard";

function DashboardContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role")?.toLowerCase();

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
