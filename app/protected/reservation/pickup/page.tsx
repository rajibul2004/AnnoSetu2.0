import { Suspense } from "react";
import PickupManager from "../../../../components/reservation/PickupManager";

export default function PickupScannerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PickupManager/>
    </Suspense>
  );
}