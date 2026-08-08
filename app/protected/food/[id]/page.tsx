"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaUtensils,
  FaClock,
  FaMapMarkerAlt,
  FaTag,
  FaShieldAlt,
  FaStar,
  FaHeart,
  FaShare,
  FaStore,
  FaUser,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaPhone,
  FaEnvelope,
  FaBuilding,
  FaRegHeart,
  FaDirections,
  FaTrash,
  FaListUl,
  FaLeaf,
  FaInfoCircle,
  FaHandHoldingHeart,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Button from "@/components/common/Button";
import { formatTimeRemaining, formatPrice, formatDate } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { useFoodDetails } from "@/hooks/useFoodQueries";
import { isFoodExpired, isFoodReserved } from "@/types/food";

export default function FoodDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showSafetyInfo, setShowSafetyInfo] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { food, isLoading } = useFoodDetails(params.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner text="Loading food details..." />
      </div>
    );
  }

  if (!food) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-gray-200/80 dark:border-slate-800"
        >
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/60 rounded-3xl flex items-center justify-center mx-auto mb-5 text-rose-500 text-3xl">
            <FaExclamationTriangle />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            Food Item Not Found
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            This food item may have expired, been claimed, or was deleted by the
            supplier.
          </p>
          <Button
            onClick={() => router.push("/public/food")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg cursor-pointer"
          >
            Explore Available Food
          </Button>
        </motion.div>
      </div>
    );
  }

  const expired = isFoodExpired(food);
  const reserved = isFoodReserved(food.availableQty);
  const isOwner = food.supplierId === user?.id;
  const canReserve = !expired && !reserved && food.availableQty > 0 && !isOwner;

  const getSupplierInfo = () => {
    switch (food.supplierType) {
      case "restaurant":
        return {
          bg: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
          icon: FaStore,
          label: "Restaurant",
        };
      case "individual":
        return {
          bg: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30",
          icon: FaUser,
          label: food.isHomeCooked ? "Home Cook" : "Individual",
        };
      case "ngo":
        return {
          bg: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
          icon: FaBuilding,
          label: "NGO Partner",
        };
      default:
        return {
          bg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          icon: FaUtensils,
          label: "Community Partner",
        };
    }
  };

  const supplier = getSupplierInfo();
  const dashboardHref =
    user?.role === "restaurant"
      ? "/protected/dashboard?role=restaurant"
      : "/protected/dashboard?role=individual";

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this surplus food listing?",
      )
    )
      return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/food/${food.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success("Listing deleted successfully");
      router.push(dashboardHref);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete listing");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleHeartClick = () => {
    setIsLiked(!isLiked);
    if (!isLiked) {
      toast.success(`Saved "${food.name}" to favorites!`);
    } else {
      toast("Removed from favorites");
    }
  };

  const mapsUrl = food.pickupAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(food.pickupAddress)}`
    : null;

  const availablePct =
    food.quantity > 0
      ? Math.max(0, Math.min(100, (food.availableQty / food.quantity) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-transparent py-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <nav className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
            <button
              onClick={() => router.push("/")}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <button
              onClick={() => router.push("/public/food")}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Explore Surplus
            </button>
            <span>/</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[200px] sm:max-w-md">
              {food.name}
            </span>
          </nav>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors shadow-xs cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3" />
            <span>Back</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Columns: Image, Details & Reviews */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-gray-200/80 dark:border-slate-800"
            >
              {/* Image Carousel Hero */}
              <div className="relative h-72 sm:h-96 w-full bg-linear-to-br from-emerald-100 via-teal-50 to-amber-50 dark:from-slate-800 dark:to-slate-900 overflow-hidden group">
                {food.images && food.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      food.images[currentImageIndex]?.url || food.images[0].url
                    }
                    alt={food.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <FaUtensils className="w-16 h-16 text-emerald-500/50 mb-2" />
                    <span className="text-sm font-semibold">AnnoSetu Food</span>
                  </div>
                )}

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                  {food.isDonation ? (
                    <span className="px-3.5 py-1.5 bg-linear-to-r from-purple-600 to-pink-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5 border border-white/20">
                      <FaHandHoldingHeart className="w-3.5 h-3.5" />
                      FREE DONATION
                    </span>
                  ) : food.discountPct > 0 ? (
                    <span className="px-3.5 py-1.5 bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg border border-white/20">
                      {food.discountPct}% OFF
                    </span>
                  ) : null}

                  <span
                    className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl shadow-lg border backdrop-blur-md flex items-center gap-1.5 ${supplier.bg}`}
                  >
                    <supplier.icon className="w-3.5 h-3.5" />
                    <span>{supplier.label}</span>
                  </span>
                </div>

                {/* Top Right Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <button
                    type="button"
                    onClick={handleHeartClick}
                    className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                    aria-label="Save to favorites"
                  >
                    {isLiked ? (
                      <FaHeart className="w-4 h-4 text-rose-500" />
                    ) : (
                      <FaRegHeart className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }}
                    className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg text-gray-700 dark:text-gray-200 hover:text-emerald-600 transition-colors cursor-pointer"
                    aria-label="Share"
                  >
                    <FaShare className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Overlay Pills */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
                  <div className="bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl text-xs font-bold border border-white/15 shadow-lg flex items-center gap-2">
                    <FaClock className="text-emerald-400" />
                    <span>
                      Expires in {formatTimeRemaining(food.expiresAt)}
                    </span>
                  </div>

                  <div className="bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl text-xs font-bold border border-white/15 shadow-lg">
                    <span className="text-emerald-400 font-black">
                      {food.availableQty}
                    </span>{" "}
                    / {food.quantity} {food.quantityUnit} left
                  </div>
                </div>
              </div>

              {/* Multiple Image Thumbnails if more than 1 image */}
              {food.images && food.images.length > 1 && (
                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800 flex gap-2 overflow-x-auto">
                  {food.images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        currentImageIndex === idx
                          ? "border-emerald-500 scale-105 shadow-md"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={`${food.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Card Content */}
              <div className="p-6 sm:p-8">
                {/* Title & Price Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${supplier.bg}`}
                      >
                        <supplier.icon className="w-3.5 h-3.5" />
                        <span>{food.supplierName}</span>
                      </span>

                      {food.cuisineType && (
                        <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-bold">
                          {food.cuisineType}
                        </span>
                      )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                      {food.name}
                    </h1>

                    {food.averageRating > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 text-amber-500 font-bold text-xs">
                        <FaStar className="w-3.5 h-3.5" />
                        <span>{food.averageRating.toFixed(1)}</span>
                        <span className="text-gray-400 font-normal">
                          ({food.reviewCount}{" "}
                          {food.reviewCount === 1 ? "review" : "reviews"})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
                      {food.isDonation ? (
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
                          FREE
                        </span>
                      ) : (
                        formatPrice(food.price)
                      )}
                    </div>
                    {food.originalPrice !== null &&
                      !food.isDonation &&
                      food.originalPrice > food.price && (
                        <div className="text-sm text-gray-400 line-through mt-0.5">
                          Original: {formatPrice(food.originalPrice)}
                        </div>
                      )}
                  </div>
                </div>

                {/* Description */}
                {food.description && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                      About This Listing
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                      {food.description}
                    </p>
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <FaClock className="w-4 h-4 text-emerald-500 mb-1.5" />
                    <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      Available Until
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                      {formatDate(food.expiresAt, "hh:mm a")}
                    </div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                      {expired
                        ? "Expired"
                        : formatTimeRemaining(food.expiresAt)}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <FaTag className="w-4 h-4 text-teal-500 mb-1.5" />
                    <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      Portions Left
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                      {food.availableQty} / {food.quantity}
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                      {food.quantityUnit}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <FaMapMarkerAlt className="w-4 h-4 text-rose-500 mb-1.5" />
                    <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      Distance
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                      {food.distance !== null
                        ? `${food.distance.toFixed(1)} km`
                        : "Nearby"}
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                      Verified Area
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <FaShieldAlt className="w-4 h-4 text-indigo-500 mb-1.5" />
                    <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      Preparation
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <FaCheckCircle className="w-3 h-3" />
                      {food.isRaw ? "Raw Ingredients" : "Fresh Cooked"}
                    </div>
                  </div>
                </div>

                {/* Allergens Notification */}
                {food.allergens && food.allergens.length > 0 && (
                  <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                    <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 mb-2 flex items-center gap-1.5">
                      <FaExclamationTriangle />
                      Allergen Information
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {food.allergens.map((allergen) => (
                        <span
                          key={allergen}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-lg border border-rose-300 dark:border-rose-800 shadow-xs"
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safety Guidelines Collapsible */}
                <div className="p-4 rounded-2xl bg-linear-to-r from-blue-50 to-teal-50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-200/80 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowSafetyInfo((v) => !v)}
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FaShieldAlt className="text-blue-600 dark:text-blue-400 w-4 h-4" />
                      <span className="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-100">
                        AnnoSetu Quality & Food Safety Standards
                      </span>
                    </div>
                    <FaInfoCircle
                      className={`text-blue-500 transition-transform duration-300 ${
                        showSafetyInfo ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {showSafetyInfo && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-blue-900 dark:text-blue-200 mt-3 leading-relaxed">
                          {food.safetyGuidelines ||
                            "All food listed on AnnoSetu meets certified hygiene guidelines. Please inspect your order at pickup and consume within 2 hours for optimal freshness."}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          <FaLeaf className="w-3.5 h-3.5" />
                          <span>Zero-Waste Sustainable Food Distribution</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Customer Reviews Section */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-200/80 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <FaStar className="text-amber-500" />
                  <span>Customer Reviews</span>
                  <span className="text-xs font-semibold text-gray-400">
                    ({food.reviewCount})
                  </span>
                </h3>

                {food.averageRating > 0 && (
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-xl text-xs font-black border border-amber-200 dark:border-amber-900/60">
                    <FaStar className="text-amber-400" />
                    <span>{food.averageRating.toFixed(1)} / 5.0</span>
                  </div>
                )}
              </div>

              {food.reviews && food.reviews.length > 0 ? (
                <div className="space-y-4">
                  {food.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-400 to-teal-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            {review.reviewerName?.charAt(0)?.toUpperCase() ||
                              "U"}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900 dark:text-white">
                              {review.reviewerName}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {formatDate(review.createdAt)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating
                                  ? "text-amber-400"
                                  : "text-gray-200 dark:text-gray-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {review.comment && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed pl-10">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FaUtensils className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold">
                    No reviews submitted yet for this food item.
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: Reservation / Ownership Management Card */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-7 sticky top-24 border border-gray-200/80 dark:border-slate-800 space-y-6"
            >
              {/* Header Title */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <h2 className="text-base font-black text-gray-900 dark:text-white">
                  {isOwner ? "Manage Your Listing" : "Reserve Surplus Food"}
                </h2>
                <span
                  className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-full border ${
                    canReserve
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 border-gray-200 dark:border-slate-700"
                  }`}
                >
                  {canReserve
                    ? "Active & Ready"
                    : isOwner
                      ? "Your Listing"
                      : "Unavailable"}
                </span>
              </div>

              {/* Portions Progress Meter */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-gray-500 dark:text-gray-400">
                    Portion Availability
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {food.availableQty} / {food.quantity} {food.quantityUnit}{" "}
                    left
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${availablePct}%` }}
                  />
                </div>
              </div>

              {/* OWNER MANAGEMENT SECTION */}
              {isOwner ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200">
                    <p className="font-bold mb-1">
                      👑 You are the supplier of this listing
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300">
                      Manage incoming reservation requests, confirm pickup
                      codes, or modify surplus availability.
                    </p>
                  </div>

                  <Link href={`/protected/food/${food.id}/requests`}>
                    <Button
                      fullWidth
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md text-xs cursor-pointer flex items-center justify-center gap-2 mb-2"
                    >
                      <FaListUl />
                      <span>View Reservation Requests</span>
                    </Button>
                  </Link>

                  <Button
                    variant="danger"
                    fullWidth
                    onClick={handleDelete}
                    loading={isDeleting}
                    className="font-bold py-3 rounded-xl shadow-md text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FaTrash />
                    <span>Delete Food Listing</span>
                  </Button>
                </div>
              ) : (
                /* CONSUMER RESERVATION FLOW */
                <div className="space-y-4">
                  {/* If user already has an active reservation for this food */}
                  {food.userReservationId ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2">
                          <FaCheckCircle className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-100">
                          Active Reservation Found
                        </h4>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                          You have already placed a reservation for this food.
                        </p>
                      </div>

                      <Link
                        href={`/protected/reservation/${food.userReservationId}`}
                      >
                        <Button
                          variant="secondary"
                          fullWidth
                          className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg text-xs"
                        >
                          View Your Pickup Code & Pass
                        </Button>
                      </Link>
                    </div>
                  ) : canReserve ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Price per unit:</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {food.isDonation ? "FREE" : formatPrice(food.price)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Available:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {food.availableQty} {food.quantityUnit}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={
                          isAuthenticated
                            ? `/protected/food/${food.id}/reserve`
                            : `/auth/login?next=/protected/food/${food.id}/reserve`
                        }
                      >
                        <Button
                          fullWidth
                          size="lg"
                          variant="secondary"
                          className="bg-linear-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-102 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <FaTag />
                          <span>
                            {isAuthenticated
                              ? "Reserve Food Now"
                              : "Login to Reserve"}
                          </span>
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/60 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-2 text-xl">
                        <FaExclamationTriangle />
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                        {expired
                          ? "Listing has expired"
                          : reserved
                            ? "Fully claimed by other rescuers"
                            : "Unavailable for reservation"}
                      </p>
                      <p className="text-[11px] text-gray-500 mb-4">
                        Discover other surplus meals available in your area.
                      </p>
                      <Link href="/public/food">
                        <Button
                          fullWidth
                          variant="secondary"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs"
                        >
                          Browse Surplus Food
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* SUPPLIER PROFILE & CONTACT CARD */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Provided By
                </h4>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${supplier.bg}`}
                  >
                    <supplier.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-gray-900 dark:text-white truncate">
                      {food.supplierName}
                    </div>
                    <div className="text-[10px] text-gray-400 capitalize">
                      {supplier.label}
                    </div>
                  </div>
                </div>

                {/* Pickup Address & Directions */}
                {food.pickupAddress && (
                  <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-rose-500 shrink-0 mt-0.5 text-xs" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] text-gray-700 dark:text-gray-300 leading-snug">
                          {food.pickupAddress}
                        </div>
                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1.5"
                          >
                            <FaDirections />
                            <span>Open Directions in Maps</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Info toggle if authorized */}
                {(food.supplierPhone || food.supplierEmail) && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowContactInfo((prev) => !prev)}
                      className="w-full text-left text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {showContactInfo
                        ? "Hide Supplier Contact"
                        : "Show Supplier Contact"}
                    </button>

                    {showContactInfo && (
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-800/80 rounded-xl space-y-1.5 text-xs border border-gray-100 dark:border-slate-800">
                        {food.supplierPhone && (
                          <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <FaPhone className="text-emerald-500 text-xs" />
                            <span>{food.supplierPhone}</span>
                          </p>
                        )}
                        {food.supplierEmail && (
                          <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <FaEnvelope className="text-blue-500 text-xs" />
                            <span>{food.supplierEmail}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Action Bar for Small Screens */}
      <div className="lg:hidden fixed bottom-16 sm:bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200/90 dark:border-slate-800 p-3.5 shadow-2xl safe-area-pb">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {food.isDonation ? "Community Meal" : "Discounted Price"}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-gray-900 dark:text-white">
                {food.isDonation ? "FREE" : formatPrice(food.price)}
              </span>
              {food.originalPrice && food.originalPrice > (food.price || 0) && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(food.originalPrice)}
                </span>
              )}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {food.availableQty} {food.quantityUnit} left
            </div>
          </div>

          {isOwner ? (
            <Link
              href={`/protected/food/${food.id}/requests`}
              className="flex-1 max-w-[200px]"
            >
              <Button
                fullWidth
                variant="secondary"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl shadow-md text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FaListUl className="text-xs" />
                <span>Manage ({food.availableQty})</span>
              </Button>
            </Link>
          ) : food.userReservationId ? (
            <Link
              href={`/protected/reservation/${food.userReservationId}`}
              className="flex-1 max-w-[200px]"
            >
              <Button
                fullWidth
                variant="secondary"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-2xl shadow-md text-xs flex items-center justify-center gap-1.5"
              >
                <FaCheckCircle className="text-xs" />
                <span>View Pickup Pass</span>
              </Button>
            </Link>
          ) : canReserve ? (
            <Link
              href={
                isAuthenticated
                  ? `/protected/food/${food.id}/reserve`
                  : `/auth/login?next=/protected/food/${food.id}/reserve`
              }
              className="flex-1 max-w-[220px]"
            >
              <Button
                fullWidth
                className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 text-white font-black py-3 rounded-2xl shadow-lg shadow-emerald-600/30 text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaTag className="text-xs" />
                <span>
                  {isAuthenticated ? "Reserve Surplus" : "Login & Reserve"}
                </span>
              </Button>
            </Link>
          ) : (
            <div className="px-3 py-2 bg-gray-100 dark:bg-slate-800 text-gray-500 text-xs font-bold rounded-xl text-center">
              {expired ? "Expired" : "Claimed"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
