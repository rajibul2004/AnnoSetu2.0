"use client";
 
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaUtensils,
  FaClock,
  FaMapMarkerAlt,
  FaTag,
  FaShieldAlt,
  FaStar,
  FaMinus,
  FaPlus,
  FaCheckCircle,
  FaExclamationTriangle,
  FaStore,
  FaUser,
  FaHeart,
  FaShare,
  FaLeaf,
  FaInfoCircle,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Button from "@/components/common/Button";
import Select from "@/components/common/Select";
import { formatTimeRemaining, formatPrice } from "@/lib/formatters";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFoodDetails } from "@/hooks/useFoodQueries";
import { useCreateReservation } from "@/hooks/useReservationQueries";
import { isFoodExpired, isFoodReserved } from "@/types/food";
 
export default function ReserveFoodForm() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
 
  const [quantity, setQuantity] = useState(1);
  const [pickupTime, setPickupTime] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showSafetyInfo, setShowSafetyInfo] = useState(false);
 
  const { food, isLoading } = useFoodDetails(params.id);
  const { createReservation, isCreating } = useCreateReservation();
 
  const pickupOptions = (() => {
    if (!food) return [];
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    const expiry = new Date(food.expiresAt);
    for (let i = 30; i <= 120; i += 30) {
      const time = new Date(now.getTime() + i * 60000);
      if (time < expiry) {
        options.push({
          value: time.toISOString(),
          label: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }
    }
    return options;
  })();
 
  useEffect(() => {
    if (food && !pickupTime) {
      const defaultTime = new Date(Date.now() + 30 * 60000);
      setPickupTime(defaultTime.toISOString());
    }
  }, [food, pickupTime]);
 
  const handleQuantityChange = (delta: number) => {
    if (!food) return;
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= food.availableQty) {
      setQuantity(newQuantity);
    }
  };
 
  const handleReserve = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to reserve food");
      router.push(`/auth/login?next=/food/${params.id}/reserve`);
      return;
    }
    if (!acceptedTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }
    if (!food) return;
 
    try {
      const result = await createReservation({
        foodId: food.id,
        quantity,
        pickupTime,
        acceptedTerms: true,
      });
      toast.success("🎉 Food reservation request created successfully!");
      // The original redirected to `/${role === "user" ? "user" : "ngo"}/dashboard` —
      // but roles in this schema are "individual"/"restaurant"/"ngo"/"admin",
      // never "user", so that condition was always false and every
      // non-ngo role (including individuals and restaurants) landed on
      // the NGO dashboard. Sending everyone to the reservation's own
      // status page instead sidesteps the role-routing question entirely
      // and is more useful than a dashboard anyway.
      router.push(`/protected/reservation/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reserve food");
    }
  };
 
  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 dark:from-gray-900 to-gray-100 dark:to-gray-800 flex items-center justify-center">
        <LoadingSpinner text="Loading delicious details..." />
      </div>
    );
  }
 
  if (!food) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-linear-to-br from-gray-50 dark:from-gray-900 to-gray-100 dark:to-gray-800 flex items-center justify-center p-4"
      >
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-linear-to-br from-red-100 dark:from-red-900 to-orange-100 dark:to-orange-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FaExclamationTriangle className="w-12 h-12 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-3">Food Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            This food item may have expired or been removed by the supplier.
          </p>
          <Button onClick={() => router.push("/food")} className="bg-linear-to-r from-green-500 to-amber-500">
            Browse Other Food
          </Button>
        </div>
      </motion.div>
    );
  }
 
  const expired = isFoodExpired(food);
  const reserved = isFoodReserved(food);
  const canReserve = !expired && !reserved && food.availableQty > 0;
 
  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <button onClick={() => router.push("/")} className="hover:text-green-600 cursor-pointer transition-colors">
            Home
          </button>
          <span>/</span>
          <button onClick={() => router.push("/food")} className="hover:text-green-600 cursor-pointer transition-colors">
            Browse
          </button>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-50 font-medium">{food.name}</span>
        </nav>
 
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-900">
              <div className="relative h-96 bg-linear-to-br from-green-100 dark:from-green-900 via-amber-100 dark:via-amber-900 to-pink-100 dark:to-pink-900 group">
                {food.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={food.images[0].url}
                    alt={food.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FaUtensils className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No image available</p>
                    </div>
                  </div>
                )}
 
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {food.isDonation && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-4 py-2 bg-linear-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-1"
                    >
                      <FaHeart className="w-4 h-4" />
                      FREE DONATION
                    </motion.span>
                  )}
                  {food.discountPct > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-4 py-2 bg-linear-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg"
                    >
                      {food.discountPct}% OFF
                    </motion.span>
                  )}
                </div>
 
                {food.isHomeCooked && (
                  <div className="absolute top-4 right-4">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-4 py-2 bg-linear-to-r from-pink-500 to-purple-500 text-white text-sm font-medium rounded-full shadow-lg flex items-center gap-2"
                    >
                      <FaUser className="w-4 h-4" />
                      Home Cooked
                    </motion.span>
                  </div>
                )}
 
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsLiked((v) => !v)}
                    className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                  >
                    <FaHeart className={`w-5 h-5 ${isLiked ? "text-red-500" : "text-gray-400"}`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied!");
                    }}
                    className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                  >
                    <FaShare className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>
 
                <div className="absolute bottom-4 left-4">
                  <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                    <FaClock className="w-4 h-4" />
                    <span className="font-medium">{formatTimeRemaining(food.expiresAt)}</span>
                  </div>
                </div>
              </div>
 
              <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">{food.name}</h1>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        {food.supplierType === "restaurant" ? (
                          <FaStore className="mr-2 text-blue-500" />
                        ) : (
                          <FaUser className="mr-2 text-pink-500" />
                        )}
                        <span className="font-medium">{food.supplierName}</span>
                      </div>
 
                      {food.averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(food.averageRating) ? "text-yellow-400" : "text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">({food.reviewCount} reviews)</span>
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
                  <div className="bg-gradient-to-br from-gray-50 dark:from-gray-950 to-gray-100 dark:to-gray-900 p-4 rounded-xl">
                    <FaClock className="w-5 h-5 text-green-600 dark:text-green-300 mb-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-300">Available Until</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-50">
                      {new Date(food.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        new Date(food.expiresAt).getTime() - Date.now() < 3600000
                          ? "text-red-600 font-medium"
                          : "text-orange-600"
                      }`}
                    >
                      {formatTimeRemaining(food.expiresAt)}
                    </div>
                  </div>
 
                  <div className="bg-linear-to-br from-gray-50 dark:from-gray-950 to-gray-100 dark:to-gray-900 p-4 rounded-xl">
                    <FaTag className="w-5 h-5 text-green-600 dark:text-green-300 mb-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-300">Quantity Left</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-50">
                      {food.availableQty} {food.quantityUnit}
                    </div>
                  </div>
 
                  <div className="bg-linear-to-br from-gray-50 dark:from-gray-950 to-gray-100 dark:to-gray-900 p-4 rounded-xl">
                    <FaMapMarkerAlt className="w-5 h-5 text-green-600 dark:text-green-300 mb-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-300">Distance</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-50">
                      {food.distance !== null ? `${food.distance.toFixed(1)}km` : "Nearby"}
                    </div>
                  </div>
 
                  <div className="bg-linear-to-br from-gray-50 dark:from-gray-950 to-gray-100 dark:to-gray-900 p-4 rounded-xl">
                    <FaShieldAlt className="w-5 h-5 text-green-600 dark:text-green-300 mb-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-300">Safety</div>
                    <div className="font-semibold text-green-600 flex items-center gap-1">
                      <FaCheckCircle className="w-4 h-4" />
                      {food.isRaw ? "Raw" : "Cooked"}
                    </div>
                  </div>
                </div>
 
                {food.allergens.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-3">Allergen Information</h3>
                    <div className="flex flex-wrap gap-2">
                      {food.allergens.map((allergen) => (
                        <span
                          key={allergen}
                          className="px-3 py-1.5 bg-red-50 dark:bg-gray-900 text-red-700 dark:text-red-200 text-sm font-medium rounded-full border border-red-200 dark:border-red-700"
                        >
                          ⚠️ {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
 
                <div className="bg-linear-to-br from-blue-50 dark:from-blue-900 to-indigo-50 dark:to-indigo-900 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
                  <button onClick={() => setShowSafetyInfo((v) => !v)} className="w-full flex items-center justify-between">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <FaShieldAlt className="w-5 h-5" />
                      Food Safety Guidelines
                    </h3>
                    <FaInfoCircle
                      className={`w-5 h-5 text-blue-600 dark:text-blue-300 transition-transform duration-300 ${
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
                        <p className="text-blue-800 dark:text-blue-100 mt-4 leading-relaxed">
                          {food.safetyGuidelines}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-200">
                          <FaLeaf className="w-4 h-4" />
                          <span>Consume within 2 hours of pickup for best quality</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
 
          {/* Right Column */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6 sticky top-4 border border-gray-100 dark:border-gray-800"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                Complete Reservation
              </h2>
 
              {!canReserve ? (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-8">
                  <div className="w-20 h-20 bg-linear-to-br from-red-100 dark:from-red-800 to-orange-100 dark:to-orange-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FaExclamationTriangle className="w-10 h-10 text-red-500 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {expired ? "Food Expired" : reserved ? "Already Reserved" : "Not Available"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                    {expired
                      ? "This delicious meal is no longer available."
                      : reserved
                        ? "Someone else has already reserved this food."
                        : "This food item is not available for reservation."}
                  </p>
                  <Button onClick={() => router.push("/food")} className="w-full bg-linear-to-r from-green-500 to-amber-500 dark:text-black">
                    Browse More Food
                  </Button>
                </motion.div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                      Select Quantity
                    </label>
                    <div className="flex items-center justify-between bg-linear-to-r from-gray-50 dark:from-gray-950 to-gray-100 dark:to-gray-950 rounded-xl p-1">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="w-12 h-12 bg-white cursor-pointer dark:bg-gray-900 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        <FaMinus size={16} />
                      </motion.button>
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-50 min-w-12 text-center">
                        {quantity}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= food.availableQty}
                        className="w-12 h-12 cursor-pointer bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        <FaPlus size={16} />
                      </motion.button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                      <FaTag className="w-3 h-3" />
                      {food.availableQty} {food.quantityUnit} available
                    </p>
                  </div>
 
                  <div className="mb-6">
                    <Select
                      label="Choose Pickup Time"
                      value={pickupTime}
                      options={pickupOptions}
                      onChange={(value) => setPickupTime(String(value))}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                      <FaClock className="w-3 h-3" />
                      Must pickup before{" "}
                      {new Date(food.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
 
                  <div className="bg-linear-to-br from-gray-50 dark:from-gray-950 to-gray-100 dark:to-gray-900 rounded-xl p-5 mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                      <FaTag className="text-green-500" />
                      Price Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">
                          Price per {food.quantityUnit.slice(0, -1)}
                        </span>
                        <span className="font-medium">{formatPrice(food.price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Quantity</span>
                        <span className="font-medium">x {quantity}</span>
                      </div>
                      {food.originalPrice !== null && food.originalPrice > food.price && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">You Save</span>
                          <span className="text-green-600 dark:text-green-300 font-medium">
                            {formatPrice((food.originalPrice - food.price) * quantity)}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                        <div className="flex justify-between font-semibold">
                          <span>Total Amount</span>
                          <span className="text-xl text-green-600 dark:text-green-300">
                            {food.isDonation ? "Free" : formatPrice(food.price * quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
 
                  <div className="space-y-4 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 w-5 h-5 text-green-600 dark:text-green-300 rounded border-gray-300 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-50 transition-colors">
                        I confirm that I will pick up the food on time and follow all safety guidelines. This
                        food is for personal consumption only, not for resale.
                      </span>
                    </label>
 
                    <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="w-5 h-5 text-blue-600 dark:text-blue-300 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Pickup Location</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{food.pickupAddress}</p>
                          {food.distance !== null && (
                            <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                              {food.distance.toFixed(1)} km from your location
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
 
                  <Button
                    onClick={handleReserve}
                    loading={isCreating}
                    disabled={!acceptedTerms || isCreating}
                    size="lg"
                    fullWidth
                    className="bg-linear-to-r from-green-500 to-amber-500 hover:from-green-600 hover:to-amber-600 text-white font-bold py-4 text-lg"
                  >
                    <FaCheckCircle className="mr-2" />
                    Request Reservation
                  </Button>
 
                  {!isAuthenticated && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200"
                    >
                      <FaInfoCircle className="inline mr-1 text-yellow-600 dark:text-yellow-300" />
                      Please{" "}
                      <button
                        onClick={() => router.push(`/auth/login?next=/food/${params.id}/reserve`)}
                        className="text-green-600 hover:text-green-700 font-medium underline"
                      >
                        login
                      </button>{" "}
                      to complete your reservation
                    </motion.p>
                  )}
                </>
              )}
            </motion.div>
 
            {canReserve && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      food.supplierType === "restaurant"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300"
                    }`}
                  >
                    {food.supplierType === "restaurant" ? <FaStore /> : <FaUser />}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Provided by</p>
                    <p className="font-medium text-gray-900 dark:text-gray-50">{food.supplierName}</p>
                  </div>
                  {food.supplierType === "individual" && (
                    <span className="ml-auto px-2 py-1 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-200 text-xs rounded-full">
                      Home Cook
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
 