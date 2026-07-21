"use client";

import Link from "next/link";
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
  onReserve: (food: PublicFoodDTO) => void;
  isAuthenticated: boolean;
  userRole?: string;
}

export default function FoodCard({
  food,
  onReserve,
  isAuthenticated,
  userRole,
}: FoodCardProps) {
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
    if (minutesRemaining < 30) return "bg-red-100 text-red-800 border-red-200";
    if (minutesRemaining < 120)
      return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getSupplierBadge = () => {
    if (food.supplierType === "restaurant") {
      return {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: FaStore,
        label: "Restaurant",
      };
    }
    if (food.isHomeCooked) {
      return {
        bg: "bg-pink-100",
        text: "text-pink-800",
        icon: FaUser,
        label: "Home Cook",
      };
    }
    return {
      bg: "bg-purple-100",
      text: "text-purple-800",
      icon: FaHandHoldingHeart,
      label: "NGO",
    };
  };
  const supplierBadge = getSupplierBadge();

  // Available quantity as a fraction of the total listed — the original
  // divided by a hardcoded 10 regardless of the food's actual quantity,
  // so e.g. quantity=20 always clipped to 100% and quantity=3 always
  // showed 30% even when fully available.
  const availablePct =
    food.quantity > 0
      ? Math.min(100, (food.availableQty / food.quantity) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 relative min-h-full flex flex-col justify-between"
    >
      <div className="flex flex-col">
        {/* Image Section */}
        <div className="relative h-48 bg-linear-to-br from-green-100 dark:from-gray-500 via-amber-100 dark:via-gray-600 to-pink-100 dark:to-gray-700 overflow-hidden">
          {food.images && food.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                (food.images.find((img) => img.isPrimary) ?? food.images[0]).url
              }
              alt={food.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center z-10 relative">
                <div className="w-16 h-16 mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-full flex items-center justify-center mb-2 shadow-sm">
                  <FaUtensils className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  No image available
                </p>
              </div>
            </div>
          )}

          {/* Gradient Overlay for better text legibility */}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/10 pointer-events-none" />

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {food.isDonation ? (
              <span className="px-3 py-1.5 bg-linear-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                <FaHandHoldingHeart className="w-3 h-3" />
                FREE DONATION
              </span>
            ) : food.discountPct > 0 ? (
              <span className="px-3 py-1.5 bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                {food.discountPct}% OFF
              </span>
            ) : null}

            <span
              className={`px-3 py-1.5 ${supplierBadge.bg} ${supplierBadge.text} text-xs font-medium rounded-full shadow-lg border border-white/50 backdrop-blur-sm flex items-center gap-1`}
            >
              <supplierBadge.icon className="w-3 h-3" />
              {supplierBadge.label}
            </span>
          </div>

          {/*
            The original rendered this button with no onClick at all — it
            was purely decorative and did nothing when clicked. There's no
            favorites/wishlist API yet, so rather than silently leave it
            dead I've added a "coming soon" toast so it's at least honest
            about not being implemented, instead of doing nothing with no
            feedback.
          */}
          <button
            type="button"
            onClick={() => toast("Favorites coming soon!")}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors duration-200 group/heart"
            aria-label="Save to favorites"
          >
            <FaHeart className="w-4 h-4 text-gray-400 group-hover/heart:text-red-500 transition-colors duration-200" />
          </button>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium border border-white/20">
              <FaClock className="w-3 h-3 text-amber-300" />
              {timeRemaining}
            </div>
            <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/20 shadow-sm">
              <span className="text-green-300 font-bold">
                {food.availableQty}
              </span>{" "}
              {food.quantityUnit} left
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-green-600 transition-colors duration-200 line-clamp-1">
                {food.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                <supplierBadge.icon className="w-3 h-3" />
                {food.supplierName}
              </p>
            </div>
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                {formatPrice(food.price)}
              </div>
              {food.originalPrice !== null &&
                food.originalPrice > food.price && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 line-through">
                    {formatPrice(food.originalPrice)}
                  </div>
                )}
            </div>
          </div>

          {food.averageRating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(food.averageRating)
                        ? "text-yellow-400"
                        : "text-gray-200 dark:text-gray-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({food.reviewCount}{" "}
                {food.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          {food.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
              {food.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getTimeColor()}`}
            >
              <FaClock className="w-3 h-3" />
              {timeRemaining}
            </span>

            {food.allergens?.length > 0 && (
              <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-100">
                ⚠️ {food.allergens.length} allergens
              </span>
            )}

            {!food.isRaw && (
              <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium border border-green-100 flex items-center gap-1">
                <FaShieldAlt className="w-3 h-3" />
                Cooked
              </span>
            )}
          </div>

          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <FaMapMarkerAlt className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{food.pickupAddress}</span>
            {food.distance !== null && (
              <>
                <span className="mx-1">•</span>
                <span className="font-medium whitespace-nowrap">
                  {food.distance.toFixed(1)} km
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col">
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400">Available</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {food.availableQty} {food.quantityUnit}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-linear-to-r from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${availablePct}%` }}
            />
          </div>
        </div>

        {isRestaurantUser ? (
          <Link
            href={`/protected/food/${food.id}`}
            className="w-full py-3 px-4 bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 group/btn shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            <FaUtensils className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-200" />
            View Food Details
          </Link>
        ) : expired ? (
          // <button
          //   disabled
          //   className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-500 rounded-xl font-medium cursor-not-allowed border border-gray-200 dark:border-gray-700"
          // >
          //   Expired
          // </button>
          <Button
            disabled
            variant="outline"
            className="w-full bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-500  cursor-not-allowed"
          >
            <FaClock className="w-4 h-4" />
            Expired
          </Button>
        ) : reserved ? (
          <Button
            disabled
            variant="outline"
            className="w-full bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-500  cursor-not-allowed"
          >
            <FaClock className="w-4 h-4" />
            Reserved
          </Button>
        ) : canReserve ? (
          <Button
            variant="secondary"
            className="w-full bg-gradient-to-r from-green-500 to-lime-500 cursor-pointer group/btn"
            onClick={() => onReserve(food)}
          >
            <FaTag className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-200" />
            Reserve Now
          </Button>
        ) : (
          <Link
            href="/auth/login"
            className="w-full py-3 px-4 bg-white border-2 border-gray-200 hover:border-green-500 text-gray-700 hover:text-green-600 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 group/btn"
          >
            <FaUser className="w-4 h-4" />
            Login to Reserve
          </Link>
        )}
      </div>
    </motion.div>
  );
}
