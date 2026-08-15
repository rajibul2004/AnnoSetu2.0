import { useState } from "react";
import { FaThumbsUp, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

interface ReactionBarProps {
  reviewId: string;
  initialHelpfulCount: number;
}

export default function ReactionBar({ reviewId, initialHelpfulCount }: ReactionBarProps) {
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [hasReacted, setHasReacted] = useState(false); // We don't know initial state from API right now, assuming false for UX simplicity unless implemented
  const [isLoading, setIsLoading] = useState(false);

  const handleReact = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/reviews/${reviewId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "helpful" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to add reaction");
      }

      if (data.action === "added") {
        setHasReacted(true);
        setHelpfulCount(data.helpfulCount);
      } else if (data.action === "removed") {
        setHasReacted(false);
        setHelpfulCount(data.helpfulCount);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-3 flex items-center gap-2 pl-10">
      <button
        onClick={handleReact}
        disabled={isLoading}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
          hasReacted
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700 border border-transparent"
        }`}
      >
        {isLoading ? (
          <FaSpinner className="animate-spin text-[10px]" />
        ) : (
          <FaThumbsUp className={`text-[10px] ${hasReacted ? "-translate-y-0.5" : ""} transition-transform`} />
        )}
        <span>Helpful ({helpfulCount})</span>
      </button>
    </div>
  );
}
