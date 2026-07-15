import { Suspense } from "react";
import ConfirmReservationContent from "./content";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function ConfirmReservationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Loading reservation..." />
        </div>
      }
    >
      <ConfirmReservationContent />
    </Suspense>
  );
}