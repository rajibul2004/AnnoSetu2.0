"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { FaInbox, FaCheckCircle, FaTimesCircle, FaClock, FaArrowRight, FaArrowLeft, FaUtensils } from "react-icons/fa";
import { useIncomingRequests } from "@/hooks/useReservationQueries";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatDate } from "@/lib/formatters";
import Button from "@/components/common/Button";
import Link from "next/link";
import { useFoodDetails } from "@/hooks/useFoodQueries";

export default function RequestsContent() {
  const params = useParams();
  const foodId = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requests, isLoading: requestsLoading } = useIncomingRequests(foodId);
  const { food, isLoading: foodLoading } = useFoodDetails(foodId);

  const searchParams = useSearchParams();
  const initialFilter = searchParams?.get("filter") || "all";
  const [filter, setFilter] = useState(initialFilter);

  const isLoading = requestsLoading || foodLoading;

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    return req.status === filter;
  });

  // Sort: pending first, then others by date descending
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner text="Loading incoming requests..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-300 mb-2 transition-colors text-sm"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaInbox className="text-green-600 dark:text-green-300" />
              Requests for &quot;{food?.name}&quot;
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2">
              <FaUtensils className="text-gray-400" />
              {requests.length} total request{requests.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Filter Header */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Pending" },
            { id: "confirmed", label: "Confirmed" },
            { id: "picked_up", label: "Picked Up" },
            { id: "cancelled", label: "Cancelled" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f.id
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {sortedRequests.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center justify-center">
            <FaInbox className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No requests yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              When a user reserves one of your food listings, it will appear here for you to confirm or cancel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedRequests.map((request, index) => {
              const isPending = request.status === "pending";
              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`card overflow-hidden flex flex-col ${isPending ? "border-l-4 border-l-yellow-400" : ""}`}
                >
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          request.status === "confirmed" || request.status === "picked_up"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {request.status === "confirmed" || request.status === "picked_up" ? (
                          <FaCheckCircle className="w-3.5 h-3.5" />
                        ) : request.status === "pending" ? (
                          <FaClock className="w-3.5 h-3.5" />
                        ) : (
                          <FaTimesCircle className="w-3.5 h-3.5" />
                        )}
                        {request.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(request.createdAt, "MMM d, h:mm a")}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {request.food.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {request.quantity} {request.food.quantityUnit} requested
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">By:</span>
                        <span className="font-medium text-gray-900 dark:text-white text-right line-clamp-1">
                          {request.reserverName || "Unknown User"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {request.reserverPhone || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                    <Link href={`/protected/reservation/${request.id}/confirm`}>
                      <Button fullWidth variant={isPending ? "primary" : "outline"} className={isPending ? "animate-pulse shadow-md" : ""}>
                        {isPending ? "Review Request" : "View Details"}
                        <FaArrowRight className="ml-2" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
