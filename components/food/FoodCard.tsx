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
  FaArrowRight,
  FaRegHeart,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { formatPrice, formatTimeRemaining } from "@/lib/formatters";
import {
  isFoodExpired,
  isFoodReserved,
  type PublicFoodDTO,
} from "@/types/food";

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
  const canReserve = isAuthenticated && !expired && !reserved && !isRestaurantUser;
  
  const [now] = useState(() => Date.now());
  const timeRemaining = formatTimeRemaining(food.expiresAt);
  const minutesRemaining = Math.floor((new Date(food.expiresAt).getTime() - now) / 60000);

  const getTimeColor = () => {
    if (minutesRemaining < 30)
      return "bg-rose-500/20 text-white border-rose-500/40 shadow-rose-500/20";
    if (minutesRemaining < 120)
      return "bg-amber-500/20 text-white border-amber-500/40 shadow-amber-500/20";
    return "bg-emerald-500/20 text-white border-emerald-500/40 shadow-emerald-500/20";
  };

  const getSupplierInfo = () => {
    switch (food.supplierType) {
      case "restaurant":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50",
          icon: FaStore,
          label: "Restaurant",
        };
      case "individual":
        return {
          bg: "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/50",
          icon: FaUser,
          label: food.isHomeCooked ? "Home Cook" : "Individual",
        };
      case "ngo":
        return {
          bg: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50",
          icon: FaBuilding,
          label: "NGO Partner",
        };
      default:
        return {
          bg: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
          icon: FaHandHoldingHeart,
          label: "Community Partner",
        };
    }
  };

  const supplier = getSupplierInfo();
  const availablePct = food.quantity > 0 ? Math.max(0, Math.min(100, (food.availableQty / food.quantity) * 100)) : 0;
  
  const primaryImage = food.images && food.images.length > 0
    ? (food.images.find((img) => img.isPrimary) ?? food.images[0]).url
    : null;

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

  const renderActionButton = (className: string) => {
    if (isRestaurantUser) {
      return (
        <Link
          href={`/protected/food/${food.id}`}
          onClick={(e) => e.stopPropagation()}
          className={`${className} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 text-white`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">View Listing <FaArrowRight className="w-3.5 h-3.5" /></span>
        </Link>
      );
    }
    if (expired) {
      return (
        <button disabled className={`${className} bg-gray-100 dark:bg-slate-800/80 text-gray-400 border border-gray-200 dark:border-slate-700 cursor-not-allowed`}>
          Expired
        </button>
      );
    }
    if (reserved) {
      return (
        <button disabled className={`${className} bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 cursor-not-allowed`}>
          Fully Reserved
        </button>
      );
    }
    if (canReserve) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onReserve) {
              onReserve(food);
            } else {
              router.push(`/protected/food/${food.id}/reserve`);
            }
          }}
          className={`${className} overflow-hidden group/btn bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 bg-[length:200%_auto] hover:bg-right shadow-emerald-500/30 text-white hover:scale-[1.02]`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <FaTag className="w-4 h-4" /> Reserve Now
          </span>
        </button>
      );
    }
    return (
      <Link
        href="/auth/login"
        onClick={(e) => e.stopPropagation()}
        className={`${className} bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/50`}
      >
        <FaUser className="w-3.5 h-3.5 mr-1" /> Login to Reserve
      </Link>
    );
  };

  // ---------------------------------------------------------------------------
  // LIST VIEW LAYOUT
  // ---------------------------------------------------------------------------
  if (variant === "list") {
    return (
      <div
        onClick={handleCardClick}
        className="group relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[1.25rem] sm:rounded-[1.5rem] border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgb(20,184,166,0.12)] transition-all duration-500 hover:-translate-y-1 overflow-hidden p-2 sm:p-3 flex flex-row items-stretch gap-3 sm:gap-4 cursor-pointer"
      >
        {/* Image Container */}
        <div className="relative w-28 sm:w-40 md:w-56 h-auto min-h-[8.5rem] md:min-h-[10rem] rounded-xl sm:rounded-[1.25rem] overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 shadow-inner">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={food.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <FaUtensils className="w-10 h-10 text-emerald-500/40 mb-2" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600/50">AnnoSetu</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

          {/* Badges Over Image */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5 sm:gap-2 z-10">
            {food.isDonation ? (
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-[9px] sm:text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg shadow-pink-500/30 flex items-center gap-1 sm:gap-1.5 border border-white/20 backdrop-blur-md">
                <FaHandHoldingHeart className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">DONATION</span><span className="sm:hidden">FREE</span>
              </span>
            ) : food.discountPct > 0 ? (
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] sm:text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg shadow-amber-500/30 border border-white/20 backdrop-blur-md">
                {food.discountPct}% OFF
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleHeartClick}
            className="absolute top-3 right-3 w-9 h-9 bg-white/20 dark:bg-black/30 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg border border-white/30 text-white hover:bg-white/40 dark:hover:bg-black/50 transition-all duration-300 z-10 group/heart"
          >
            {isLiked ? (
              <FaHeart className="w-4 h-4 text-rose-500 drop-shadow-md scale-110" />
            ) : (
              <FaRegHeart className="w-4 h-4 group-hover/heart:scale-110 transition-transform" />
            )}
          </button>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
            <div className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border backdrop-blur-xl flex items-center gap-1.5 shadow-lg ${getTimeColor()}`}>
              <FaClock className="w-3 h-3" />
              <span>{timeRemaining}</span>
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="flex-1 w-full flex flex-col justify-between py-1 sm:py-2 pr-1 sm:pr-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${supplier.bg}`}>
                <supplier.icon className="w-3 h-3" />
                <span>{food.supplierName}</span>
              </span>
              {food.cuisineType && (
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                  {food.cuisineType}
                </span>
              )}
              {food.averageRating > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                  <FaStar className="w-3 h-3" />
                  <span>{food.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-start gap-2 sm:gap-4 mb-1">
              <h3 className="text-base sm:text-lg lg:text-xl font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors line-clamp-2 flex-1 leading-snug">
                {food.name}
              </h3>
              <div className="text-right shrink-0">
                <div className="text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white">
                  {food.isDonation ? (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-pink-600">FREE</span>
                  ) : (
                    formatPrice(food.price)
                  )}
                </div>
                {food.originalPrice !== null && !food.isDonation && food.originalPrice > food.price && (
                  <div className="text-[10px] sm:text-xs font-bold text-gray-400 line-through mt-0.5">
                    {formatPrice(food.originalPrice)}
                  </div>
                )}
              </div>
            </div>

            {food.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                {food.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3 text-[11px] text-gray-500 dark:text-gray-400">
              <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/30">
                <FaMapMarkerAlt className="text-rose-500 w-3 h-3" />
              </div>
              <span className="truncate max-w-[200px] sm:max-w-xs">{food.pickupAddress || "Verified pickup location"}</span>
              {food.distance !== null && (
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0 ml-auto">
                  {food.distance.toFixed(1)} km
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex flex-col xl:flex-row xl:items-end gap-3 border-t border-gray-100 dark:border-slate-800/50 pt-3">
            <div className="w-full flex-1">
              <div className="flex justify-between items-center text-[10px] sm:text-[11px] mb-1.5">
                <span className="font-bold text-gray-500 dark:text-gray-400">Available</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  {food.availableQty} / {food.quantity}
                  {food.pendingCount ? (
                     <span className="ml-1 bg-amber-500/10 text-amber-500 px-1 sm:px-1.5 py-0.5 rounded text-[9px] font-black border border-amber-500/20">
                       {food.pendingCount} Waitlisted
                     </span>
                  ) : null}
                </span>
              </div>
              <div className="relative w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${availablePct}%` }}
                />
              </div>
            </div>
            <div className="w-full xl:w-36 shrink-0 mt-1 xl:mt-0">
              {renderActionButton("w-full py-2 sm:py-2.5 px-3 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center transition-all duration-300 shadow-md")}
            </div>
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
      className="group relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 dark:border-white/10 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgb(20,184,166,0.15)] flex flex-col h-full cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={food.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white/70 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner">
              <FaUtensils className="w-8 h-8 text-emerald-500/60" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600/50">AnnoSetu Food</span>
          </div>
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none opacity-50" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {food.isDonation ? (
            <span className="px-3 py-1.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-pink-500/30 flex items-center gap-1.5 border border-white/20 backdrop-blur-md">
              <FaHandHoldingHeart className="w-3 h-3" /> DONATION
            </span>
          ) : food.discountPct > 0 ? (
            <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/30 border border-white/20 backdrop-blur-md">
              {food.discountPct}% OFF
            </span>
          ) : null}
          
          <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg border backdrop-blur-md flex items-center gap-1.5 w-max ${supplier.bg.replace('text-', 'text-white/90 bg-white/20 dark:bg-black/40 border-white/30').replace('dark:text-', '')}`}>
            <supplier.icon className="w-3 h-3 text-white" />
            <span className="text-white">{supplier.label}</span>
          </span>
        </div>

        {/* Top Right Heart */}
        <button
          type="button"
          onClick={handleHeartClick}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 dark:bg-black/30 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg border border-white/30 text-white hover:bg-white/40 dark:hover:bg-black/50 transition-all duration-300 z-10 group/heart"
        >
          {isLiked ? (
            <FaHeart className="w-4 h-4 text-rose-500 drop-shadow-md scale-110" />
          ) : (
            <FaRegHeart className="w-4 h-4 group-hover/heart:scale-110 transition-transform" />
          )}
        </button>

        {/* Bottom Image Info */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
          <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold border backdrop-blur-xl flex items-center gap-1.5 shadow-lg ${getTimeColor()}`}>
            <FaClock className="w-3 h-3" />
            <span>{timeRemaining}</span>
          </div>

          <div className="bg-black/40 backdrop-blur-xl text-white px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/20 shadow-lg flex items-center gap-1.5">
            <span><span className="text-emerald-400 font-extrabold">{food.availableQty}</span> {food.quantityUnit} left</span>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-3 mb-1.5">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">
              <supplier.icon className="text-emerald-500 w-3 h-3" />
              <span className="truncate max-w-[150px]">{food.supplierName}</span>
              {food.averageRating > 0 && (
                <span className="flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                  <FaStar className="w-2.5 h-2.5" />
                  {food.averageRating.toFixed(1)}
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white leading-tight line-clamp-1 group-hover:text-emerald-500 transition-colors">
              {food.name}
            </h3>
          </div>
          
          <div className="text-right shrink-0">
            <div className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
              {food.isDonation ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-pink-600">FREE</span>
              ) : (
                formatPrice(food.price)
              )}
            </div>
            {food.originalPrice !== null && !food.isDonation && food.originalPrice > food.price && (
              <div className="text-xs font-bold text-gray-400 line-through mt-0.5">
                {formatPrice(food.originalPrice)}
              </div>
            )}
          </div>
        </div>

        {food.description && (
          <p className="text-[13px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
            {food.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {food.cuisineType && (
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200/50 dark:border-slate-700/50">
              {food.cuisineType}
            </span>
          )}
          {!food.isRaw && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 text-[10px] font-bold flex items-center gap-1">
              <FaShieldAlt className="w-2.5 h-2.5" /> Cooked
            </span>
          )}
          {food.allergens && food.allergens.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30 text-[10px] font-bold">
              ⚠️ {food.allergens.length} Allergen{food.allergens.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="mt-auto">
          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mb-3 bg-gray-50/50 dark:bg-slate-800/30 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
            <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 shadow-sm">
              <FaMapMarkerAlt className="text-rose-500 w-2.5 h-2.5" />
            </div>
            <span className="truncate flex-1 font-medium">{food.pickupAddress || "Pickup location"}</span>
            {food.distance !== null && (
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                {food.distance.toFixed(1)} km
              </span>
            )}
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center text-[11px] mb-1.5 px-1">
              <span className="font-bold text-gray-500 dark:text-gray-400">Availability</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                {food.availableQty} / {food.quantity}
                {food.pendingCount ? (
                  <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[9px] font-black border border-amber-500/20 uppercase tracking-wide">
                    {food.pendingCount} Pending
                  </span>
                ) : null}
              </span>
            </div>
            <div className="relative w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${availablePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0 mt-1" onClick={(e) => e.stopPropagation()}>
        {renderActionButton("w-full py-2.5 px-4 rounded-xl font-black text-sm flex items-center justify-center transition-all duration-300 shadow-lg")}
      </div>
    </div>
  );
}
