"use client";

import React, { useEffect, useState } from "react";
import { FaStar, FaUserCircle } from "react-icons/fa";
import Image from "next/image";
import ReactionBar from "./ReactionBar";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  supplierReply: string | null;
  createdAt: string;
  reviewerName: string;
  reviewerImage: string;
  helpfulCount: number;
}

interface ReviewListProps {
  foodId?: string;
  supplierId?: string;
  title?: string;
  viewerRole?: "restaurant" | "ngo" | "individual" | string;
}

export default function ReviewList({ foodId, supplierId, title = "Recent Reviews", viewerRole }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (foodId) queryParams.append("foodId", foodId);
        if (supplierId) queryParams.append("supplierId", supplierId);

        const res = await fetch(`/api/reviews?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch reviews");

        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (error) {
        console.error("Error loading reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (foodId || supplierId) {
      fetchReviews();
    }
  }, [foodId, supplierId]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl h-32"></div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800/50">
        <FaStar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No reviews yet</h3>
        <p className="text-slate-500 dark:text-slate-400">Be the first to leave a review after your reservation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
        <FaStar className="text-amber-400" /> {title} ({reviews.length})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => {
          let cardBorderClass = "border-slate-100 dark:border-slate-800";
          if (viewerRole === "restaurant") cardBorderClass = "border-blue-100 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700/60";
          if (viewerRole === "ngo") cardBorderClass = "border-purple-100 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700/60";
          if (viewerRole === "individual") cardBorderClass = "border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700/60";

          return (
            <div
              key={review.id}
              className={`p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border transition-all hover:shadow-md flex flex-col justify-between ${cardBorderClass}`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {review.reviewerImage ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden relative">
                    <Image src={review.reviewerImage} alt={review.reviewerName} fill className="object-cover" />
                  </div>
                ) : (
                  <FaUserCircle className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                )}
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{review.reviewerName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(review.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={`w-4 h-4 ${i < review.rating ? "text-amber-400" : "text-slate-200 dark:text-slate-700"}`} />
                ))}
              </div>
            </div>

            {review.comment && (
              <p className="text-slate-600 dark:text-slate-300 text-sm italic mt-2">
                "{review.comment}"
              </p>
            )}

              {review.supplierReply && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 text-sm">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Reply from Supplier:</div>
                  <p className="text-slate-600 dark:text-slate-400">{review.supplierReply}</p>
                </div>
              )}
              </div>
              <ReactionBar reviewId={review.id} initialHelpfulCount={review.helpfulCount || 0} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
