import { Suspense } from "react";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import PickupManager from "@/components/reservation/PickupManager";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function PickupScannerPage() {
  return (
    <div className="min-h-screen bg-transparent py-6 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <nav className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
            <Link
              href="/protected/dashboard"
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Pickup Verification
            </span>
          </nav>

          <Link
            href="/protected/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors shadow-xs cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3" />
            <span>Dashboard</span>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <LoadingSpinner text="Initializing pickup verification station..." />
            </div>
          }
        >
          <PickupManager />
        </Suspense>
      </div>
    </div>
  );
}