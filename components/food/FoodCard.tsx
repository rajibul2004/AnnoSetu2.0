"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
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
} from "react-icons/fa"
import { formatPrice, formatTimeRemaining, truncateText } from "@/formater/formater"
import type { Food } from "@/types/food"
import type { User } from "@/types/auth"

export interface FoodCardProps {
  food: Food
  onReserve: (food: Food) => void
  user?: User | null
  isFavorite?: boolean
  onFavoriteToggle?: (foodId: string) => void
}

const FoodCard: React.FC<FoodCardProps> = ({
  food,
  onReserve,
  user,
  isFavorite = false,
  onFavoriteToggle,
}) => {
  const isExpired = new Date(food.expiresAt) < new Date()
  const isReserved = food.isReserved || food.availableQty === 0
  const canReserve = !!user && !isExpired && !isReserved
  const timeRemaining = formatTimeRemaining(food.expiresAt)

  // Determine time remaining color
  const getTimeColor = (): string => {
    const minutes = parseInt(timeRemaining)
    if (timeRemaining.includes("min") && minutes < 30) {
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
    }
    if (timeRemaining.includes("hour") && minutes < 2) {
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800"
    }
    return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
  }

  // Get supplier badge
  const getSupplierBadge = () => {
    const supplierType = food.supplierType || (food.isHomeCooked ? "individual" : "restaurant")
    
    if (supplierType === "restaurant") {
      return {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-800 dark:text-blue-300",
        icon: FaStore,
        label: "Restaurant",
      }
    }
    if (food.isHomeCooked) {
      return {
        bg: "bg-pink-100 dark:bg-pink-900/30",
        text: "text-pink-800 dark:text-pink-300",
        icon: FaUser,
        label: "Home Cook",
      }
    }
    return {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-800 dark:text-purple-300",
      icon: FaHandHoldingHeart,
      label: food.supplier?.ngoName || "NGO",
    }
  }

  const supplierBadge = getSupplierBadge()

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFavoriteToggle?.(food.id)
  }

  const handleReserveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onReserve(food)
  }

  // Get display name for supplier
  const getSupplierDisplayName = (): string => {
    if (food.supplier?.restaurantName) return food.supplier.restaurantName
    if (food.supplier?.ngoName) return food.supplier.ngoName
    if (food.supplier?.name) return food.supplier.name
    return food.supplierName || "Unknown"
  }

  // Calculate availability percentage (max 100%)
  const availabilityPercentage = Math.min(100, (food.availableQty || food.quantity) / 10 * 100)

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
        <div className="relative h-48 bg-gradient-to-br from-green-100 dark:from-gray-500 via-amber-100 dark:via-gray-600 to-pink-100 dark:to-gray-700 overflow-hidden">
          {food.images && food.images.length > 0 ? (
            <Image
              src={food.images[0].url}
              alt={food.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-full flex items-center justify-center mb-2">
                  <FaUtensils className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  No image available
                </p>
              </div>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {/* Discount/Donation Badge */}
            {food.isDonation ? (
              <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                <FaHandHoldingHeart className="w-3 h-3" />
                FREE DONATION
              </span>
            ) : (food.discountPct ?? 0) > 0 ? (
              <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                {(food.discountPct ?? 0)}% OFF
              </span>
            ) : null}

            {/* Supplier Type Badge */}
            <span
              className={`
                px-3 py-1.5
                ${supplierBadge.bg} ${supplierBadge.text}
                text-xs font-medium rounded-full shadow-lg border border-white/50 backdrop-blur-sm flex items-center gap-1
              `}
            >
              <supplierBadge.icon className="w-3 h-3" />
              {supplierBadge.label}
            </span>
          </div>

          {/* Favorite Button */}
          {onFavoriteToggle && (
            <button
              onClick={handleFavoriteClick}
              className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors duration-200 group/heart"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <FaHeart
                className={`w-4 h-4 transition-colors duration-200 ${
                  isFavorite
                    ? "text-red-500 fill-red-500"
                    : "text-gray-400 group-hover/heart:text-red-500"
                }`}
              />
            </button>
          )}

          {/* Expiry Timer */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="bg-black/60 dark:bg-white/60 backdrop-blur-sm text-white dark:text-gray-900 px-3 py-2 rounded-lg flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <FaClock className="w-3 h-3" />
                {timeRemaining}
              </span>
              <span>
                {food.availableQty || food.quantity} {food.quantityUnit} left
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col justify-between h-full">
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <Link href={`/food/${food.id}`}>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-green-600 transition-colors duration-200 line-clamp-1">
                  {food.name}
                </h3>
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                <supplierBadge.icon className="w-3 h-3" />
                {getSupplierDisplayName()}
              </p>
            </div>
            <div className="text-right ml-4">
              {food.isDonation ? (
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  FREE
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatPrice(food.price)}
                  </div>
                  {food.originalPrice && food.originalPrice > food.price && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 line-through">
                      {formatPrice(food.originalPrice)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Rating */}
          {(food.averageRating ?? 0) > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(food.averageRating ?? 0)
                        ? "text-yellow-400"
                        : "text-gray-200 dark:text-gray-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({food.reviewCount ?? 0} {(food.reviewCount ?? 0) === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          {/* Description */}
          {food.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
              {food.description}
            </p>
          )}

          {/* Info Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getTimeColor()}`}
            >
              <FaClock className="w-3 h-3" />
              {timeRemaining}
            </span>

            {food.allergens && food.allergens.length > 0 && (
              <span className="px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium border border-red-100 dark:border-red-800">
                ⚠️ {food.allergens.length} allergen{food.allergens.length !== 1 ? "s" : ""}
              </span>
            )}

            {!food.isRaw && (
              <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium border border-green-100 dark:border-green-800 flex items-center gap-1">
                <FaShieldAlt className="w-3 h-3" />
                Cooked
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <FaMapMarkerAlt className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{food.pickupAddress || food.address || "Address not specified"}</span>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col">
        {/* Quantity Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400">Available</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {food.availableQty ?? food.quantity} {food.quantityUnit}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${availabilityPercentage}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        {isExpired ? (
          <button
            disabled
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-xl font-medium cursor-not-allowed border border-gray-200 dark:border-gray-700"
          >
            Expired
          </button>
        ) : isReserved ? (
          <button
            disabled
            className="w-full py-3 px-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-xl font-medium cursor-not-allowed border border-yellow-200 dark:border-yellow-800 flex items-center justify-center gap-2"
          >
            <FaClock className="w-4 h-4" />
            Reserved
          </button>
        ) : canReserve ? (
          <button
            onClick={handleReserveClick}
            className="w-full cursor-pointer py-3 px-4 bg-gradient-to-r from-green-500 to-amber-500 hover:from-green-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2 group/btn"
          >
            <FaTag className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-200" />
            Reserve Now
          </button>
        ) : (
          <Link
            href="/login"
            className="w-full py-3 px-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 group/btn"
          >
            <FaUser className="w-4 h-4" />
            Login to Reserve
          </Link>
        )}
      </div>
    </motion.div>
  )
}

export default FoodCard