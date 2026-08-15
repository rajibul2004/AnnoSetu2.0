import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaStar, FaTimes, FaSpinner, FaUserCheck } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface UserRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string;
  consumerName: string;
  consumerId: string;
}

export default function UserRatingModal({
  isOpen,
  onClose,
  reservationId,
  consumerName,
  consumerId,
}: UserRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/user-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumerId,
          reservationId,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit rating");

      toast.success("Consumer rated successfully!");
      onClose();
      // Reset state
      setRating(0);
      setComment("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30">
              <FaUserCheck className="text-2xl text-white drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-black mb-1">Rate Consumer</h2>
            <p className="text-blue-100 text-sm font-medium">
              How was your experience with {consumerName}?
            </p>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Rating Stars */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <FaStar
                      className={`w-10 h-10 ${
                        (hoverRating || rating) >= star
                          ? "text-amber-400 drop-shadow-md"
                          : "text-slate-200 dark:text-slate-700"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
                {rating === 0 && "Select a rating"}
              </span>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Add a comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Describe your experience with ${consumerName}...`}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm text-slate-700 dark:text-slate-200 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                {isSubmitting ? <FaSpinner className="animate-spin" /> : "Submit Rating"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
