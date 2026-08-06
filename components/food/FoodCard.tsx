"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaClock,
  FaMapMarkerAlt,
  FaTag,
  FaShieldAlt,
  FaStar,
  FaHeart,
  FaUtensils,
  FaUser,
  FaStore,
  FaHandHoldingHeart,
  FaBuilding,
  FaCheckCircle,
  FaArrowRight,
  FaExclamationTriangle,
  FaRegHeart,
} from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { formatPrice, formatTimeRemaining } from "@/lib/formatters";
import {
  isFoodExpired,
  isFoodReserved,
  type PublicFoodDTO,
} from "@/types/food";
import Button from "../common/Button";

interface FoodCardProps {
  food: PublicFoodDTO;
  onReserve?: (food: PublicFoodDTO) => void;
  isAuthenticated: boolean;
  userRole?: string;
  variant?: "grid" | "list";
}

export default function FoodCard({
  food,
  onReserve,
  isAuthenticated,
  userRole,
  variant = "grid",
}: FoodCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const expired = isFoodExpired(food);
  const reserved = isFoodReserved(food.availableQty);
  const isRestaurantUser = userRole === "restaurant";
  const canReserve =
    isAuthenticated && !expired && !reserved && !isRestaurantUser;
  const timeRemaining = formatTimeRemaining(food.expiresAt);

  const minutesRemaining = Math.floor(
    (new Date(food.expiresAt).getTime() - Date.now()) / 60000,
  );

  const getTimeColor = () => {
    if (minutesRemaining < 30)
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
    if (minutesRemaining < 120)
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  };

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
          icon: FaHandHoldingHeart,
          label: "Community Partner",
        };
    }
  };

  const supplier = getSupplierInfo();

  // Availability percentage calculation
  const availablePct =
    food.quantity > 0
      ? Math.max(0, Math.min(100, (food.availableQty / food.quantity) * 100))
      : 0;

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    if (!isLiked) {
      toast.success(`Saved "${food.name}" to favorites!`);
    } else {
      toast("Removed from favorites");
    }
  };

  const handleCardClick = () => {
    router.push(`/protected/food/${food.id}`);
  };

  const primaryImage =
    food.images && food.images.length > 0
      ? (food.images.find((img) => img.isPrimary) ?? food.images[0]).url
      : null;

  // ---------------------------------------------------------------------------
  // LIST VIEW LAYOUT
  // ---------------------------------------------------------------------------
  if (variant === "list") {
    return (
      <div
        onClick={handleCardClick}
        className="group relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden p-5 flex flex-col md:flex-row items-center gap-6 cursor-pointer"
      >
        {/* Left: Image Container */}
        <div className="relative w-full md:w-56 h-48 md:h-44 rounded-2xl overflow-hidden bg-linear-to-br from-emerald-100 to-teal-50 dark:from-slate-800 dark:to-slate-900 shrink-0">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage}
              alt={food.name}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <FaUtensils className="w-10 h-10 text-emerald-500/40 mb-1" />
              <span className="text-xs font-semibold">AnnoSetu Food</span>
            </div>
          )}

          {/* Badges Over Image */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {food.isDonation ? (
              <span className="px-2.5 py-1 bg-linear-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-md flex items-center gap-1">
                <FaHandHoldingHeart className="w-2.5 h-2.5" />
                FREE DONATION
              </span>
            ) : food.discountPct > 0 ? (
              <span className="px-2.5 py-1 bg-linear-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-md">
                {food.discountPct}% OFF
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleHeartClick}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center shadow-md text-gray-400 hover:text-rose-500 transition-colors z-10"
            aria-label="Save to favorites"
          >
            {isLiked ? (
              <FaHeart className="w-4 h-4 text-rose-500" />
            ) : (
              <FaRegHeart className="w-4 h-4" />
            )}
          </button>

          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-md ${getTimeColor()}`}
            >
              ⏳ {timeRemaining}
            </span>
          </div>
        </div>

        {/* Center: Info Details */}
        <div className="flex-1 w-full flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${supplier.bg}`}
              >
                <supplier.icon className="w-3 h-3" />
                <span>{food.supplierName}</span>
              </span>

              {food.cuisineType && (
                <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-[11px] font-semibold">
                  {food.cuisineType}
                </span>
              )}

              {food.averageRating > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 text-[11px] font-black">
                  <FaStar className="w-3 h-3 text-amber-400" />
                  <span>{food.averageRating.toFixed(1)}</span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    ({food.reviewCount})
                  </span>
                </div>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
              {food.name}
            </h3>

            {food.description && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 leading-relaxed">
                {food.description}
              </p>
            )}

            {/* Address & Distance */}
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1 min-w-0">
                <FaMapMarkerAlt className="text-rose-500 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-xs">
                  {food.pickupAddress || "Verified pickup location"}
                </span>
              </div>
              {food.distance !== null && (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                  • {food.distance.toFixed(1)} km away
                </span>
              )}
            </div>
          </div>

          {/* Portion Bar */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-gray-600 dark:text-gray-300">
                Available Portions:
              </span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {food.availableQty}{" "}
                <span className="text-gray-400 font-normal">
                  / {food.quantity} {food.quantityUnit}
                </span>
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${availablePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Pricing & CTA */}
        <div
          className="w-full md:w-48 shrink-0 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full text-left md:text-right mb-4">
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {food.isDonation ? (
                <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
                  FREE
                </span>
              ) : (
                formatPrice(food.price)
              )}
            </div>
            {food.originalPrice !== null && !food.isDonation && food.originalPrice > food.price && (
              <div className="text-xs text-gray-400 line-through">
                {formatPrice(food.originalPrice)}
              </div>
            )}
          </div>

          <div className="w-full">
            {isRestaurantUser ? (
              <Link
                href={`/protected/food/${food.id}`}
                className="w-full py-2.5 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <span>View Listing</span>
                <FaArrowRight className="w-3 h-3" />
              </Link>
            ) : expired ? (
              <button
                disabled
                className="w-full py-2.5 px-4 bg-gray-100 dark:bg-slate-800 text-gray-400 rounded-xl font-bold text-xs cursor-not-allowed border border-gray-200 dark:border-slate-700"
              >
                Expired
              </button>
            ) : reserved ? (
              <button
                disabled
                className="w-full py-2.5 px-4 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl font-bold text-xs cursor-not-allowed border border-amber-200 dark:border-amber-800/60"
              >
                Fully Reserved
              </button>
            ) : canReserve ? (
              <button
                type="button"
                onClick={() =>
                  onReserve ? onReserve(food) : router.push(`/protected/food/${food.id}/reserve`)
                }
                className="w-full py-2.5 px-4 bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/30 hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaTag className="w-3 h-3" />
                <span>Reserve Now</span>
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="w-full py-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Login to Reserve</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // GRID VIEW LAYOUT (DEFAULT)
  // ---------------------------------------------------------------------------
  return (
    <div
      onClick={handleCardClick}
      className="group bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-md hover:shadow-2xl border border-gray-200/80 dark:border-slate-800 overflow-hidden transition-all duration-300 flex flex-col justify-between h-full relative cursor-pointer"
    >
      <div>
        {/* Image Container */}
        <div className="relative h-52 w-full bg-linear-to-br from-emerald-100 via-teal-50 to-amber-50 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage}
              alt={food.name}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <div className="w-16 h-16 rounded-2xl bg-white/70 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-center mb-2 shadow-sm">
                <FaUtensils className="w-8 h-8 text-emerald-500/60" />
              </div>
              <span className="text-xs font-bold text-gray-400">AnnoSetu Food</span>
            </div>
          )}

          {/* Dark gradient for legibility */}
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-black/30 pointer-events-none" />

          {/* Top Left Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {food.isDonation ? (
              <span className="px-3 py-1 bg-linear-to-r from-purple-600 to-pink-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5 border border-white/20">
                <FaHandHoldingHeart className="w-3 h-3" />
                FREE DONATION
              </span>
            ) : food.discountPct > 0 ? (
              <span className="px-3 py-1 bg-linear-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg border border-white/20">
                {food.discountPct}% OFF
              </span>
            ) : null}

            <span
              className={`px-3 py-1 text-[11px] font-extrabold rounded-xl shadow-lg border backdrop-blur-md flex items-center gap-1.5 ${supplier.bg}`}
            >
              <supplier.icon className="w-3 h-3" />
              <span>{supplier.label}</span>
            </span>
          </div>

          {/* Top Right Heart Favorite Button */}
          <button
            type="button"
            onClick={handleHeartClick}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg text-gray-400 hover:text-rose-500 transition-colors duration-200 z-10"
            aria-label="Save to favorites"
          >
            {isLiked ? (
              <FaHeart className="w-4 h-4 text-rose-500" />
            ) : (
              <FaRegHeart className="w-4 h-4" />
            )}
          </button>

          {/* Bottom Pill Row over Image */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
            <div
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border backdrop-blur-md flex items-center gap-1.5 shadow-md ${getTimeColor()}`}
            >
              <FaClock className="w-3 h-3" />
              <span>{timeRemaining}</span>
            </div>

            <div className="bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[11px] font-bold border border-white/15 shadow-md">
              <span className="text-emerald-300 font-extrabold">
                {food.availableQty}
              </span>{" "}
              {food.quantityUnit} left
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {/* Supplier Name & Rating */}
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <supplier.icon className="text-emerald-500" />
              <span className="truncate max-w-[150px]">{food.supplierName}</span>
            </span>

            {food.averageRating > 0 && (
              <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900/40">
                <FaStar className="w-3 h-3" />
                <span>{food.averageRating.toFixed(1)}</span>
                <span className="text-[10px] text-gray-400 font-normal">
                  ({food.reviewCount})
                </span>
              </div>
            )}
          </div>

          {/* Food Title & Price */}
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 flex-1">
              {food.name}
            </h3>

            <div className="text-right shrink-0">
              <div className="text-xl font-black text-gray-900 dark:text-white">
                {food.isDonation ? (
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
                    FREE
                  </span>
                ) : (
                  formatPrice(food.price)
                )}
              </div>
              {food.originalPrice !== null && !food.isDonation && food.originalPrice > food.price && (
                <div className="text-xs text-gray-400 line-through">
                  {formatPrice(food.originalPrice)}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {food.description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed mb-3">
              {food.description}
            </p>
          )}

          {/* Details & Dietary Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {food.cuisineType && (
              <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-[10px] font-bold">
                {food.cuisineType}
              </span>
            )}
            {!food.isRaw && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-[10px] font-bold flex items-center gap-1">
                <FaShieldAlt className="w-2.5 h-2.5" />
                Freshly Cooked
              </span>
            )}
            {food.allergens && food.allergens.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 text-[10px] font-bold">
                ⚠️ {food.allergens.length} Allergen{food.allergens.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {/* Location & Distance */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
            <FaMapMarkerAlt className="text-rose-500 shrink-0" />
            <span className="truncate">{food.pickupAddress || "Pickup location"}</span>
            {food.distance !== null && (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                • {food.distance.toFixed(1)} km
              </span>
            )}
          </div>

          {/* Portion Availability Progress Bar */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-[11px] mb-1.5">
              <span className="font-semibold text-gray-500 dark:text-gray-400">
                Availability
              </span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {food.availableQty} / {food.quantity} {food.quantityUnit}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${availablePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div
        className="p-5 pt-0"
        onClick={(e) => e.stopPropagation()}
      >
        {isRestaurantUser ? (
          <Link
            href={`/protected/food/${food.id}`}
            className="w-full py-3 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <span>View Food Listing</span>
            <FaArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : expired ? (
          <button
            disabled
            className="w-full py-3 px-4 bg-gray-100 dark:bg-slate-800 text-gray-400 rounded-2xl font-bold text-xs cursor-not-allowed border border-gray-200 dark:border-slate-700"
          >
            Expired
          </button>
        ) : reserved ? (
          <button
            disabled
            className="w-full py-3 px-4 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-2xl font-bold text-xs cursor-not-allowed border border-amber-200 dark:border-amber-800/60"
          >
            Fully Reserved
          </button>
        ) : canReserve ? (
          <button
            type="button"
            onClick={() =>
              onReserve ? onReserve(food) : router.push(`/protected/food/${food.id}/reserve`)
            }
            className="w-full py-3 px-4 bg-linear-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FaTag className="w-3.5 h-3.5" />
            <span>Reserve Now</span>
          </button>
        ) : (
          <Link
            href="/auth/login"
            className="w-full py-3 px-4 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <FaUser className="w-3.5 h-3.5" />
            <span>Login to Reserve</span>
          </Link>
        )}
      </div>
    </div>
  );
}
