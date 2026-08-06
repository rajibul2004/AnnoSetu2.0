"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  FaRegHeart,
  FaDirections,
  FaArrowLeft,
  FaBuilding,
  FaHandHoldingHeart,
  FaLock,
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
  const { isAuthenticated, user } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [pickupTime, setPickupTime] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showSafetyInfo, setShowSafetyInfo] = useState(false);

  const { food, isLoading } = useFoodDetails(params.id);
  const { createReservation, isCreating } = useCreateReservation();

  // Dynamic Pickup time slots capped before expiration
  const pickupOptions = (() => {
    if (!food) return [];
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    const expiry = new Date(food.expiresAt);

    // ASAP option (15 mins from now)
    const asapTime = new Date(now.getTime() + 15 * 60000);
    if (asapTime < expiry) {
      options.push({
        value: asapTime.toISOString(),
        label: `⚡ ASAP (~15 mins - ${asapTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
      });
    }

    // 30m, 45m, 60m, 90m, 120m options
    [30, 45, 60, 90, 120].forEach((minutes) => {
      const time = new Date(now.getTime() + minutes * 60000);
      if (time < expiry) {
        options.push({
          value: time.toISOString(),
          label: `🕒 In ${minutes} mins (${time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
        });
      }
    });

    // Fallback if near expiry
    if (options.length === 0 && now < expiry) {
      options.push({
        value: now.toISOString(),
        label: "⚡ Immediately (Expiring Very Soon)",
      });
    }

    return options;
  })();

  useEffect(() => {
    if (food && !pickupTime && pickupOptions.length > 0) {
      setPickupTime(pickupOptions[0].value);
    }
  }, [food, pickupTime, pickupOptions]);

  const handleQuantityChange = (delta: number) => {
    if (!food) return;
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= food.availableQty) {
      setQuantity(newQuantity);
    }
  };

  const handleSetQuantity = (val: number) => {
    if (!food) return;
    const clamped = Math.min(Math.max(1, val), food.availableQty);
    setQuantity(clamped);
  };

  const handleReserve = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to reserve food");
      router.push(`/auth/login?next=/protected/food/${params.id}/reserve`);
      return;
    }
    if (!acceptedTerms) {
      toast.error("Please confirm acceptance of pickup terms");
      return;
    }
    if (!pickupTime) {
      toast.error("Please select a valid pickup time");
      return;
    }
    if (!food) return;

    const finalQuantity = Math.min(Math.max(1, quantity), food.availableQty);

    try {
      const result = await createReservation({
        foodId: food.id,
        quantity: finalQuantity,
        pickupTime,
        acceptedTerms: true,
      });
      toast.success("🎉 Food reservation request created successfully!");
      router.push(`/protected/reservation/${result.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reserve food",
      );
    }
  };

  const handleHeartClick = () => {
    setIsLiked(!isLiked);
    if (!isLiked && food) {
      toast.success(`Saved "${food.name}" to favorites!`);
    } else {
      toast("Removed from favorites");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner text="Loading food reservation details..." />
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
            Food Listing Not Found
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            This food item may have expired, been claimed, or removed by the supplier.
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
  const isOwnListing = user?.id === food.supplierId;
  const isRestaurantUser = user?.role === "restaurant";
  const hasNoPickupAddress = !food.pickupAddress;
  const canReserve =
    !expired &&
    !reserved &&
    food.availableQty > 0 &&
    !isOwnListing &&
    !hasNoPickupAddress;

  const primaryImage =
    food.images && food.images.length > 0
      ? (food.images.find((img) => img.isPrimary) ?? food.images[0]).url
      : null;

  const supplierIcon =
    food.supplierType === "restaurant"
      ? FaStore
      : food.supplierType === "ngo"
        ? FaBuilding
        : FaUser;

  const availablePct =
    food.quantity > 0
      ? Math.max(0, Math.min(100, (food.availableQty / food.quantity) * 100))
      : 0;

  const totalPrice = food.isDonation ? 0 : food.price * quantity;
  const savings =
    food.originalPrice && food.originalPrice > food.price
      ? (food.originalPrice - food.price) * quantity
      : 0;

  const mapsUrl = food.pickupAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(food.pickupAddress)}`
    : null;

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
            <button
              onClick={() => router.push(`/protected/food/${food.id}`)}
              className="hover:text-emerald-600 transition-colors cursor-pointer truncate max-w-[120px] sm:max-w-xs"
            >
              {food.name}
            </button>
            <span>/</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Reserve
            </span>
          </nav>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors shadow-xs cursor-pointer"
          >
            <FaArrowLeft className="w-3 h-3" />
            <span>Back</span>
          </button>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Columns: Food Overview Details */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-gray-200/80 dark:border-slate-800"
            >
              {/* Image Banner */}
              <div className="relative h-72 sm:h-96 w-full bg-linear-to-br from-emerald-100 via-teal-50 to-amber-50 dark:from-slate-800 dark:to-slate-900 overflow-hidden group">
                {primaryImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={primaryImage}
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

                  {food.isHomeCooked && (
                    <span className="px-3.5 py-1.5 bg-pink-500/90 backdrop-blur-md text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 border border-white/20">
                      <FaUser className="w-3 h-3" />
                      Home Cooked
                    </span>
                  )}
                </div>

                {/* Top Right Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <button
                    type="button"
                    onClick={handleHeartClick}
                    className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                    aria-label="Favorite"
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
                    <span>Expires in {formatTimeRemaining(food.expiresAt)}</span>
                  </div>

                  <div className="bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl text-xs font-bold border border-white/15 shadow-lg">
                    <span className="text-emerald-400 font-black">
                      {food.availableQty}
                    </span>{" "}
                    / {food.quantity} {food.quantityUnit} left
                  </div>
                </div>
              </div>

              {/* Body Details */}
              <div className="p-6 sm:p-8">
                {/* Title & Pricing Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                        {supplierIcon({ className: "w-3 h-3" })}
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
                      <div className="flex items-center gap-1 mt-2 text-amber-500 font-bold text-xs">
                        <FaStar className="w-3.5 h-3.5" />
                        <span>{food.averageRating.toFixed(1)}</span>
                        <span className="text-gray-400 font-normal">
                          ({food.reviewCount} customer reviews)
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
                    {food.originalPrice !== null && !food.isDonation && food.originalPrice > food.price && (
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
                      About This Food
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
                      Pickup Window
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                      Before{" "}
                      {new Date(food.expiresAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <FaTag className="w-4 h-4 text-teal-500 mb-1.5" />
                    <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      Portions Left
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                      {food.availableQty} {food.quantityUnit}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <FaMapMarkerAlt className="w-4 h-4 text-rose-500 mb-1.5" />
                    <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      Distance
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                      {food.distance !== null
                        ? `${food.distance.toFixed(1)} km away`
                        : "Verified Area"}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <FaShieldAlt className="w-4 h-4 text-indigo-500 mb-1.5" />
                    <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      Food State
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <FaCheckCircle className="w-3 h-3" />
                      {food.isRaw ? "Raw Ingredients" : "Freshly Cooked"}
                    </div>
                  </div>
                </div>

                {/* Allergens Notice if any */}
                {food.allergens && food.allergens.length > 0 && (
                  <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                    <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 mb-2 flex items-center gap-1.5">
                      <FaExclamationTriangle />
                      Allergen Notice
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

                {/* Food Safety Collapsible Box */}
                <div className="p-4 rounded-2xl bg-linear-to-r from-blue-50 to-teal-50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-200/80 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowSafetyInfo((v) => !v)}
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FaShieldAlt className="text-blue-600 dark:text-blue-400 w-4 h-4" />
                      <span className="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-100">
                        AnnoSetu Food Safety & Pickup Standards
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
                            "All food listed on AnnoSetu must meet strict hygiene requirements. Please inspect food upon pickup and consume within 2 hours of collection for optimal safety and taste."}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          <FaLeaf className="w-3.5 h-3.5" />
                          <span>100% Zero-Waste Verified Safety Protocol</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Reservation Form Sticky Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-7 sticky top-24 border border-gray-200/80 dark:border-slate-800"
            >
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <FaCheckCircle className="text-emerald-500" />
                Reserve Food Request
              </h2>

              {/* Status alerts if user cannot reserve */}
              {!canReserve ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/60 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                    <FaExclamationTriangle />
                  </div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
                    {expired
                      ? "Listing Expired"
                      : reserved
                        ? "Fully Claimed"
                        : isOwnListing
                          ? "Your Own Food Listing"
                          : hasNoPickupAddress
                            ? "Pickup Unavailable"
                            : "Reservation Unavailable"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                    {expired
                      ? "This food listing has passed its expiry deadline."
                      : reserved
                        ? "All available portions of this food have already been reserved."
                        : isOwnListing
                          ? "You are the creator of this food listing. You cannot reserve your own surplus food."
                          : "This listing cannot be reserved right now."}
                  </p>

                  {isOwnListing ? (
                    <Button
                      onClick={() =>
                        router.push(`/protected/food/${food.id}/requests`)
                      }
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md text-xs cursor-pointer"
                    >
                      Manage Listing Requests
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push("/public/food")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md text-xs cursor-pointer"
                    >
                      Browse Other Surplus Food
                    </Button>
                  )}
                </div>
              ) : isRestaurantUser ? (
                <div className="text-center py-5">
                  <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/60 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">
                    <FaStore />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                    Restaurant Account
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                    You are currently logged in as a Restaurant Supplier. Food reservations are reserved for consumer accounts.
                  </p>
                  <Button
                    onClick={() => router.push("/protected/dashboard")}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md text-xs cursor-pointer"
                  >
                    Go to Restaurant Dashboard
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Quantity Stepper */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        Select Quantity
                      </label>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {food.availableQty} {food.quantityUnit} left
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-gray-100 dark:bg-slate-800/80 rounded-2xl p-1.5 border border-gray-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <FaMinus className="w-3 h-3" />
                      </button>

                      <div className="text-center">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">
                          {quantity}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold ml-1">
                          {food.quantityUnit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= food.availableQty}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <FaPlus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Quick presets if available quantity is > 1 */}
                    {food.availableQty > 1 && (
                      <div className="flex gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => handleSetQuantity(1)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            quantity === 1
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          1 portion
                        </button>
                        {food.availableQty >= 2 && (
                          <button
                            type="button"
                            onClick={() => handleSetQuantity(2)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              quantity === 2
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            2 portions
                          </button>
                        )}
                        {food.availableQty >= 4 && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSetQuantity(
                                Math.floor(food.availableQty / 2),
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              quantity === Math.floor(food.availableQty / 2)
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            Half ({Math.floor(food.availableQty / 2)})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSetQuantity(food.availableQty)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ml-auto ${
                            quantity === food.availableQty
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          All ({food.availableQty})
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pickup Time Slot */}
                  <div>
                    <Select
                      label="Select Pickup Time"
                      value={pickupTime}
                      options={pickupOptions}
                      onChange={(val) => setPickupTime(String(val))}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <FaClock className="text-amber-500" />
                      Must arrive before{" "}
                      {new Date(food.expiresAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Price Calculation Box */}
                  <div className="bg-gray-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-gray-100 dark:border-slate-800">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Price per portion:</span>
                        <span className="font-bold">
                          {food.isDonation ? "FREE" : formatPrice(food.price)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Selected quantity:</span>
                        <span className="font-bold">
                          {quantity} {food.quantityUnit}
                        </span>
                      </div>
                      {savings > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                          <span>Total Discount Savings:</span>
                          <span>- {formatPrice(savings)}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex justify-between items-baseline">
                        <span className="text-sm font-black text-gray-900 dark:text-white">
                          Total Amount:
                        </span>
                        <span className="text-xl font-black text-gray-900 dark:text-white">
                          {food.isDonation ? (
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
                              FREE DONATION
                            </span>
                          ) : (
                            formatPrice(totalPrice)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pickup Location Details & Maps Link */}
                  <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-900/60">
                    <div className="flex items-start gap-2.5">
                      <FaMapMarkerAlt className="text-rose-500 mt-0.5 shrink-0 w-3.5 h-3.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                          Pickup Address
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 leading-snug">
                          {food.pickupAddress}
                        </p>
                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1.5"
                          >
                            <FaDirections />
                            <span>View on Google Maps</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div>
                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-emerald-600 rounded border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        I agree to arrive within the designated pickup window and consume this surplus food for personal consumption.
                      </span>
                    </label>
                  </div>

                  {/* Submit CTA */}
                  <div>
                    {isAuthenticated ? (
                      <Button
                        onClick={handleReserve}
                        loading={isCreating}
                        disabled={!acceptedTerms || isCreating}
                        size="lg"
                        fullWidth
                        variant="secondary"
                        className="font-black py-3.5 text-sm rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-600/30 transition-all cursor-pointer"
                      >
                        <FaCheckCircle className="mr-2" />
                        <span>Confirm Reservation Request</span>
                      </Button>
                    ) : (
                      <Link
                        href={`/auth/login?next=/protected/food/${params.id}/reserve`}
                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-colors"
                      >
                        <FaLock />
                        <span>Login to Reserve Food</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}