import { Suspense } from "react";
import RestaurantPickupManager from "../../../../components/reservation/RestaurantPickupManager";

export default function ConfirmReservationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RestaurantPickupManager/>
    </Suspense>
  );
}