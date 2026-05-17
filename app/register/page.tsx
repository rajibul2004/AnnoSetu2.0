"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState,useEffect,useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FaUser,
  FaBuilding,
  FaEnvelope,
  FaCheckCircle,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import Input from "@/components/common/Input";
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
export default function RegisterPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const searchParams = useSearchParams();
  //   const { data: session } = useSession();

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
  const [currentStep, setCurrentStep] = useState(2);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [locationMode, setLocationMode] = useState<"none" | "current" | "map">("none")
  const [customLocation, setCustomLocation] = useState<CustomLocation>({
    address: "",
    latitude: 0,
    longitude: 0,
  })
  const [useLocationAsAddress, setUseLocationAsAddress] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear field error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, location: "Geolocation not supported" }))
      return
    }
    setLocationLoading(true)
    setErrors((prev) => {
      const { location, ...rest } = prev
      return rest
    })

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "en" } }
          )
          const data = await res.json()
          const resolved = {
            address: data.display_name || "Current Location",
            latitude,
            longitude,
          }
          setCustomLocation(resolved)
          setFormData((prev) => ({
            ...prev,
            latitude: resolved.latitude,
            longitude: resolved.longitude,
            ...(useLocationAsAddress ? { address: resolved.address } : {}),
          }))
          setErrors((prev) => {
            const { location, ...rest } = prev
            return rest
          })
        } catch {
          const fallback = { address: "Current Location", latitude, longitude }
          setCustomLocation(fallback)
          setFormData((prev) => ({ ...prev, latitude: fallback.latitude, longitude: fallback.longitude }))
          setErrors((prev) => ({ ...prev, location: "Address lookup failed, but coordinates captured" }))
        } finally {
          setLocationLoading(false)
        }
      },
      () => {
        setErrors((prev) => ({ ...prev, location: "Please allow location access" }))
        setLocationLoading(false)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [useLocationAsAddress])

  useEffect(() => {
    if (locationMode === "current") getCurrentLocation()
    if (locationMode === "none") {
      setCustomLocation({ address: "", latitude: 0, longitude: 0 })
      setFormData((prev) => ({
        ...prev,
        latitude: null,
        longitude: null,
        ...(useLocationAsAddress ? { address: "" } : {}),
        }))
      setErrors((prev) => {
        const { location, ...rest } = prev
        return rest
      })
    }
  }, [locationMode, getCurrentLocation, useLocationAsAddress])

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
      setFormData((prev) => ({ ...prev, address: customLocation.address }))
    } else if (!useLocationAsAddress && locationMode === "none") {
      setFormData((prev) => ({ ...prev, address: "" }))
    }
  }, [useLocationAsAddress, customLocation.address, locationMode])

  const isLocationSelected = formData.latitude !== null && formData.longitude !== null

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
  return (
    <div className="min-h-screen py-12 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
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
                        placeholder="+91 98765 43210"
                      />
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
                                  We'll use your device's GPS to set the pickup
                                  location
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
              </AnimatePresence>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
