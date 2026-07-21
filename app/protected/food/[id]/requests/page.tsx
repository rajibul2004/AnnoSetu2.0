import { Suspense } from "react";
import RequestsContent from "./content";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function RequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Loading requests..." />
        </div>
      }
    >
      <RequestsContent />
    </Suspense>
  );
}
