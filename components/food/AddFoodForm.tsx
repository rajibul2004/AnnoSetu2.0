"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  FaUtensils,
  FaClock,
  FaExclamationTriangle,
  FaUpload,
  FaTrash,
  FaShieldAlt,
  FaCheckCircle,
  FaArrowLeft,
  FaArrowRight,
  FaMapMarkerAlt,
  FaTag,
  FaHandHoldingHeart,
  FaCheck,
  FaMagic,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Button from "@/components/common/Button";
import LocationPicker from "@/components/common/LocationPicker";
import toast from "react-hot-toast";
import { useAddFood } from "@/hooks/useFoodQueries";
import type { Allergen, QuantityUnit } from "@/types/food";
import VoiceListingButton from "@/components/food/VoiceListingButton";
import type { ParsedFoodListing } from "@/lib/ai/foodParser";

interface AddFoodFormProps {
  userType: "individual" | "restaurant";
}

interface AddFoodFormData {
  name: string;
  description: string;
  quantity: string;
  quantityUnit: QuantityUnit;
  isDonation: boolean;
  price: string;
  originalPrice: string;
  isRaw: boolean;
  expiresAt: string;
  allergens: Allergen[];
  safetyGuidelines: string;
}

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
}

type LocationMode = "none" | "current" | "map";

interface PickedLocation {
  address: string;
  latitude: number;
  longitude: number;
}

const QUANTITY_UNIT_OPTIONS: { value: QuantityUnit; label: string }[] = [
  { value: "servings", label: "Servings (standard portion)" },
  { value: "plates", label: "Plates / Meal Boxes" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "units", label: "Individual Units / Pieces" },
  { value: "packets", label: "Packets / Containers" },
];

const ALLERGEN_OPTIONS: { value: Allergen; label: string; icon: string }[] = [
  { value: "nuts", label: "Tree Nuts / Peanuts", icon: "🥜" },
  { value: "dairy", label: "Dairy / Milk / Cheese", icon: "🥛" },
  { value: "gluten", label: "Gluten / Wheat", icon: "🌾" },
  { value: "seafood", label: "Fish / Seafood", icon: "🐟" },
  { value: "eggs", label: "Eggs", icon: "🥚" },
  { value: "soy", label: "Soy / Tofu", icon: "🌱" },
  { value: "sesame", label: "Sesame", icon: "🌰" },
  { value: "shellfish", label: "Crustaceans / Shellfish", icon: "🦐" },
  { value: "mustard", label: "Mustard", icon: "🌭" },
  { value: "sulphites", label: "Sulphites", icon: "🍷" },
  { value: "other", label: "Other Allergens", icon: "➕" },
];

const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const MAX_IMAGES = 3;

export default function AddFoodForm({ userType }: AddFoodFormProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const { addFood, isAdding } = useAddFood();

  const [currentStep, setCurrentStep] = useState(1);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiPopulated, setAiPopulated] = useState(false);

  const [locationMode, setLocationMode] = useState<LocationMode>("none");
  const [locationLoading, setLocationLoading] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);

  const [formData, setFormData] = useState<AddFoodFormData>({
    name: "",
    description: "",
    quantity: "",
    quantityUnit: "servings",
    isDonation: userType === "individual",
    price: "",
    originalPrice: "",
    isRaw: false,
    expiresAt: "",
    allergens: [],
    safetyGuidelines:
      "Consume within 2 hours of pickup. Store in refrigerator if not consuming immediately.",
  });

  const isRestaurant = userType === "restaurant";

  const handleApplyVoiceParsedData = (parsed: ParsedFoodListing) => {
    setFormData((prev) => ({
      ...prev,
      name: parsed.name || prev.name,
      description: parsed.description || prev.description,
      quantity: String(parsed.quantity || prev.quantity || "1"),
      quantityUnit: parsed.quantityUnit || prev.quantityUnit,
      isDonation: parsed.isDonation,
      price: parsed.isDonation ? "" : (parsed.price ? String(parsed.price) : prev.price),
      originalPrice: parsed.originalPrice ? String(parsed.originalPrice) : prev.originalPrice,
      isRaw: parsed.isRaw,
      allergens: parsed.allergens || prev.allergens,
      expiresAt: parsed.expiresAt || prev.expiresAt,
    }));
    setAiPopulated(true);
    setErrors({});
    setCurrentStep(1);
  };

  const accentGradient = isRestaurant
    ? "from-blue-600 via-indigo-600 to-cyan-500"
    : "from-rose-500 via-pink-600 to-amber-500";

  const glowShadow = isRestaurant
    ? "shadow-blue-500/20"
    : "shadow-pink-500/20";

  const expiryOptions = useMemo(() => {
    const now = new Date();
    const options: { value: string; label: string; quick?: boolean }[] = [];
    const maxHours = isRestaurant ? 24 : 6;

    for (let i = 1; i <= maxHours; i++) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000);
      options.push({
        value: time.toISOString(),
        label: `${i} hour${i > 1 ? "s" : ""} from now (${time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })})`,
        quick: i === 2 || i === 4 || i === 6,
      });
    }

    const todayTimes = isRestaurant
      ? ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
      : ["18:00", "19:00", "20:00", "21:00"];

    todayTimes.forEach((timeStr) => {
      const [hours, minutes] = timeStr.split(":");
      const time = new Date();
      time.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      if (time > now) {
        options.push({
          value: time.toISOString(),
          label: `Tonight at ${timeStr}`,
        });
      }
    });

    return options;
  }, [isRestaurant]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const target = e.target;
    const { name, value } = target;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const toggleAllergen = (allergen: Allergen) => {
    setFormData((prev) => {
      const exists = prev.allergens.includes(allergen);
      return {
        ...prev,
        allergens: exists
          ? prev.allergens.filter((a) => a !== allergen)
          : [...prev.allergens, allergen],
      };
    });
  };

  const handleSelectChange =
    (name: "quantityUnit" | "expiresAt") =>
    (value: string | number | boolean) => {
      setFormData((prev) => ({ ...prev, [name]: String(value) }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not a valid image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 5MB size limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newImages: ImagePreview[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).slice(2, 11),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) URL.revokeObjectURL(image.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  const calculateDiscount = (): number => {
    const original = parseFloat(formData.originalPrice);
    const current = parseFloat(formData.price);
    if (original > 0 && current > 0 && original > current) {
      return Math.round(((original - current) / original) * 100);
    }
    return 0;
  };
  const discount = calculateDiscount();

  const validateStep1 = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Food item name is required";
    if (formData.name.length > NAME_MAX_LENGTH) {
      newErrors.name = `Name must be ${NAME_MAX_LENGTH} characters or fewer`;
    }
    if (formData.description.length > DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`;
    }
    if (!formData.quantity || parseInt(formData.quantity, 10) <= 0) {
      newErrors.quantity = "Please enter a valid quantity greater than 0";
    }
    if (!formData.isDonation) {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        newErrors.price = "Price is required for non-donation listings";
      }
    }
    return newErrors;
  };

  const validateStep2 = (): Record<string, string> => {
    return {};
  };

  const validateStep3 = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!formData.expiresAt) {
      newErrors.expiresAt = "Expiry time is required";
    } else if (new Date(formData.expiresAt).getTime() <= Date.now() + 15 * 60 * 1000) {
      newErrors.expiresAt = "Expiry time must be at least 15 minutes in the future";
    }
    return newErrors;
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          setPickedLocation({
            address: data.display_name || "Current Location",
            latitude,
            longitude,
          });
        } catch {
          setPickedLocation({
            address: "Current Location",
            latitude,
            longitude,
          });
          toast.error("Address lookup failed, but GPS coordinates were saved");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        toast.error("Please allow location permissions to auto-detect address");
        setLocationLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    if (locationMode === "current") getCurrentLocation();
    if (locationMode === "none") setPickedLocation(null);
  }, [locationMode, getCurrentLocation]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const combinedErrors = {
      ...validateStep1(),
      ...validateStep2(),
      ...validateStep3(),
    };
    if (Object.keys(combinedErrors).length > 0) {
      setErrors(combinedErrors);
      toast.error("Please fill in all required fields before listing");
      return;
    }

    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("description", formData.description);
    payload.append("quantity", formData.quantity);
    payload.append("quantityUnit", formData.quantityUnit);
    payload.append("isDonation", String(formData.isDonation));
    if (!formData.isDonation) {
      payload.append("price", formData.price);
      if (formData.originalPrice)
        payload.append("originalPrice", formData.originalPrice);
      payload.append("discountPct", String(discount));
    }
    payload.append("isRaw", String(formData.isRaw));
    payload.append("allergens", JSON.stringify(formData.allergens));
    payload.append("safetyGuidelines", formData.safetyGuidelines);
    payload.append("expiresAt", new Date(formData.expiresAt).toISOString());

    if (pickedLocation) {
      payload.append("pickupAddress", pickedLocation.address);
      payload.append("latitude", String(pickedLocation.latitude));
      payload.append("longitude", String(pickedLocation.longitude));
    }

    images.forEach((image) => payload.append("images", image.file));

    try {
      await addFood(payload);
      toast.success("Food listed successfully! Community notified 🎉");
      router.push(
        isRestaurant
          ? "/protected/dashboard?role=restaurant"
          : "/protected/dashboard?role=individual",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to list food item",
      );
    }
  };

  const goNext = () => {
    const stepErrors = currentStep === 1 ? validateStep1() : validateStep2();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error("Please complete the required details");
      return;
    }
    setErrors({});
    setCurrentStep((s) => s + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return;
    if (target.closest(".lp-root")) return;

    if (e.key === "Enter") {
      if (currentStep < 3) {
        e.preventDefault();
        goNext();
      }
    }
  };

  return (
    <div className="w-full">
      <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-gray-200/80 dark:border-gray-800/80 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-10 transition-all duration-300">
        {/* Glow backdrop behind card */}
        <div
          className={`absolute -top-20 -right-20 w-80 h-80 bg-linear-to-br ${accentGradient} opacity-10 blur-3xl pointer-events-none rounded-full`}
        />
        <div
          className={`absolute -bottom-20 -left-20 w-80 h-80 bg-linear-to-tr ${accentGradient} opacity-10 blur-3xl pointer-events-none rounded-full`}
        />

        {/* Top Header Card */}
        <div
          className={`relative overflow-hidden bg-linear-to-r ${accentGradient} rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 text-white shadow-xl ${glowShadow}`}
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                <FaUtensils className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider mb-1">
                  <FaMagic className="w-3 h-3 text-amber-300" />
                  {isRestaurant ? "Restaurant Surplus Feed" : "Home Cook Sharing"}
                </div>
                <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                  {isRestaurant ? "List Fresh Surplus Food" : "Share Homemade Delights"}
                </h2>
                <p className="text-white/85 text-xs sm:text-sm mt-0.5">
                  {isRestaurant
                    ? "Connect extra kitchen prep with hungry patrons & eliminate waste."
                    : "Spread warmth and home cooking joy with your community."}
                </p>
              </div>
            </div>

            <Link
              href={
                isRestaurant
                  ? "/protected/dashboard?role=restaurant"
                  : "/protected/dashboard?role=individual"
              }
            >
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 border-white/40 text-white font-medium backdrop-blur-sm transition-all"
              >
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Temporarily disabled AI features - Voice-to-Listing Action Banner
        <div className="mb-8">
          <VoiceListingButton
            onApplyParsedData={handleApplyVoiceParsedData}
            userType={userType}
            variant="banner"
          />
        </div>

        {aiPopulated && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              <FaMagic className="text-amber-500 animate-spin" />
              <span>✨ Fields auto-filled from your voice input! Feel free to review or adjust before posting.</span>
            </div>
            <button
              type="button"
              onClick={() => setAiPopulated(false)}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
        */}

        {/* Step Progress Tracker */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto px-2 sm:px-4">
            {/* Background Line */}
            <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-gray-200 dark:bg-gray-800 rounded-full z-0" />
            
            {/* Active Progress Fill */}
            <div
              className={`absolute top-1/2 left-8 -translate-y-1/2 h-1 bg-linear-to-r ${accentGradient} rounded-full transition-all duration-500 z-0`}
              style={{
                width:
                  currentStep === 1
                    ? "0%"
                    : currentStep === 2
                    ? "50%"
                    : "calc(100% - 4rem)",
              }}
            />

            {[
              { num: 1, label: "Food Details", icon: FaUtensils },
              { num: 2, label: isRestaurant ? "Safety & Diet" : "Location & Safety", icon: isRestaurant ? FaShieldAlt : FaMapMarkerAlt },
              { num: 3, label: "Expiry & Photos", icon: FaClock },
            ].map((step) => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              const Icon = step.icon;

              return (
                <div
                  key={step.num}
                  className="relative z-10 flex flex-col items-center cursor-pointer group"
                  onClick={() => {
                    if (step.num < currentStep) setCurrentStep(step.num);
                  }}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold transition-all duration-300 shadow-md ${
                      isCompleted
                        ? `bg-linear-to-br ${accentGradient} text-white ring-4 ring-green-400/20`
                        : isCurrent
                        ? `bg-linear-to-br ${accentGradient} text-white ring-4 ring-indigo-500/30 scale-105 sm:scale-110 shadow-lg`
                        : "bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {isCompleted ? (
                      <FaCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    ) : (
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-semibold mt-1.5 sm:mt-2 text-center max-w-[85px] sm:max-w-none transition-colors ${
                      isCurrent
                        ? "text-gray-900 dark:text-white"
                        : isCompleted
                        ? "text-gray-700 dark:text-gray-300"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multi-Step Form */}
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: Basic Food Details */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg bg-linear-to-r ${accentGradient} text-white text-xs font-bold`}>
                        Step 1
                      </span>
                      Food Overview & Pricing
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Tell the community what meal you are preparing or listing.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Food Name */}
                  <Input
                    label="Meal / Dish Name"
                    name="name"
                    value={formData.name}
                    error={errors.name}
                    onChange={handleChange}
                    maxLength={NAME_MAX_LENGTH}
                    placeholder={
                      isRestaurant
                        ? "e.g., Paneer Butter Masala Combo, Woodfired Pizza"
                        : "e.g., Homemade Rajma Chawal, Fresh Blueberry Muffins"
                    }
                    required
                    icon={<FaUtensils className="text-gray-400" />}
                  />

                  {/* Description */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Description & Ingredients
                      </label>
                      <span className="text-xs text-gray-400">
                        {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
                      </span>
                    </div>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      maxLength={DESCRIPTION_MAX_LENGTH}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all resize-none shadow-sm"
                      placeholder="Highlight key ingredients, taste notes, portion sizes, or special cooking love..."
                    />
                    {errors.description && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">{errors.description}</p>
                    )}
                  </div>

                  {/* Quantity & Unit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Available Quantity"
                      name="quantity"
                      type="number"
                      error={errors.quantity}
                      min={1}
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="e.g., 5"
                      required
                    />
                    <Select
                      label="Portion / Packaging Unit"
                      name="quantityUnit"
                      value={formData.quantityUnit}
                      onChange={handleSelectChange("quantityUnit")}
                      options={QUANTITY_UNIT_OPTIONS}
                      required
                    />
                  </div>

                  {/* Listing Type: Donation vs Surplus Discount */}
                  <div className="p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/80">
                    <label className="text-sm font-bold text-gray-900 dark:text-white block mb-3">
                      Listing Purpose & Price Model
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Free Donation Option */}
                      <div
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, isDonation: true, price: "", originalPrice: "" }))
                        }
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                          formData.isDonation
                            ? "bg-purple-50/80 dark:bg-purple-950/30 border-purple-500 shadow-md ring-2 ring-purple-500/20"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                          <FaHandHoldingHeart className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                            Free Community Donation
                            {formData.isDonation && <FaCheck className="text-purple-600 dark:text-purple-400 w-3.5 h-3.5" />}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Share 100% free with neighbors, students, or NGOs in need.
                          </p>
                        </div>
                      </div>

                      {/* Surplus Sale Option */}
                      <div
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, isDonation: false }))
                        }
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                          !formData.isDonation
                            ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                          <FaTag className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                            Discounted Surplus Sale
                            {!formData.isDonation && <FaCheck className="text-blue-600 dark:text-blue-400 w-3.5 h-3.5" />}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Recover costs at a steep discount while preventing food waste.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price Inputs if Not Donation */}
                    {!formData.isDonation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        <Input
                          label="Discounted Listing Price (₹)"
                          name="price"
                          type="number"
                          min={0}
                          error={errors.price}
                          step="1"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder={isRestaurant ? "e.g., 99" : "e.g., 60"}
                          required
                        />
                        <Input
                          label="Original Menu Price (₹) (Optional)"
                          name="originalPrice"
                          type="number"
                          min={0}
                          step="1"
                          value={formData.originalPrice}
                          onChange={handleChange}
                          placeholder={isRestaurant ? "e.g., 250" : "e.g., 120"}
                          helperText="Shown to users to highlight their food savings"
                        />

                        {discount > 0 && (
                          <div className="sm:col-span-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                              🎉 Great deal! Customers will save:
                            </span>
                            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                              {discount}% OFF Menu Price
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Safety, Allergens & Location */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg bg-linear-to-r ${accentGradient} text-white text-xs font-bold`}>
                        Step 2
                      </span>
                      {isRestaurant ? "Allergens & Kitchen Standards" : "Pickup Location & Allergens"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Help consumers dine safely with precise dietary & pickup guidance.
                    </p>
                  </div>
                </div>

                {/* Individual Location Picker Section */}
                {!isRestaurant && (
                  <div className="p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-sm">
                        <FaMapMarkerAlt className="text-rose-500" />
                        Pickup Location Settings
                      </div>
                      <span className="text-xs text-gray-400">Optional Custom Spot</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* GPS Detection Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setLocationMode((prev) => (prev === "current" ? "none" : "current"))
                        }
                        className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          locationMode === "current"
                            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 font-semibold"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0">
                          <FaMapMarkerAlt className="text-rose-600 dark:text-rose-400 w-4 h-4" />
                        </div>
                        <div className="text-xs">
                          <div className="font-bold">Use Current GPS</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">Auto-detect device coordinates</div>
                        </div>
                      </button>

                      {/* Map Picker Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setLocationMode((prev) => (prev === "map" ? "none" : "map"))
                        }
                        className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          locationMode === "map"
                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                          <FaMapMarkerAlt className="text-indigo-600 dark:text-indigo-400 w-4 h-4" />
                        </div>
                        <div className="text-xs">
                          <div className="font-bold">Pick on Interactive Map</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">Choose custom meeting point</div>
                        </div>
                      </button>
                    </div>

                    {/* GPS Detection status */}
                    {locationMode === "current" && (
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                        {locationLoading ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <span className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                            Detecting exact GPS address...
                          </div>
                        ) : pickedLocation ? (
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">Detected: </span>
                            <span className="text-gray-600 dark:text-gray-300">{pickedLocation.address}</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Interactive Map Picker */}
                    {locationMode === "map" && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <LocationPicker
                          isDark={isDark}
                          onLocationSelect={(lat, lng, address) =>
                            setPickedLocation({ address, latitude: lat, longitude: lng })
                          }
                        />
                      </div>
                    )}

                    {!pickedLocation && locationMode === "none" && (
                      <p className="text-xs text-gray-400 italic">
                        ℹ️ Default: Your registered home/account address will be shared securely after reservation.
                      </p>
                    )}
                  </div>
                )}

                {/* Allergen Tag Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Contains Allergens (Tap all that apply)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {ALLERGEN_OPTIONS.map((item) => {
                      const isSelected = formData.allergens.includes(item.value);
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => toggleAllergen(item.value)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all text-left ${
                            isSelected
                              ? "bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 font-bold shadow-xs ring-1 ring-amber-500"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300"
                          }`}
                        >
                          <span className="text-base">{item.icon}</span>
                          <span className="truncate flex-1">{item.label}</span>
                          {isSelected && <FaCheck className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Storage & Safety Guidelines */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                    Consumption & Reheating Advice
                  </label>
                  <textarea
                    name="safetyGuidelines"
                    value={formData.safetyGuidelines}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-sm"
                    placeholder="e.g., Best consumed within 2 hours. Keep chilled if consuming later."
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: Expiry & Images */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg bg-linear-to-r ${accentGradient} text-white text-xs font-bold`}>
                        Step 3
                      </span>
                      Expiry Window & Delicious Photos
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Set a strict pickup cutoff and upload tempting photos.
                    </p>
                  </div>
                </div>

                {/* Expiry Selection Card */}
                <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
                    <FaClock className="text-amber-600 dark:text-amber-400" />
                    Pickup Expiry Deadline (Food Safety Gate)
                  </div>

                  <Select
                    label="Listing Valid Until"
                    name="expiresAt"
                    value={formData.expiresAt}
                    onChange={handleSelectChange("expiresAt")}
                    options={expiryOptions}
                    required
                  />
                  {errors.expiresAt && (
                    <p className="text-xs text-rose-500 font-semibold">{errors.expiresAt}</p>
                  )}

                  {formData.expiresAt && (
                    <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-amber-200 dark:border-amber-700/50 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Available For:</span>
                        <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                          {(() => {
                            const diffMs = new Date(formData.expiresAt).getTime() - Date.now();
                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                            return diffHours > 0 ? `${diffHours}h ${diffMinutes}m remaining` : `${diffMinutes}m remaining`;
                          })()}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded-full">
                        Auto-Unlists After Time
                      </span>
                    </div>
                  )}
                </div>

                {/* Image Upload Area */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Photos of the Food (Max {MAX_IMAGES})
                  </label>
                  
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-2xl p-6 sm:p-8 text-center transition-all bg-gray-50/40 dark:bg-gray-800/20">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                      <FaUpload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Drag and drop your photos here, or browse
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      Supports JPG, PNG, WebP up to 5MB each. Clear photos get reserved 3x faster!
                    </p>

                    <label className="inline-block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <span className={`px-5 py-2.5 rounded-xl bg-linear-to-r ${accentGradient} text-white text-xs font-bold shadow-md hover:shadow-lg transition-all`}>
                        Select Photos
                      </span>
                    </label>
                  </div>

                  {/* Thumbnail Previews */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {images.map((image, idx) => (
                        <div key={image.id} className="relative group rounded-xl overflow-hidden shadow-sm aspect-4/3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.preview}
                            alt="Food preview"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                            {idx === 0 ? "Cover Photo" : `Photo ${idx + 1}`}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 transition-opacity shadow-md"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Action Controls */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="px-6 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
              >
                <FaArrowLeft className="mr-2 w-3.5 h-3.5" />
                Previous
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={goNext}
                className={`px-8 bg-linear-to-r ${accentGradient} text-white font-bold shadow-lg hover:shadow-xl transition-all`}
              >
                Continue
                <FaArrowRight className="ml-2 w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="secondary"
                loading={isAdding}
                className={`px-10 py-3 bg-linear-to-r ${accentGradient} text-white font-extrabold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all`}
              >
                {isRestaurant ? "🚀 Publish Surplus Listing" : "💝 Share Food Now"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
