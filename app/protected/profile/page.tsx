"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaStore,
  FaStar,
  FaEdit,
  FaCamera,
  FaTimesCircle,
  FaSave,
  FaArrowLeft,
  FaBuilding,
  FaIdCard,
  FaBirthdayCake,
  FaVenusMars,
  FaLanguage,
  FaBell,
  FaMoon,
  FaSun,
  FaTrash,
  FaLock,
  FaShieldAlt,
  FaCheck,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useProfile, useUpdateProfile } from "@/hooks/useProfileQueries";
import type { ProfileDTO } from "@/types/profile";

type TabKey = "profile" | "security" | "preferences";

const ROLE_STYLES: Record<
  string,
  { text: string; border: string; icon: string; gradient: string; badgeBg: string }
> = {
  individual: {
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-500 text-pink-600 dark:text-pink-400",
    icon: "text-pink-500",
    gradient: "from-pink-600 via-rose-500 to-amber-500",
    badgeBg: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30",
  },
  restaurant: {
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500 text-blue-600 dark:text-blue-400",
    icon: "text-blue-500",
    gradient: "from-blue-600 via-indigo-600 to-cyan-500",
    badgeBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  },
  ngo: {
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500 text-purple-600 dark:text-purple-400",
    icon: "text-purple-500",
    gradient: "from-purple-600 via-indigo-600 to-pink-500",
    badgeBg: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  },
  admin: {
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500 text-emerald-600 dark:text-emerald-400",
    icon: "text-emerald-500",
    gradient: "from-emerald-600 via-teal-600 to-cyan-500",
    badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
};

const DIETARY_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian", icon: "🥦" },
  { value: "vegan", label: "Vegan", icon: "🌱" },
  { value: "gluten_free", label: "Gluten Free", icon: "🌾" },
  { value: "dairy_free", label: "Dairy Free", icon: "🥛" },
  { value: "halal", label: "Halal", icon: "☪️" },
  { value: "jain", label: "Jain", icon: "🌿" },
  { value: "eggless", label: "Eggless", icon: "🥚" },
  { value: "low_calorie", label: "Low Calorie", icon: "🥗" },
  { value: "high_protein", label: "High Protein", icon: "💪" },
];

interface ProfileFormData {
  phone: string;
  address: string;
  bio: string;
  language: string;
  notifications: boolean;
  name: string;
  dateOfBirth: string;
  gender: string;
  dietaryPreferences: string[];
  cookingExpertise: string;
  restaurantName: string;
  restaurantType: string;
  fssaiLicense: string;
  gstNumber: string;
  ngoName: string;
  ngoType: string;
  registrationId: string;
  establishedYear: string;
  website: string;
}

function toFormState(p: ProfileDTO): ProfileFormData {
  return {
    phone: p.phone ?? "",
    address: p.address ?? "",
    bio: p.bio ?? "",
    language: p.language ?? "english",
    notifications: p.notifications ?? true,
    name: p.name ?? "",
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "",
    gender: p.gender ?? "",
    dietaryPreferences: p.dietaryPreferences ?? [],
    cookingExpertise: p.cookingExpertise ?? "",
    restaurantName: p.restaurantName ?? "",
    restaurantType: p.restaurantType ?? "",
    fssaiLicense: p.fssaiLicense ?? "",
    gstNumber: p.gstNumber ?? "",
    ngoName: p.ngoName ?? "",
    ngoType: p.ngoType ?? "",
    registrationId: p.registrationId ?? "",
    establishedYear: p.establishedYear ? String(p.establishedYear) : "",
    website: p.website ?? "",
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const { profile, isLoading: profileLoading } = useProfile();
  const { updateProfile, isUpdating } = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProfileFormData | null>(null);
  const [originalData, setOriginalData] = useState<ProfileFormData | null>(null);

  useEffect(() => {
    if (profile) {
      const initial = toFormState(profile);
      setFormData(initial);
      setOriginalData(initial);
      setImagePreview(profile.profileImage || null);
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) =>
      prev ? { ...prev, [name]: type === "checkbox" ? checked : value } : prev
    );
  };

  const handleSelectChange =
    (name: keyof ProfileFormData) => (value: string | number | boolean) => {
      setFormData((prev) => (prev ? { ...prev, [name]: String(value) } : prev));
    };

  const toggleDietaryPreference = (value: string) => {
    if (!isEditing) return;
    setFormData((prev) => {
      if (!prev) return prev;
      const exists = prev.dietaryPreferences.includes(value);
      const next = exists
        ? prev.dietaryPreferences.filter((v) => v !== value)
        : [...prev.dietaryPreferences, value];
      return { ...prev, dietaryPreferences: next };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleCancel = () => {
    if (originalData) setFormData(originalData);
    setImagePreview(profile?.profileImage || null);
    setImageFile(null);
    setIsEditing(false);
  };

  const hasChanges =
    Boolean(imageFile) ||
    (formData && originalData && JSON.stringify(formData) !== JSON.stringify(originalData));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !profile) return;

    const payload = new FormData();
    payload.append("language", formData.language);
    payload.append("notifications", String(formData.notifications));
    payload.append("phone", formData.phone);
    payload.append("address", formData.address);
    payload.append("bio", formData.bio);

    if (profile.role === "individual") {
      payload.append("name", formData.name);
      payload.append("dateOfBirth", formData.dateOfBirth);
      payload.append("gender", formData.gender);
      payload.append("cookingExpertise", formData.cookingExpertise);
      payload.append("dietaryPreferences", JSON.stringify(formData.dietaryPreferences));
    } else if (profile.role === "restaurant") {
      payload.append("restaurantName", formData.restaurantName);
      payload.append("restaurantType", formData.restaurantType);
      payload.append("fssaiLicense", formData.fssaiLicense);
      payload.append("gstNumber", formData.gstNumber);
    } else if (profile.role === "ngo") {
      payload.append("ngoName", formData.ngoName);
      payload.append("ngoType", formData.ngoType);
      payload.append("registrationId", formData.registrationId);
      payload.append("establishedYear", formData.establishedYear);
      payload.append("website", formData.website);
    }

    if (imageFile) payload.append("profileImage", imageFile);

    try {
      await updateProfile(payload);
      setOriginalData(formData);
      setImageFile(null);
      setIsEditing(false);
    } catch {
      // useUpdateProfile's onError already toasts the failure
    }
  };

  if (profileLoading || !profile || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <LoadingSpinner text="Loading profile..." />
      </div>
    );
  }

  const styles = ROLE_STYLES[profile.role] ?? ROLE_STYLES.individual;
  const displayName =
    profile.role === "restaurant"
      ? profile.restaurantName || "Restaurant Kitchen"
      : profile.role === "ngo"
      ? profile.ngoName || "NGO Center"
      : profile.name || "Community Member";

  const roleIcon =
    profile.role === "restaurant" ? "🍽️" : profile.role === "ngo" ? "🤝" : "👩‍🍳";

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-20 md:pt-28 md:pb-24 relative z-10">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className={`absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-15 dark:opacity-20 bg-linear-to-tr ${styles.gradient}`}
        />
        <div
          className={`absolute bottom-20 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15 dark:opacity-20 bg-linear-to-bl ${styles.gradient}`}
        />
      </div>

      {/* Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl flex items-center justify-center border border-gray-200/80 dark:border-gray-700/80 hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all cursor-pointer"
            >
              <FaArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-200" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  My Profile
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${styles.badgeBg}`}
                >
                  <span>{roleIcon}</span>
                  <span className="capitalize">{profile.role}</span>
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Manage your credentials, safety badges, and account preferences
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl flex items-center justify-center border border-gray-200/80 dark:border-gray-700/80 hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <FaSun className="w-4 h-4 text-amber-400" />
            ) : (
              <FaMoon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar (Sticky with safe offset & proper z-index) */}
          <div className="lg:col-span-4 sticky top-24 md:top-28 z-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-gray-900/85 backdrop-blur-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-xl"
            >
              {/* Avatar Frame */}
              <div className="relative mb-6 mx-auto w-32 h-32">
                <div
                  className={`w-32 h-32 rounded-3xl bg-linear-to-tr ${styles.gradient} p-1 shadow-lg`}
                >
                  <div className="w-full h-full rounded-[22px] overflow-hidden bg-white dark:bg-gray-950 flex items-center justify-center">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagePreview}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <FaUser className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="absolute -bottom-2 right-0 flex gap-1.5 z-30">
                    <label className="w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-110">
                      <FaCamera className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {imagePreview && (
                      <button
                        onClick={removeImage}
                        type="button"
                        className="w-8 h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                      >
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Identity & Status */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                  {displayName}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center gap-1">
                  <FaEnvelope className="w-3 h-3" />
                  <span>{profile.email}</span>
                </p>
              </div>

              {/* Status Pill Badge */}
              <div className="mb-6 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-center">
                <div className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-1.5">
                  <FaShieldAlt className="text-emerald-500" />
                  <span>Verified Community Member</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Member since{" "}
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Action Button */}
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl py-3.5 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FaEdit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl py-3 font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FaTimesCircle className="w-4 h-4" />
                  <span>Cancel Editing</span>
                </button>
              )}
            </motion.div>
          </div>

          {/* Right Main Content Card */}
          <div className="lg:col-span-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-gray-900/85 backdrop-blur-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-xl"
            >
              {/* Tab Navigation Pill Bar */}
              <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl gap-1 mb-8">
                {(["profile", "security", "preferences"] as TabKey[]).map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      }`}
                    >
                      {tab === "profile" && "👤 Profile Info"}
                      {tab === "security" && "🔒 Security"}
                      {tab === "preferences" && "⚙️ Preferences"}
                    </button>
                  );
                })}
              </div>

              {/* Tab Panels */}
              <AnimatePresence mode="wait">
                {activeTab === "profile" && (
                  <form onSubmit={handleSubmit} key="profile-tab">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">
                          Account Information
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Keep your listing and contact details up to date
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {profile.role === "individual" && (
                          <Input
                            label="Full Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={!isEditing}
                            icon={<FaUser className={styles.icon} />}
                            required
                          />
                        )}

                        {profile.role === "restaurant" && (
                          <>
                            <Input
                              label="Restaurant Name"
                              name="restaurantName"
                              value={formData.restaurantName}
                              onChange={handleChange}
                              disabled={!isEditing}
                              icon={<FaStore className="text-blue-400" />}
                            />
                            <Input
                              label="Kitchen / Cuisine Type"
                              name="restaurantType"
                              value={formData.restaurantType}
                              onChange={handleChange}
                              disabled={!isEditing}
                              icon={<FaStore className="text-blue-400" />}
                              placeholder="e.g., North Indian, Bakery, Continental"
                            />
                          </>
                        )}

                        {profile.role === "ngo" && (
                          <Input
                            label="NGO Organization Name"
                            name="ngoName"
                            value={formData.ngoName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            icon={<FaBuilding className="text-purple-400" />}
                          />
                        )}

                        <Input
                          label="Email Address"
                          name="email"
                          type="email"
                          value={profile.email}
                          disabled
                          icon={<FaEnvelope className={styles.icon} />}
                        />

                        <Input
                          label="Phone Number"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={!isEditing}
                          icon={<FaPhone className={styles.icon} />}
                        />

                        {profile.role === "individual" && (
                          <>
                            <Input
                              label="Date of Birth"
                              name="dateOfBirth"
                              type="date"
                              value={formData.dateOfBirth}
                              onChange={handleChange}
                              disabled={!isEditing}
                              icon={<FaBirthdayCake className={styles.icon} />}
                            />
                            <Select
                              label="Gender"
                              value={formData.gender}
                              onChange={handleSelectChange("gender")}
                              disabled={!isEditing}
                              options={[
                                { value: "male", label: "Male" },
                                { value: "female", label: "Female" },
                                { value: "other", label: "Other" },
                                { value: "prefer_not", label: "Prefer not to say" },
                              ]}
                              icon={<FaVenusMars className={styles.icon} />}
                            />
                          </>
                        )}

                        {profile.role === "restaurant" && (
                          <>
                            <Input
                              label="FSSAI License ID"
                              name="fssaiLicense"
                              value={formData.fssaiLicense}
                              onChange={handleChange}
                              disabled={!isEditing}
                              icon={<FaIdCard className="text-blue-400" />}
                            />
                            <Input
                              label="GST Number"
                              name="gstNumber"
                              value={formData.gstNumber}
                              onChange={handleChange}
                              disabled={!isEditing}
                              icon={<FaIdCard className="text-blue-400" />}
                            />
                          </>
                        )}

                        {profile.role === "ngo" && (
                          <>
                            <Input
                              label="Registration ID"
                              name="registrationId"
                              value={formData.registrationId}
                              onChange={handleChange}
                              disabled={!isEditing}
                              icon={<FaIdCard className="text-purple-400" />}
                            />
                            <Input
                              label="Established Year"
                              name="establishedYear"
                              type="number"
                              value={formData.establishedYear}
                              onChange={handleChange}
                              disabled={!isEditing}
                              icon={<FaBirthdayCake className="text-purple-400" />}
                            />
                            <Select
                              label="NGO Activity Domain"
                              value={formData.ngoType}
                              onChange={handleSelectChange("ngoType")}
                              disabled={!isEditing}
                              options={[
                                { value: "food", label: "Food Bank / Meal Distribution" },
                                { value: "children", label: "Children Welfare" },
                                { value: "homeless", label: "Homeless Support" },
                                { value: "other", label: "Other Community Services" },
                              ]}
                              icon={<FaBuilding className="text-purple-400" />}
                            />
                            <div className="md:col-span-2">
                              <Input
                                label="Official Website"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                disabled={!isEditing}
                                icon={<FaBuilding className="text-purple-400" />}
                              />
                            </div>
                          </>
                        )}

                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Bio & Community Mission
                          </label>
                          <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            disabled={!isEditing}
                            rows={3}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 resize-none text-sm transition-all"
                            placeholder="Share a brief introduction with your fellow food heroes..."
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Input
                            label="Default Pickup / Kitchen Address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            disabled={!isEditing}
                            icon={<FaMapMarkerAlt className={styles.icon} />}
                          />
                        </div>
                      </div>

                      {/* Individual Cooking Preferences */}
                      {profile.role === "individual" && (
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                          <h3 className="text-base font-black text-gray-900 dark:text-white mb-4">
                            Culinary & Dietary Preferences
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                              label="Cooking Expertise"
                              value={formData.cookingExpertise}
                              onChange={handleSelectChange("cookingExpertise")}
                              disabled={!isEditing}
                              options={[
                                { value: "beginner", label: "Beginner Home Cook" },
                                { value: "intermediate", label: "Intermediate Foodie" },
                                { value: "advanced", label: "Advanced Culinary Enthusiast" },
                                { value: "professional", label: "Professional Chef" },
                              ]}
                              icon={<FaStar className="text-amber-400" />}
                            />

                            <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                                Dietary Tags & Specialties
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {DIETARY_OPTIONS.map((opt) => {
                                  const isSelected = formData.dietaryPreferences.includes(
                                    opt.value
                                  );
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => toggleDietaryPreference(opt.value)}
                                      disabled={!isEditing}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                        isSelected
                                          ? "bg-emerald-600 text-white shadow-sm"
                                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                      } ${!isEditing ? "cursor-default opacity-80" : "cursor-pointer"}`}
                                    >
                                      <span>{opt.icon}</span>
                                      <span>{opt.label}</span>
                                      {isSelected && <FaCheck className="w-2.5 h-2.5 ml-0.5" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Save Bar */}
                      {isEditing && (
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancel}
                            disabled={isUpdating}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            loading={isUpdating}
                            disabled={!hasChanges || isUpdating}
                          >
                            <span className="flex items-center gap-2">
                              <FaSave />
                              <span>Save Changes</span>
                            </span>
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  </form>
                )}

                {activeTab === "security" && (
                  <motion.div
                    key="security-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">
                        Security & Credentials
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Manage your password and authentication safeguards
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                            <FaLock className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                              Account Password
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Keep your password updated with strong symbols
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toast("Password reset link will be sent to your email!")}
                        >
                          Change
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 opacity-70">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                            <FaShieldAlt className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                              Two-Factor Authentication (2FA)
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              SMS / Authenticator app verification
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-gray-400">Coming Soon</span>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                      <h4 className="text-base font-black text-rose-600 dark:text-rose-400 mb-3">
                        Danger Zone
                      </h4>
                      <div className="flex items-center justify-between p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 bg-rose-500/15 text-rose-600 rounded-xl flex items-center justify-center">
                            <FaTrash className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-100">
                              Delete Account
                            </h4>
                            <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">
                              Permanently remove all profile listings and reservation data
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => toast.error("Account deletion is restricted.")}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "preferences" && (
                  <motion.div
                    key="preferences-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">
                        Application Preferences
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Customize appearance and real-time alerts
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 bg-amber-500/15 text-amber-500 rounded-xl flex items-center justify-center">
                            {isDark ? <FaMoon className="w-4 h-4" /> : <FaSun className="w-4 h-4" />}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                              Theme Display
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Switch between light and dark visual modes
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setTheme(isDark ? "light" : "dark")}
                        >
                          {isDark ? "Switch to Light" : "Switch to Dark"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 bg-blue-500/15 text-blue-500 rounded-xl flex items-center justify-center">
                            <FaLanguage className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                              Language
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Choose your default application language
                            </p>
                          </div>
                        </div>
                        <select
                          name="language"
                          value={formData.language}
                          onChange={handleChange}
                          className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="english">English</option>
                          <option value="bengali">বাংলা (Bengali)</option>
                          <option value="hindi">हिन्दी (Hindi)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 bg-purple-500/15 text-purple-500 rounded-xl flex items-center justify-center">
                            <FaBell className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                              Live Notifications
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Instant push alerts for pickups, claim requests, and food drops
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="notifications"
                            checked={formData.notifications}
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              setFormData((prev) =>
                                prev ? { ...prev, notifications: checked } : prev
                              );
                              const payload = new FormData();
                              payload.append("notifications", String(checked));
                              try {
                                await updateProfile(payload);
                              } catch {
                                setFormData((prev) =>
                                  prev ? { ...prev, notifications: !checked } : prev
                                );
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white dark:after:bg-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}