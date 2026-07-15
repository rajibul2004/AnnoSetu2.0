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
  FaHome,
  FaBuilding,
} from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Button from "@/components/common/Button";
import { formatTimeRemaining, formatPrice, formatDate } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { useFoodDetails } from "@/hooks/useFoodQueries";
import { isFoodExpired, isFoodReserved } from "@/types/food";
 
const SUPPLIER_STYLES: Record<string, { bg: string; text: string }> = {
  restaurant: { bg: "bg-blue-600 dark:bg-blue-300", text: "text-blue-200 dark:text-blue-700" },
  individual: { bg: "bg-pink-600 dark:bg-pink-300", text: "text-pink-200 dark:text-pink-700" },
  ngo: { bg: "bg-purple-600 dark:bg-purple-300", text: "text-purple-200 dark:text-purple-700" },
  admin: { bg: "bg-gray-600 dark:bg-gray-300", text: "text-gray-200 dark:text-gray-700" },
};
 
export default function FoodDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
 
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
 
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Food Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This food item may have expired or been removed.
          </p>
          <Link href="/">
            <Button className="bg-linear-to-r from-green-500 to-amber-500">Browse Other Food</Button>
          </Link>
        </div>
      </div>
    );
  }
 
  const expired = isFoodExpired(food);
  const reserved = isFoodReserved(food);
  const isOwner = food.supplierId === user?.id;
  const canReserve = !expired && !reserved && food.availableQty > 0 && !isOwner;
 
  const getSupplierIcon = () => {
    if (food.supplierType === "restaurant") return <FaStore className="w-5 h-5" />;
    if (food.isHomeCooked) return <FaHome className="w-5 h-5" />;
    return <FaBuilding className="w-5 h-5" />;
  };
 
  const style = SUPPLIER_STYLES[food.supplierType] ?? SUPPLIER_STYLES.individual;
  const dashboardHref = food.supplierType === "restaurant" ? "/protected/dashboard/restaurant" : "/protected/dashboard/individual";
 
  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-300 mb-6 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
 
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
              <div className="relative h-96 bg-linear-to-br from-green-100 dark:from-gray-600 via-amber-100 dark:via-slate-700 to-pink-100 dark:to-zinc-600">
                {food.images.length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={food.images[currentImageIndex].url}
                      alt={food.name}
                      className="w-full h-full object-cover"
                    />
                    {food.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {food.images.map((image, index) => (
                          <button
                            key={image.id}
                            onClick={() => setCurrentImageIndex(index)}
                            aria-label={`Show image ${index + 1}`}
                            className={`h-2 rounded-full transition-all ${
                              index === currentImageIndex
                                ? "w-6 bg-green-600 dark:bg-green-300"
                                : "w-2 bg-white/60 dark:bg-gray-900/60 hover:bg-white dark:hover:bg-gray-900"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FaUtensils className="w-20 h-20 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No image available</p>
                    </div>
                  </div>
                )}
 
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {food.isDonation && (
                    <span className="px-4 py-2 bg-purple-600 dark:bg-purple-300 text-white dark:text-gray-900 text-sm font-bold rounded-full shadow-lg flex items-center gap-1">
                      <FaHeart className="w-4 h-4" />
                      FREE DONATION
                    </span>
                  )}
                  {food.discountPct > 0 && (
                    <span className="px-4 py-2 bg-amber-600 dark:bg-amber-300 text-white dark:text-gray-900 text-sm font-bold rounded-full shadow-lg">
                      {food.discountPct}% OFF
                    </span>
                  )}
                </div>
 
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-4 py-2 ${style.bg} text-white dark:text-gray-900 text-sm font-medium rounded-full shadow-lg flex items-center gap-2`}
                  >
                    {getSupplierIcon()}
                    {food.supplierType === "restaurant"
                      ? "Restaurant"
                      : food.isHomeCooked
                        ? "Home Cooked"
                        : "NGO"}
                  </span>
                </div>
 
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={() => setIsLiked((prev) => !prev)}
                    aria-label="Save to favorites"
                    className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                  >
                    <FaHeart className={`w-5 h-5 ${isLiked ? "text-red-500" : "text-gray-600"}`} />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }}
                    aria-label="Copy link"
                    className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                  >
                    <FaShare className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
 
              <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                      {food.name}
                    </h1>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className={`flex items-center gap-2 px-3 py-1 ${style.bg} ${style.text} rounded-full`}>
                        {getSupplierIcon()}
                        <span className="font-medium">{food.supplierName}</span>
                      </div>
 
                      {food.averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(food.averageRating)
                                    ? "text-yellow-400 dark:text-yellow-500"
                                    : "text-gray-200 dark:text-gray-700"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            ({food.reviewCount} {food.reviewCount === 1 ? "review" : "reviews"})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
 
                  <div className="text-right">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-300">
                      {formatPrice(food.price)}
                    </div>
                    {food.originalPrice !== null && food.originalPrice > food.price && (
                      <div className="text-lg text-gray-400 dark:text-gray-500 line-through">
                        {formatPrice(food.originalPrice)}
                      </div>
                    )}
                  </div>
                </div>
 
                {food.description && (
                  <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed mb-8">
                    {food.description}
                  </p>
                )}
 
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <FaClock className="w-5 h-5 text-green-600 dark:text-green-300 mb-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-300">Available Until</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(food.expiresAt, "hh:mm a")}
                    </div>
                    <div className={`text-xs mt-1 ${expired ? "text-red-600 dark:text-red-300" : "text-orange-600 dark:text-orange-300"}`}>
                      {expired ? "Expired" : formatTimeRemaining(food.expiresAt)}
                    </div>
                  </div>
 
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <FaTag className="w-5 h-5 text-green-600 dark:text-green-300 mb-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-300">Quantity</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {food.quantity} {food.quantityUnit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {food.availableQty} left
                    </div>
                  </div>
 
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <FaMapMarkerAlt className="w-5 h-5 text-green-600 dark:text-green-300 mb-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-300">Distance</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {food.distance !== null ? `${food.distance.toFixed(1)}km` : "Nearby"}
                    </div>
                  </div>
 
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <FaShieldAlt className="w-5 h-5 text-green-600 dark:text-green-300 mb-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-300">Safety</div>
                    <div className="font-semibold text-green-600 dark:text-green-300 flex items-center gap-1">
                      <FaCheckCircle className="w-4 h-4" />
                      {food.isRaw ? "Raw" : "Cooked"}
                    </div>
                  </div>
                </div>
 
                {food.allergens.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Allergen Information</h3>
                    <div className="flex flex-wrap gap-2">
                      {food.allergens.map((allergen) => (
                        <span
                          key={allergen}
                          className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-200 text-sm font-medium rounded-full border border-red-200"
                        >
                          ⚠️ {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
 
                {food.safetyGuidelines && (
                  <div className="bg-linear-to-br from-blue-50 dark:from-blue-950/60 to-indigo-50 dark:to-indigo-950/60 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-50 flex items-center gap-2 mb-3">
                      <FaShieldAlt className="w-5 h-5" />
                      Food Safety Guidelines
                    </h3>
                    <p className="text-blue-800 dark:text-blue-100">{food.safetyGuidelines}</p>
                  </div>
                )}
              </div>
            </motion.div>
 
            {food.reviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-8"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Reviews ({food.reviewCount})
                </h3>
                <div className="space-y-6">
                  {food.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-6 last:pb-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-linear-to-br from-green-100 dark:from-gray-800 to-amber-100 dark:to-slate-800 rounded-full flex items-center justify-center">
                          <FaUser className="w-5 h-5 text-green-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{review.reviewerName}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.rating
                                      ? "text-yellow-400 dark:text-yellow-500"
                                      : "text-gray-200 dark:text-gray-700"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="text-gray-700 dark:text-gray-200">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
 
          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            {!isOwner && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {canReserve ? "Ready to Reserve?" : "Not Available"}
                </h2>
 
                {canReserve ? (
                  <>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-700 rounded-lg">
                        <span className="text-green-700 dark:text-green-200">Status</span>
                        <span className="font-semibold text-green-700 dark:text-green-200 flex items-center gap-1">
                          <FaCheckCircle className="w-4 h-4" />
                          Available
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-300">Price</span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatPrice(food.price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-300">Available</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {food.availableQty} {food.quantityUnit}
                        </span>
                      </div>
                    </div>
 
                    <Link href={isAuthenticated ? `/food/${food.id}/reserve` : `/login?next=/food/${food.id}`}>
                      <Button size="lg" fullWidth className="bg-linear-to-r from-green-500 to-amber-500">
                        {isAuthenticated ? "Reserve Now" : "Login to Reserve"}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaExclamationTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-200 mb-4">
                      {expired
                        ? "This food has expired"
                        : reserved
                          ? "This food is already reserved"
                          : "This food is not available"}
                    </p>
                    <Link href="/food">
                      <Button variant="outline" fullWidth>
                        Browse Other Food
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
 
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                {getSupplierIcon()}
                About the {food.supplierType === "restaurant" ? "Restaurant" : "Cook"}
              </h3>
 
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center`}>
                    {getSupplierIcon()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{food.supplierName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{food.supplierType}</p>
                  </div>
                </div>
 
                {food.pickupAddress && (
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Location</p>
                    <p className="text-gray-900 dark:text-white flex items-start gap-2">
                      <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span>{food.pickupAddress}</span>
                    </p>
                  </div>
                )}
 
                {food.distance !== null && (
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Distance from you</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-300">
                      {food.distance.toFixed(1)} km
                    </p>
                  </div>
                )}
 
                {isAuthenticated && !isOwner && (
                  <button
                    onClick={() => setShowContactInfo((prev) => !prev)}
                    className="w-full mt-2 text-green-600 dark:text-green-300 hover:text-green-700 dark:hover:text-green-200 font-medium text-sm"
                  >
                    {showContactInfo ? "Hide contact info" : "Show contact info"}
                  </button>
                )}
 
                {showContactInfo && isAuthenticated && !isOwner && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2"
                  >
                    <p className="flex items-center gap-2 text-sm">
                      <FaPhone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span>{food.supplierPhone || "Not provided"}</span>
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <FaEnvelope className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span>{food.supplierEmail || "Not provided"}</span>
                    </p>
                  </motion.div>
                )}
 
                {isOwner && (
                  <Link href={dashboardHref}>
                    <Button variant="primary" fullWidth>
                      View All Requests
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
 
            {canReserve && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-linear-to-br from-green-50 dark:from-green-900/40 to-emerald-50 dark:to-emerald-900/40 rounded-xl p-4 text-center"
              >
                <FaShieldAlt className="w-8 h-8 text-green-600 dark:text-green-300 mx-auto mb-2" />
                <p className="text-sm text-gray-700 dark:text-green-200">
                  By reserving, you&apos;re helping reduce food waste and protecting the environment.
                  <br />
                  <span className="font-medium text-green-600 dark:text-green-300 mt-1 block">
                    Thank you for being part of the solution! 🌱
                  </span>
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}