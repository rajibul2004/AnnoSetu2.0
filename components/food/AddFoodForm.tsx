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
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Button from "@/components/common/Button";
import LocationPicker from "@/components/common/LocationPicker";
import toast from "react-hot-toast";
import { useAddFood } from "@/hooks/useFoodQueries";
import type { Allergen, QuantityUnit } from "@/types/food";

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
  { value: "servings", label: "Servings" },
  { value: "plates", label: "Plates" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "units", label: "Units" },
  { value: "packets", label: "Packets" },
];

const ALLERGEN_OPTIONS: { value: Allergen; label: string }[] = [
  { value: "nuts", label: "Nuts" },
  { value: "dairy", label: "Dairy" },
  { value: "gluten", label: "Gluten" },
  { value: "seafood", label: "Seafood" },
  { value: "eggs", label: "Eggs" },
  { value: "soy", label: "Soy" },
  { value: "sesame", label: "Sesame" },
  { value: "shellfish", label: "Shellfish" },
  { value: "mustard", label: "Mustard" },
  { value: "sulphites", label: "Sulphites" },
  { value: "other", label: "Other" },
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

  const [locationMode, setLocationMode] = useState<LocationMode>("none");
  const [locationLoading, setLocationLoading] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(
    null,
  );

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

  const roleColor = userType === "restaurant" ? "blue" : "pink";
  const accentGradient =
    userType === "restaurant"
      ? "from-blue-500 to-green-500"
      : "from-pink-500 to-amber-500";

  const expiryOptions = useMemo(() => {
    const now = new Date();
    const options: { value: string; label: string }[] = [];
    const maxHours = userType === "restaurant" ? 24 : 6;

    for (let i = 1; i <= maxHours; i++) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000);
      options.push({
        value: time.toISOString(),
        label: `${i} hour${i > 1 ? "s" : ""} from now (${time.toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        )})`,
      });
    }

    const todayTimes =
      userType === "restaurant"
        ? ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
        : ["18:00", "19:00", "20:00", "21:00"];

    todayTimes.forEach((timeStr) => {
      const [hours, minutes] = timeStr.split(":");
      const time = new Date();
      time.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      if (time > now) {
        options.push({
          value: time.toISOString(),
          label: `Today at ${timeStr}`,
        });
      }
    });

    return options;
  }, [userType]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const target = e.target;
    const { name, value } = target;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
      return;
    }

    if (name === "allergens" && target instanceof HTMLSelectElement) {
      const selected = Array.from(
        target.selectedOptions,
        (o) => o.value as Allergen,
      );
      setFormData((prev) => ({ ...prev, allergens: selected }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
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
      // 5MB limit
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
    if (!formData.name.trim()) newErrors.name = "Food name is required";
    if (formData.name.length > NAME_MAX_LENGTH) {
      newErrors.name = `Name must be ${NAME_MAX_LENGTH} characters or fewer`;
    }
    if (formData.description.length > DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`;
    }
    if (!formData.quantity || parseInt(formData.quantity, 10) <= 0) {
      newErrors.quantity = "Valid quantity is required";
    }
    if (!formData.isDonation) {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        newErrors.price = "Valid price is required";
      }
    }
    return newErrors;
  };

  const validateStep2 = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    return newErrors;
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
          toast.error("Address lookup failed, but coordinates were captured");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        toast.error("Please allow location access to continue");
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
      toast.error("Please fix the errors before submitting");
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
      toast.success("Food listed successfully! 🎉");
      router.push(
        userType === "individual"
          ? "/protected/dashboard?role=individual"
          : "/protected/dashboard?role=restaurant",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add food item",
      );
    }
  };

  const goNext = () => {
    const stepErrors = currentStep === 1 ? validateStep1() : validateStep2();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error("Please fix the errors before proceeding!");
      return;
    }
    setErrors({});
    setCurrentStep((s) => s + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;

    // Ignore textareas and buttons
    if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") {
      return;
    }

    // Also ignore inputs inside the location picker so users can search places
    if (target.closest(".lp-root")) {
      return;
    }

    if (e.key === "Enter") {
      if (currentStep < 3) {
        e.preventDefault();
        goNext();
      }
      // If currentStep === 3, we allow the native form submission to occur
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 rounded-lg shadow-md shadow-gray-200 dark:shadow-gray-700 py-8">
      <div className="max-w-6xl mx-auto px-1 sm:px-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Header */}
          <div
            className={`bg-linear-to-r ${accentGradient} rounded-3xl p-8 mb-8 text-white shadow-2xl`}
          >
            <div className="flex flex-col lg:flex-row gap-4 md:gap-0 items-center justify-between">
              <div className="flex items-start md:items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <FaUtensils className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="lg:text-3xl text-xl font-bold mb-2">
                    {userType === "restaurant"
                      ? "Add Surplus Food"
                      : "Share Home-Cooked Food"}
                  </h1>
                  <p className="text-white/80 hidden lg:flex">
                    {userType === "restaurant"
                      ? "Turn your surplus into community support"
                      : "Share your love for cooking with others"}
                  </p>
                </div>
              </div>
              <Link
                href={
                  userType === "individual"
                    ? "/protected/dashboard?role=individual"
                    : "/protected/dashboard?role=restaurant"
                }
              >
                <Button
                  variant="outline"
                  className="border-white hover:bg-white/20 w-full lg:w-auto"
                >
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8 w-full">
            <div className="grid grid-cols-3 justify-items-center mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= step
                        ? `bg-linear-to-r ${accentGradient} text-white`
                        : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {currentStep > step ? <FaCheckCircle /> : step}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 text-center text-sm text-gray-600 dark:text-gray-300">
              <span>Basic Details</span>
              <span>
                {userType === "individual"
                  ? "Location & Safety"
                  : "Safety Guidelines"}
              </span>
              <span>Images & Submit</span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            className="space-y-6"
          >
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-4 border border-gray-100 dark:border-gray-700"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6 flex items-center gap-2">
                    <span
                      className={`w-8 h-8 rounded-full bg-${roleColor}-100 text-${roleColor}-600 flex items-center justify-center`}
                    >
                      1
                    </span>
                    Basic Food Details
                  </h2>

                  <div className="space-y-6">
                    <Input
                      label="Food Name"
                      name="name"
                      value={formData.name}
                      error={errors.name}
                      onChange={handleChange}
                      maxLength={NAME_MAX_LENGTH}
                      placeholder={
                        userType === "restaurant"
                          ? "e.g., Margherita Pizza, Chicken Biryani"
                          : "e.g., Homemade Lasagna, Chicken Curry"
                      }
                      required
                      icon={<FaUtensils className={`text-${roleColor}-400`} />}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        maxLength={DESCRIPTION_MAX_LENGTH}
                        className="dark:text-gray-100 text-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 w-full px-4 py-3 border-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus-within:border-green-500 rounded-xl focus:outline-none shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Describe your food - ingredients, serving size, special notes..."
                      />
                      {errors.description && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Quantity"
                        name="quantity"
                        type="number"
                        error={errors.quantity}
                        min={1}
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="e.g., 10"
                        required
                      />
                      <Select
                        label="Unit"
                        name="quantityUnit"
                        value={formData.quantityUnit}
                        onChange={handleSelectChange("quantityUnit")}
                        options={QUANTITY_UNIT_OPTIONS}
                        required
                      />
                    </div>

                    <div
                      className={`p-2 md:p-6 rounded-xl ${
                        userType === "individual"
                          ? "bg-linear-to-br from-purple-50 dark:from-purple-900 to-pink-50 dark:to-pink-900 border border-purple-200 dark:border-purple-700"
                          : "bg-linear-to-br from-blue-50 dark:from-blue-900 to-green-50 dark:to-green-900 border border-blue-200 dark:border-blue-700"
                      }`}
                    >
                      <label className="flex items-start gap-4 cursor-pointer">
                        <input
                          type="checkbox"
                          name="isDonation"
                          checked={formData.isDonation}
                          onChange={handleChange}
                          className="mt-1 w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-500 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 cursor-pointer hover:border-green-500 dark:hover:border-green-500"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-50">
                            {userType === "individual"
                              ? "Share as Donation"
                              : "List as Donation"}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 hidden md:flex">
                            {userType === "individual"
                              ? "Share your food for free and help those in need"
                              : "Build community relationships by offering food for free"}
                          </div>
                        </div>
                        {formData.isDonation && (
                          <span className="px-4 py-2 bg-purple-500 text-white rounded-full text-sm font-medium">
                            🆓 Free
                          </span>
                        )}
                      </label>
                    </div>

                    {!formData.isDonation && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Price (₹)"
                          name="price"
                          type="number"
                          min={0}
                          error={errors.price}
                          step="0.01"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder={
                            userType === "restaurant"
                              ? "e.g., 299"
                              : "e.g., 199"
                          }
                          required
                        />
                        <Input
                          label="Original Price (₹)"
                          name="originalPrice"
                          type="number"
                          min={0}
                          step="0.01"
                          value={formData.originalPrice}
                          onChange={handleChange}
                          placeholder="e.g., 499"
                          helperText="Show customers their savings"
                        />
                      </div>
                    )}

                    {!formData.isDonation && discount > 0 && (
                      <div className="p-4 bg-linear-to-r from-green-50 dark:from-green-900 to-emerald-50 dark:to-emerald-900 border border-green-200 dark:border-green-700 rounded-xl">
                        <div className="flex flex-col md:flex-row items-center justify-between">
                          <div>
                            <div className="font-medium text-green-900 dark:text-green-50">
                              Discount Applied
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-200 hidden md:flex">
                              Customers save {discount}%
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-green-600 dark:text-green-300">
                            {discount}% OFF
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-4 border border-gray-100 dark:border-gray-700"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6 flex items-center gap-2">
                    <span
                      className={`w-8 h-8 rounded-full bg-${roleColor}-100 text-${roleColor}-600 flex items-center justify-center`}
                    >
                      2
                    </span>
                    {userType === "individual" ? "Location & Safety" : "Safety"}
                  </h2>

                  <div className="space-y-6">
                    {userType === "individual" && (
                      <div className="space-y-4">
                        <div
                          className={`p-6 rounded-xl bg-linear-to-br from-${roleColor}-50 dark:from-gray-800 to-${roleColor}-100 dark:to-${roleColor}-900 border border-${roleColor}-200 dark:border-${roleColor}-700 flex flex-col gap-4`}
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex w-full space-x-4">
                              <input
                                type="checkbox"
                                checked={locationMode === "current"}
                                onChange={() =>
                                  setLocationMode((prev) =>
                                    prev === "current" ? "none" : "current",
                                  )
                                }
                                className="mt-1 w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-500 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 cursor-pointer hover:border-green-500 dark:hover:border-green-500"
                              />
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-gray-50">
                                  Use My Current Location
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  We&apos;ll use your device&apos;s GPS to set
                                  the pickup location
                                </div>
                              </div>
                            </div>

                            {locationMode === "current" && (
                              <div className="w-full pl-8">
                                {locationLoading ? (
                                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <svg
                                      className="animate-spin w-4 h-4"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8z"
                                      />
                                    </svg>
                                    Detecting your location…
                                  </div>
                                ) : pickedLocation ? (
                                  <div className="p-4 bg-white dark:bg-gray-900 rounded-xl">
                                    <p className="font-medium text-gray-900 dark:text-gray-50">
                                      {pickedLocation.address}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Lat: {pickedLocation.latitude.toFixed(4)},
                                      Lng: {pickedLocation.longitude.toFixed(4)}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={getCurrentLocation}
                                      className="mt-2 text-xs text-indigo-500 hover:underline"
                                    >
                                      Retry detection
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-4">
                            <div className="flex w-full space-x-4">
                              <input
                                type="checkbox"
                                checked={locationMode === "map"}
                                onChange={() =>
                                  setLocationMode((prev) =>
                                    prev === "map" ? "none" : "map",
                                  )
                                }
                                className="mt-1 w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-500 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 cursor-pointer hover:border-green-500 dark:hover:border-green-500"
                              />
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-gray-50">
                                  Get Location from Map
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  Click the map or drag the pin to pick your
                                  exact location
                                </div>
                              </div>
                            </div>

                            {locationMode === "map" && (
                              <LocationPicker
                                isDark={isDark}
                                onLocationSelect={(
                                  lat: number,
                                  lng: number,
                                  address: string,
                                ) =>
                                  setPickedLocation({
                                    address,
                                    latitude: lat,
                                    longitude: lng,
                                  })
                                }
                              />
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-xl">
                          <div className="flex gap-3">
                            <FaExclamationTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                                Safety First
                              </p>
                              <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                                Choose a public meeting spot for pickup. Your
                                exact address is only shared after reservation.
                              </p>
                            </div>
                          </div>
                        </div>
                        {!pickedLocation && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            No location picked — your profile&apos;s saved
                            address will be used as the pickup location instead.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl">
                        <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                          <span className="font-bold">Note:</span> For safety reasons, only cooked, ready-to-eat food can be listed on Annosetu. Raw ingredients are not permitted.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Allergens (select multiple)
                        </label>
                        <select
                          name="allergens"
                          value={formData.allergens}
                          onChange={handleChange}
                          multiple
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 h-32 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        >
                          {ALLERGEN_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Safety Guidelines
                        </label>
                        <textarea
                          name="safetyGuidelines"
                          value={formData.safetyGuidelines}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-4 border border-gray-100 dark:border-gray-700"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6 flex items-center gap-2">
                    <span
                      className={`w-8 h-8 rounded-full bg-${roleColor}-100 text-${roleColor}-600 flex items-center justify-center`}
                    >
                      3
                    </span>
                    Expiry & Images
                  </h2>

                  <div className="space-y-6">
                    <div className="p-6 rounded-xl bg-linear-to-br from-orange-50 dark:from-orange-900/20 to-amber-50 dark:to-amber-900/20 border border-orange-200 dark:border-orange-700">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                        <FaClock className="text-orange-600 dark:text-orange-300" />
                        Expiry Time
                      </h3>

                      <Select
                        label="Food will expire at"
                        name="expiresAt"
                        value={formData.expiresAt}
                        onChange={handleSelectChange("expiresAt")}
                        options={expiryOptions}
                        required
                      />
                      {errors.expiresAt && (
                        <p className="text-sm text-red-600 mt-2">
                          {errors.expiresAt}
                        </p>
                      )}

                      {formData.expiresAt && (
                        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Available for
                            </p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-300">
                              {(() => {
                                const diffMs =
                                  new Date(formData.expiresAt).getTime() -
                                  Date.now();
                                const diffHours = Math.floor(
                                  diffMs / (1000 * 60 * 60),
                                );
                                const diffMinutes = Math.floor(
                                  (diffMs % (1000 * 60 * 60)) / (1000 * 60),
                                );
                                return diffHours > 0
                                  ? `${diffHours}h ${diffMinutes}m`
                                  : `${diffMinutes} minutes`;
                              })()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Auto-removes at{" "}
                              {new Date(
                                formData.expiresAt,
                              ).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
                      <FaUpload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <span
                          className={`inline-block px-6 py-3 bg-gradient-to-r ${accentGradient} text-white dark:text-gray-900 rounded-xl font-medium hover:shadow-lg transition-all duration-300`}
                        >
                          Choose Images
                        </span>
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        Upload up to {MAX_IMAGES} images • Max 5MB each • PNG,
                        JPG, GIF
                      </p>
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-3 gap-4">
                        {images.map((image) => (
                          <div key={image.id} className="relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.preview}
                              alt="Preview"
                              className="w-full h-32 object-cover rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(image.id)}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between gap-4">
              {currentStep > 1 && currentStep < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="flex-1"
                >
                  <FaArrowLeft className="mr-2" />
                  Previous
                </Button>
              )}
              {currentStep === 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="flex-1"
                >
                  <FaArrowLeft className="mr-2" />
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  key="next-button"
                  type="button"
                  variant="secondary"
                  onClick={goNext}
                  className={`flex-1 bg-linear-to-r ${accentGradient}`}
                >
                  Next
                  <FaArrowRight className="ml-2" />
                </Button>
              ) : (
                <Button
                  key="submit-button"
                  type="submit"
                  fullWidth
                  variant="secondary"
                  loading={isAdding}
                  className={`bg-linear-to-r ${accentGradient} hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200`}
                >
                  {userType === "restaurant"
                    ? "List This Food"
                    : "Share This Food"}
                </Button>
              )}
            </div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-linear-to-r from-red-50 dark:from-red-900/20 to-orange-50 dark:to-orange-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-4"
          >
            <div className="flex gap-4">
              <FaShieldAlt className="w-8 h-8 text-red-500 dark:text-red-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-50 mb-2">
                  Food Safety First
                </h3>
                <ul className="space-y-2 text-sm text-red-700 dark:text-red-200">
                  <li>✓ Only cooked, ready-to-eat food allowed</li>
                  <li>✓ Maintain proper storage temperature</li>
                  <li>✓ Accurate expiry time is mandatory</li>
                  <li>✓ Use clean packaging for pickup</li>
                </ul>
                <p className="text-xs text-red-600 dark:text-red-300 mt-3">
                  Violation of safety guidelines may result in account
                  suspension
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
