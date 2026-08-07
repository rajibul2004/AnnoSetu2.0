"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaCheckCircle,
  FaArrowRight,
  FaShieldAlt,
  FaHeart,
  FaArrowLeft,
  FaExclamationCircle,
} from "react-icons/fa";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import LocationPicker from "@/components/common/LocationPicker";
import OtpVerificationModal from "@/components/auth/OtpVerificationModal";
import { useTheme } from "next-themes";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "individual" | "restaurant" | "ngo";
  restaurantName: string;
  ngoName: string;
  ngoRegistrationId: string;
  address: string;
  phone: string;
  acceptedDisclaimer: boolean;
  acceptedFoodDisclaimer: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

interface CustomLocation {
  address: string;
  latitude: number;
  longitude: number;
}

const PASSWORD_REGEX = {
  upper: /[A-Z]/,
  lower: /[a-z]/,
  digit: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

function normalizePhone(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, "");
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return digitsOnly.slice(2);
  }
  return digitsOnly;
}

interface RegisterPayload {
  email: string;
  password: string;
  role: FormData["role"];
  phone: string;
  address: string;
  acceptedDisclaimer: boolean;
  name?: string;
  restaurantName?: string;
  ngoName?: string;
  registrationId?: string;
  latitude?: number;
  longitude?: number;
}

interface ApiErrorResponse {
  error?: string;
  details?: { path: (string | number)[]; message: string }[];
}

const RegisterContent = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: (searchParams.get("role") as FormData["role"]) || "individual",
    restaurantName: "",
    ngoName: "",
    ngoRegistrationId: "",
    address: "",
    phone: "",
    acceptedDisclaimer: false,
    acceptedFoodDisclaimer: false,
    latitude: null,
    longitude: null,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [locationMode, setLocationMode] = useState<"none" | "current" | "map">(
    "none",
  );
  const [customLocation, setCustomLocation] = useState<CustomLocation>({
    address: "",
    latitude: 0,
    longitude: 0,
  });
  const [useLocationAsAddress, setUseLocationAsAddress] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpModal, setOtpModal] = useState<{
    isOpen: boolean;
    type: "email" | "phone";
    identifier: string;
  }>({
    isOpen: false,
    type: "email",
    identifier: "",
  });

  const roleOptions = [
    {
      value: "individual",
      label: "Individual",
      icon: "👤",
      activeClass: "border-pink-500 text-pink-600",
    },
    {
      value: "restaurant",
      label: "Restaurant",
      icon: "🏪",
      activeClass: "border-blue-500 text-blue-500",
    },
    {
      value: "ngo",
      label: "NGO",
      icon: "🏥",
      activeClass: "border-purple-500 text-purple-500",
    },
  ];

  const roleGradientMap = {
    individual: "from-pink-700 via-pink-500 to-pink-400",
    restaurant: "from-blue-700 via-blue-500 to-blue-400",
    ngo: "from-purple-700 via-purple-500 to-purple-400",
  };

  const roleColorClass = {
    individual: "text-pink-400",
    restaurant: "text-blue-400",
    ngo: "text-purple-400",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "email") {
      setIsEmailVerified(false);
    }
    if (name === "phone") {
      setIsPhoneVerified(false);
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (formData.role === "individual") {
      if (!formData.name.trim()) newErrors.name = "Name is required";
      else if (formData.name.trim().length < 2)
        newErrors.name = "Name must be at least 2 characters";
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Valid email is required";
    }
    if (formData.role === "restaurant") {
      if (!formData.restaurantName.trim())
        newErrors.restaurantName = "Restaurant name is required";
      else if (formData.restaurantName.trim().length < 2)
        newErrors.restaurantName =
          "Restaurant name must be at least 2 characters";
    }
    if (formData.role === "ngo") {
      if (!formData.ngoName.trim()) newErrors.ngoName = "NGO name is required";
      else if (formData.ngoName.trim().length < 2)
        newErrors.ngoName = "NGO name must be at least 2 characters";

      if (!formData.ngoRegistrationId.trim())
        newErrors.ngoRegistrationId = "Registration ID is required";
      else if (formData.ngoRegistrationId.trim().length < 3)
        newErrors.ngoRegistrationId =
          "Registration ID must be at least 3 characters";
    }
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    const normalizedPhone = normalizePhone(formData.phone);
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      newErrors.phone =
        "Enter a valid 10-digit Indian mobile number (e.g. 98765 43210)";
    }

    if (!formData.address.trim()) newErrors.address = "Address is required";
    else if (formData.address.trim().length < 5)
      newErrors.address = "Address must be at least 5 characters";

    if (formData.role !== "individual") {
      const hasLocation =
        formData.latitude !== null && formData.longitude !== null;
      if (!hasLocation) newErrors.location = "Location is required";
    }
    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    const { password } = formData;
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!PASSWORD_REGEX.upper.test(password)) {
      newErrors.password = "Password must contain an uppercase letter";
    } else if (!PASSWORD_REGEX.lower.test(password)) {
      newErrors.password = "Password must contain a lowercase letter";
    } else if (!PASSWORD_REGEX.digit.test(password)) {
      newErrors.password = "Password must contain a number";
    } else if (!PASSWORD_REGEX.special.test(password)) {
      newErrors.password = "Password must contain a special character";
    }
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.acceptedDisclaimer)
      newErrors.acceptedDisclaimer = "You must accept the terms and conditions";
    if (formData.role === "individual" && !formData.acceptedFoodDisclaimer) {
      newErrors.acceptedFoodDisclaimer =
        "You must accept food safety disclaimer";
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateStep3();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors in the form!");
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterPayload = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: normalizePhone(formData.phone),
        address: formData.address,
        acceptedDisclaimer: formData.acceptedDisclaimer,
      };

      if (formData.role === "individual") {
        payload.name = formData.name;
      }

      if (formData.role === "restaurant") {
        payload.restaurantName = formData.restaurantName;
      }

      if (formData.role === "ngo") {
        payload.ngoName = formData.ngoName;
        payload.registrationId = formData.ngoRegistrationId;
      }

      if (formData.latitude !== null && formData.longitude !== null) {
        payload.latitude = formData.latitude ?? undefined;
        payload.longitude = formData.longitude ?? undefined;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ApiErrorResponse & { success?: boolean } = await res.json();

      if (!res.ok) {
        const message = data?.error || "Registration failed. Please try again.";
        toast.error(message);

        if (data?.details?.length) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of data.details) {
            const key = issue.path?.[0];
            if (typeof key === "string") {
              fieldErrors[key] = issue.message;
            }
          }
          if (Object.keys(fieldErrors).length > 0) {
            setErrors((prev) => ({ ...prev, ...fieldErrors }));
          }
        }
        return;
      }

      toast.success("Account created! Please login.");
      router.push("/auth/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, location: "Geolocation not supported" }));
      return;
    }
    setLocationLoading(true);
    setErrors((prev) => {
      const { location, ...rest } = prev;
      return rest;
    });

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          const resolved = {
            address: data.display_name || "Current Location",
            latitude,
            longitude,
          };
          setCustomLocation(resolved);
          setFormData((prev) => ({
            ...prev,
            latitude: resolved.latitude,
            longitude: resolved.longitude,
            ...(useLocationAsAddress ? { address: resolved.address } : {}),
          }));
          setErrors((prev) => {
            const { location, ...rest } = prev;
            return rest;
          });
        } catch {
          const fallback = { address: "Current Location", latitude, longitude };
          setCustomLocation(fallback);
          setFormData((prev) => ({
            ...prev,
            latitude: fallback.latitude,
            longitude: fallback.longitude,
          }));
          setErrors((prev) => ({
            ...prev,
            location: "Address lookup failed, but coordinates captured",
          }));
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setErrors((prev) => ({
          ...prev,
          location: "Please allow location access",
        }));
        setLocationLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }, [useLocationAsAddress]);

  useEffect(() => {
    if (locationMode === "current") getCurrentLocation();
    if (locationMode === "none") {
      setCustomLocation({ address: "", latitude: 0, longitude: 0 });
      setFormData((prev) => ({
        ...prev,
        latitude: null,
        longitude: null,
        ...(useLocationAsAddress ? { address: "" } : {}),
      }));
      setErrors((prev) => {
        const { location, ...rest } = prev;
        return rest;
      });
    }
  }, [locationMode, getCurrentLocation, useLocationAsAddress]);

  useEffect(() => {
    if (useLocationAsAddress && customLocation.address) {
      setFormData((prev) => ({ ...prev, address: customLocation.address }));
    } else if (!useLocationAsAddress && locationMode === "none") {
      setFormData((prev) => ({ ...prev, address: "" }));
    }
  }, [useLocationAsAddress, customLocation.address, locationMode]);

  const isLocationSelected =
    formData.latitude !== null && formData.longitude !== null;

  if (!mounted) return null;

  return (
    <div className="min-h-screen py-12 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-3xl font-bold bg-gradient-to-r ${roleGradientMap[formData.role]} bg-clip-text text-transparent`}
            >
              Join Annosetu
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-gray-600 dark:text-gray-300"
            >
              Create an account and start your food-saving journey today
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            {roleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    role: option.value as FormData["role"],
                  }));
                  setCurrentStep(1);
                }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer duration-300 ${
                  formData.role === option.value
                    ? `${option.activeClass} shadow-lg scale-105`
                    : "border-gray-500 dark:border-gray-300 dark:hover:border-gray-200 hover:border-gray-700 hover:scale-102"
                }`}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <div
                  className={`text-sm font-medium ${formData.role === option.value ? option.activeClass : "text-gray-600 dark:text-gray-300"}`}
                >
                  {option.label}
                </div>
              </button>
            ))}
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Registration Progress
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStep} of 3
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${roleGradientMap[formData.role]}`}
                initial={{ width: "33%" }}
                animate={{
                  width:
                    currentStep === 1
                      ? "33%"
                      : currentStep === 2
                        ? "66%"
                        : "100%",
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Registration Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card backdrop-blur-lg rounded-2xl shadow-2xl p-8"
          >
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full bg-gradient-to-r ${roleGradientMap[formData.role]} flex items-center justify-center text-sm font-bold text-white`}
                      >
                        1
                      </span>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {formData.role === "individual" && (
                        <Input
                          label="Full Name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          error={errors.name}
                          required
                          icon={<FaUser className="text-pink-400" />}
                          placeholder="Enter your full name"
                        />
                      )}
                      {formData.role === "restaurant" && (
                        <Input
                          label="Restaurant Name"
                          name="restaurantName"
                          value={formData.restaurantName}
                          onChange={handleChange}
                          error={errors.restaurantName}
                          required
                          icon={<FaBuilding className="text-blue-400" />}
                          placeholder="Enter your restaurant name"
                        />
                      )}
                      {formData.role === "ngo" && (
                        <Input
                          label="NGO Name"
                          name="ngoName"
                          value={formData.ngoName}
                          onChange={handleChange}
                          error={errors.ngoName}
                          required
                          icon={<FaBuilding className="text-purple-400" />}
                          placeholder="Enter NGO name"
                        />
                      )}
                      <div className="relative">
                        <Input
                          label="Email Address"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          error={errors.email}
                          required
                          icon={
                            <FaEnvelope
                              className={roleColorClass[formData.role]}
                            />
                          }
                          placeholder="you@example.com"
                        />
                        {isEmailVerified && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            <FaCheckCircle className="text-emerald-500" />
                            <span>Email Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {/* <Button
                      variant={"ghost"}
                        onClick={handleSubmit}
                        fullWidth
                        loading={loading}
                        className={`hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 text-white`}
                      >
                        Create Account
                      </Button> */}
                    </div>
                    {formData.role === "ngo" && (
                      <Input
                        label="Registration ID"
                        name="ngoRegistrationId"
                        value={formData.ngoRegistrationId}
                        onChange={handleChange}
                        error={errors.ngoRegistrationId}
                        required
                        placeholder="NGO registration number"
                      />
                    )}
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full bg-gradient-to-r ${roleGradientMap[formData.role]} flex items-center justify-center text-sm font-bold text-white`}
                      >
                        2
                      </span>
                      Contact & Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Input
                          label="Phone Number"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          error={errors.phone}
                          required
                          icon={
                            <FaPhone className={roleColorClass[formData.role]} />
                          }
                          placeholder="98765 43210"
                          helperText="10-digit Indian mobile number"
                        />
                        {/* Later improved version: Phone SMS OTP Verification
                        {isPhoneVerified && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            <FaCheckCircle className="text-emerald-500" />
                            <span>Phone Verified</span>
                          </div>
                        )}
                        */}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Input
                          label="Address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          error={errors.address}
                          required
                          icon={
                            <FaMapMarkerAlt
                              className={roleColorClass[formData.role]}
                            />
                          }
                          placeholder="Enter your address"
                        />
                        {formData.role !== "individual" && (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="checkbox"
                              id="useLocAsAddr"
                              checked={useLocationAsAddress}
                              onChange={(e) =>
                                setUseLocationAsAddress(e.target.checked)
                              }
                              className="w-3 h-3"
                            />
                            <label
                              htmlFor="useLocAsAddr"
                              className="text-xs text-gray-600 dark:text-gray-300 cursor-pointer"
                            >
                              Use selected location as address
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {(formData.role === "ngo" ||
                      formData.role === "restaurant") && (
                      <div className="flex flex-col space-y-1.5">
                        <div
                          className={`text-sm font-medium flex items-center gap-1 ${errors.location ? "text-red-500" : "text-gray-700 dark:text-gray-200"}`}
                        >
                          Location <span className="text-red-500">*</span>
                        </div>
                        <div
                          className={`bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border-2 flex flex-col gap-6 transition-all duration-200 ${
                            errors.location
                              ? "border-red-400"
                              : isLocationSelected
                                ? "border-green-400"
                                : "border-gray-200 dark:border-gray-600"
                          }`}
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex w-full space-x-4">
                              <input
                                type="checkbox"
                                checked={locationMode === "current"}
                                onChange={() =>
                                  setLocationMode(
                                    locationMode === "current"
                                      ? "none"
                                      : "current",
                                  )
                                }
                                className="mt-1 size-4 text-green-600 rounded"
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
                                ) : customLocation.address ? (
                                  <div className="p-4 bg-white dark:bg-gray-900 rounded-xl">
                                    <p className="font-medium text-gray-900 dark:text-gray-50">
                                      {customLocation.address}
                                    </p>
                                    {customLocation.latitude !== 0 && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Lat:{" "}
                                        {customLocation.latitude.toFixed(4)},
                                        Lng:{" "}
                                        {customLocation.longitude.toFixed(4)}
                                      </p>
                                    )}
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
                                  setLocationMode(
                                    locationMode === "map" ? "none" : "map",
                                  )
                                }
                                className="mt-1 w-5 h-5 text-green-600 rounded"
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
                                onLocationSelect={(lat, lng, address) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    latitude: lat,
                                    longitude: lng,
                                    address: useLocationAsAddress
                                      ? address
                                      : prev.address,
                                  }));
                                  setCustomLocation({
                                    address,
                                    latitude: lat,
                                    longitude: lng,
                                  });
                                  setErrors((prev) => {
                                    const { location, ...rest } = prev;
                                    return rest;
                                  });
                                }}
                              />
                            )}
                          </div>
                        </div>
                        {errors.location && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <FaExclamationCircle size={14} /> {errors.location}
                          </p>
                        )}
                        {!errors.location && isLocationSelected && (
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <FaCheckCircle size={14} /> Location selected
                            successfully
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full bg-gradient-to-r ${roleGradientMap[formData.role]} flex items-center justify-center text-sm font-bold text-white`}
                      >
                        3
                      </span>
                      Security & Terms
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <Input
                          label="Password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          error={errors.password}
                          required
                          icon={
                            <FaLock className={roleColorClass[formData.role]} />
                          }
                          helperText="8+ chars, upper & lower case, a number, and a special character"
                        />
                      </div>
                      <Input
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                        required
                        icon={
                          <FaLock className={roleColorClass[formData.role]} />
                        }
                      />
                    </div>
                    <div>
                      <div
                        className={`space-y-4 bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border ${
                          errors.acceptedDisclaimer ||
                          errors.acceptedFoodDisclaimer
                            ? "border-red-400"
                            : formData.acceptedDisclaimer &&
                                (formData.role !== "individual" ||
                                  formData.acceptedFoodDisclaimer)
                              ? "border-green-400"
                              : "border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            name="acceptedDisclaimer"
                            checked={formData.acceptedDisclaimer}
                            onChange={handleChange}
                            className="h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500 mt-0.5"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-50 transition-colors">
                            I agree to the{" "}
                            <Link
                              href="/terms"
                              className={`text-${roleGradientMap[formData.role].split("-")[1]}-600 hover:text-${roleGradientMap[formData.role].split("-")[1]}-700 font-medium`}
                            >
                              Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                              href="/privacy"
                              className={`text-${roleGradientMap[formData.role].split("-")[1]}-600 hover:text-${roleGradientMap[formData.role].split("-")[1]}-700 font-medium`}
                            >
                              Privacy Policy
                            </Link>
                          </span>
                        </label>
                        {formData.role === "individual" && (
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              name="acceptedFoodDisclaimer"
                              checked={formData.acceptedFoodDisclaimer}
                              onChange={handleChange}
                              className="h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500 mt-0.5"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-50 transition-colors">
                              I accept the food safety disclaimer and understand
                              my responsibilities
                            </span>
                          </label>
                        )}
                      </div>
                      {(errors.acceptedDisclaimer ||
                        errors.acceptedFoodDisclaimer) && (
                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                          <FaExclamationCircle size={14} />{" "}
                          {errors.acceptedDisclaimer ||
                            errors.acceptedFoodDisclaimer}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex flex-col md:flex-row justify-between gap-4 pt-4">
                {currentStep > 1 && currentStep < 3 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1"
                  >
                    <FaArrowLeft className="mr-2" /> Previous
                  </Button>
                )}
                {currentStep === 3 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1"
                  >
                    <FaArrowLeft className="mr-2" />
                  </Button>
                )}
                {currentStep < 3 ? (
                  <Button
                    onClick={() => {
                      if (currentStep === 1) {
                        const newErrors = validateStep1();
                        if (Object.keys(newErrors).length > 0) {
                          setErrors(newErrors);
                          toast.error("Please fix the errors before proceeding!");
                          return;
                        }
                        setErrors({});
                        if (!isEmailVerified) {
                          setOtpModal({
                            isOpen: true,
                            type: "email",
                            identifier: formData.email.trim().toLowerCase(),
                          });
                          return;
                        }
                        setCurrentStep(2);
                      } else if (currentStep === 2) {
                        const newErrors = validateStep2();
                        if (Object.keys(newErrors).length > 0) {
                          setErrors(newErrors);
                          toast.error("Please fix the errors before proceeding!");
                          return;
                        }
                        setErrors({});
                        /* Later improved version: Phone SMS OTP Verification
                        if (!isPhoneVerified) {
                          setOtpModal({
                            isOpen: true,
                            type: "phone",
                            identifier: normalizePhone(formData.phone),
                          });
                          return;
                        }
                        */
                        setCurrentStep(3);
                      }
                    }}
                    className={`flex-1 bg-gradient-to-r ${roleGradientMap[formData.role]} hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 text-white`}
                  >
                    {currentStep === 1 && !isEmailVerified
                      ? "Verify Email & Next"
                      /* Later improved version: Phone SMS OTP Verification
                      : currentStep === 2 && !isPhoneVerified
                        ? "Verify Phone & Next"
                      */
                      : "Next Step"}{" "}
                    <FaArrowRight className="ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    fullWidth
                    loading={loading}
                    className={`bg-gradient-to-r ${roleGradientMap[formData.role]} hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 text-white`}
                  >
                    Create Account
                  </Button>
                )}
              </div>
            </form>

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className={`font-medium text-${roleGradientMap[formData.role].split("-")[1]}-600 hover:text-${roleGradientMap[formData.role].split("-")[1]}-700 transition-colors duration-200 inline-flex items-center gap-1 group`}
                >
                  Sign in{" "}
                  <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Role Benefits Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="card backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-pink-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FaUser className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 text-center">
                For Individuals
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                Save money, reduce waste, and enjoy delicious food from local
                restaurants and home cooks
              </p>
            </div>
            <div className="card backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FaBuilding className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 text-center">
                For Restaurants
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                Reduce waste, recover costs, and build community reputation by
                sharing surplus food
              </p>
            </div>
            <div className="card backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FaHeart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 text-center">
                For NGOs
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                Access bulk donations, support communities, and track your
                impact with detailed analytics
              </p>
            </div>
          </motion.div>

          {/* Safety Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-gray-700 rounded-full border border-green-200">
              <FaShieldAlt className="text-green-600" />
              <span className="text-sm text-green-700">
                Food safety is our top priority
              </span>
              <FaCheckCircle className="text-green-600" />
            </div>
          </motion.div>
          {/* OTP Modal */}
          <OtpVerificationModal
            isOpen={otpModal.isOpen}
            type={otpModal.type}
            identifier={otpModal.identifier}
            role={formData.role}
            onClose={() => setOtpModal((prev) => ({ ...prev, isOpen: false }))}
            onVerified={() => {
              if (otpModal.type === "email") {
                setIsEmailVerified(true);
                setCurrentStep(2);
              } else if (otpModal.type === "phone") {
                setIsPhoneVerified(true);
                setCurrentStep(3);
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default function Register() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
