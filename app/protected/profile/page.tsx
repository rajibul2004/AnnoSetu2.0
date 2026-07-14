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

// Static lookup instead of `text-${roleColor}-600` etc. — Tailwind can't
// detect dynamically-built class names at build time, so those never
// actually generated any CSS in the original.
const ROLE_STYLES: Record<string, { text: string; border: string; icon: string; gradient: string }> = {
  individual: {
    text: "text-pink-600 dark:text-pink-300",
    border: "border-pink-600 text-pink-600",
    icon: "text-pink-400",
    gradient: "from-pink-700 via-pink-500 to-pink-400",
  },
  restaurant: {
    text: "text-blue-600 dark:text-blue-300",
    border: "border-blue-600 text-blue-600",
    icon: "text-blue-400",
    gradient: "from-blue-700 via-blue-500 to-blue-400",
  },
  ngo: {
    text: "text-purple-600 dark:text-purple-300",
    border: "border-purple-600 text-purple-600",
    icon: "text-purple-400",
    gradient: "from-purple-700 via-purple-500 to-purple-400",
  },
  admin: {
    text: "text-gray-600 dark:text-gray-300",
    border: "border-gray-600 text-gray-600",
    icon: "text-gray-400",
    gradient: "from-gray-700 via-gray-500 to-gray-400",
  },
};

// Matches the schema's FoodTag enum keys exactly — the original offered
// "gluten-free"/"dairy-free"/"keto", none of which are valid Prisma
// enum values ("keto" isn't in the enum at all).
const DIETARY_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten_free", label: "Gluten Free" },
  { value: "dairy_free", label: "Dairy Free" },
  { value: "halal", label: "Halal" },
  { value: "jain", label: "Jain" },
  { value: "eggless", label: "Eggless" },
  { value: "low_calorie", label: "Low Calorie" },
  { value: "high_protein", label: "High Protein" },
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

  // Fixed: handle all input types including select
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) =>
      prev ? { ...prev, [name]: type === "checkbox" ? checked : value } : prev
    );
  };

  // The custom <Select> component calls onChange with just the selected
  // value (see Select.tsx), not a native ChangeEvent.
  const handleSelectChange = (name: keyof ProfileFormData) => (value: string | number | boolean) => {
    setFormData((prev) => (prev ? { ...prev, [name]: String(value) } : prev));
  };

  const handleDietaryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, (o) => o.value);
    setFormData((prev) => (prev ? { ...prev, dietaryPreferences: values } : prev));
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

  // The original had this guard entirely commented out, so
  // roleOptions[user?.role].name would throw before the profile loaded.
  if (profileLoading || !profile || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading profile..." />
      </div>
    );
  }

  const styles = ROLE_STYLES[profile.role] ?? ROLE_STYLES.individual;
  const displayName =
    profile.role === "restaurant"
      ? profile.restaurantName
      : profile.role === "ngo"
        ? profile.ngoName
        : profile.name;
  const roleIcon = profile.role === "restaurant" ? "🏪" : profile.role === "ngo" ? "🏥" : "👤";

  // The original's stats grid was completely dead code (a .map() callback
  // with no return statement) — these display the same placeholder
  // values the original intended, but actually render. Real numbers
  // would need a dedicated aggregate query (completed reservations,
  // listings shared, reviews received) which wasn't wired up in the
  // original either.
  const stats = [
    { key: "Meals Saved", value: 0 },
    { key: "Meals Shared", value: 0 },
    { key: "Reviews", value: 0 },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="text-gray-900 dark:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
                <p className="dark:text-white/80 text-gray-900/80 mt-1">
                  Manage your account settings
                </p>
              </div>
            </div>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-10 h-10 dark:bg-white/20 bg-gray-900/20 backdrop-blur-sm rounded-xl flex items-center justify-center dark:hover:bg-white/30 hover:bg-gray-900/30 transition-colors"
            >
              {isDark ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 sticky top-4">
              <div className="relative mb-6 group">
                <div className={`w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br ${styles.gradient} p-1`}>
                  <div className="w-full h-full rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreview} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                        <FaUser className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="absolute -bottom-2 right-1/2 translate-x-12 flex gap-2">
                    <label className="w-8 h-8 bg-gradient-to-r from-green-500 to-amber-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                      <FaCamera className="w-4 h-4 text-white" />
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    {imagePreview && (
                      <button
                        onClick={removeImage}
                        type="button"
                        className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                      >
                        <FaTrash className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
                <p className={`${styles.text} font-medium mt-1 capitalize flex items-center justify-center gap-1`}>
                  <span>{roleIcon}</span>
                  <span>{profile.role}</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                {stats.map((stat) => (
                  <div key={stat.key} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{stat.key}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Member since{" "}
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl py-3 font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FaEdit className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </motion.div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card overflow-hidden">
              <div className="border-b border-gray-400">
                <nav className="flex space-x-8 justify-center md:justify-start">
                  {(["profile", "security", "preferences"] as TabKey[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-3 px-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === tab ? styles.border : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="py-6">
                <AnimatePresence mode="wait">
                  {activeTab === "profile" && (
                    <form onSubmit={handleSubmit}>
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Personal Information
                        </h3>

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
                                label="Restaurant Type"
                                name="restaurantType"
                                value={formData.restaurantType}
                                onChange={handleChange}
                                disabled={!isEditing}
                                icon={<FaStore className="text-blue-400" />}
                                placeholder="e.g., Italian, Fast Food"
                              />
                            </>
                          )}
                          {profile.role === "ngo" && (
                            <Input
                              label="NGO Name"
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
                                  // Prisma's enum key is prefer_not
                                  // (@map("prefer-not") only affects the
                                  // DB column, not the client value).
                                  { value: "prefer_not", label: "Prefer not to say" },
                                ]}
                                icon={<FaVenusMars className={styles.icon} />}
                              />
                            </>
                          )}

                          {profile.role === "restaurant" && (
                            <>
                              <Input
                                label="FSSAI License"
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
                                label="NGO Type"
                                value={formData.ngoType}
                                onChange={handleSelectChange("ngoType")}
                                disabled={!isEditing}
                                options={[
                                  { value: "food", label: "Food Bank" },
                                  { value: "children", label: "Children Welfare" },
                                  { value: "homeless", label: "Homeless Support" },
                                  { value: "other", label: "Other" },
                                ]}
                                icon={<FaBuilding className="text-purple-400" />}
                              />
                              <div className="md:col-span-2">
                                <Input
                                  label="Website"
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                              Bio
                            </label>
                            <textarea
                              name="bio"
                              value={formData.bio}
                              onChange={handleChange}
                              disabled={!isEditing}
                              rows={4}
                              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 dark:disabled:bg-gray-700 resize-none"
                              placeholder="Tell us about yourself..."
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Input
                              label="Address"
                              name="address"
                              value={formData.address}
                              onChange={handleChange}
                              disabled={!isEditing}
                              icon={<FaMapMarkerAlt className={styles.icon} />}
                            />
                          </div>
                        </div>

                        {profile.role === "individual" && (
                          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Cooking Preferences
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Select
                                label="Cooking Expertise"
                                value={formData.cookingExpertise}
                                onChange={handleSelectChange("cookingExpertise")}
                                disabled={!isEditing}
                                options={[
                                  { value: "beginner", label: "Beginner" },
                                  { value: "intermediate", label: "Intermediate" },
                                  { value: "advanced", label: "Advanced" },
                                  { value: "professional", label: "Professional" },
                                ]}
                                icon={<FaStar className="text-pink-400" />}
                              />
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                  Dietary Preferences
                                </label>
                                <select
                                  name="dietaryPreferences"
                                  value={formData.dietaryPreferences}
                                  onChange={handleDietaryChange}
                                  disabled={!isEditing}
                                  multiple
                                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 dark:disabled:bg-gray-700 h-32"
                                >
                                  {DIETARY_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Hold Ctrl/Cmd to select multiple
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>

                      {isEditing && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
                        >
                          <Button type="button" variant="outline" onClick={handleCancel}>
                            <FaTimesCircle className="mr-2" />
                            Cancel
                          </Button>
                          <Button type="submit" variant="primary" loading={isUpdating} disabled={!hasChanges || isUpdating}>
                            <FaSave className="mr-2" />
                            Save Changes
                          </Button>
                        </motion.div>
                      )}
                    </form>
                  )}

                  {activeTab === "security" && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-2 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                              <FaLock className="w-5 h-5 text-green-600 dark:text-green-300" />
                            </div>
                            <div className="pr-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">Change Password</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-300">
                                Update your password regularly
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => toast("Password change coming soon!")}>
                            Update
                          </Button>
                        </div>

                        {/*
                          Two-factor auth has no backing field anywhere in
                          the schema, so unlike the notifications toggle
                          below, this stays an honest stub rather than
                          wiring a checkbox to nothing.
                        */}
                        <div className="flex items-center justify-between p-2 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl opacity-60">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                              <FaLock className="w-5 h-5 text-green-600 dark:text-green-300" />
                            </div>
                            <div className="pr-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                Two-Factor Authentication
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-300">Coming soon</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">Not available yet</span>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h4>
                        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-700">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-lg flex items-center justify-center">
                              <FaTrash className="w-5 h-5 text-red-600 dark:text-red-300" />
                            </div>
                            <div>
                              <h4 className="font-medium text-red-900 dark:text-red-50">Delete Account</h4>
                              <p className="text-sm text-red-600 dark:text-red-300">
                                Permanently remove your account
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => toast.error("Account deletion not available yet")}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "preferences" && (
                    <motion.div
                      key="preferences"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">App Preferences</h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-2 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-800 rounded-lg flex items-center justify-center">
                              {isDark ? (
                                <FaMoon className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
                              ) : (
                                <FaSun className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">Dark Mode</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-300">
                                Switch between light and dark themes
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setTheme(isDark ? "light" : "dark")}>
                            Switch
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-2 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                              <FaLanguage className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">Language</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Choose your preferred language
                              </p>
                            </div>
                          </div>
                          <select
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                            className="px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="english">English</option>
                            <option value="bengali">Bengali</option>
                            <option value="hindi">Hindi</option>
                          </select>
                        </div>

                        {/*
                          Unlike twoFactorAuth (no schema field at all),
                          `notifications` is a real Boolean column on
                          User — so this toggle is wired to actually
                          persist, saving immediately on change rather
                          than waiting for the Profile tab's Save button.
                        */}
                        <div className="flex items-center justify-between p-2 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                              <FaBell className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                            </div>
                            <div className="pr-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">Notifications</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-300">
                                Receive updates about your activity
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
                                setFormData((prev) => (prev ? { ...prev, notifications: checked } : prev));
                                const payload = new FormData();
                                payload.append("notifications", String(checked));
                                try {
                                  await updateProfile(payload);
                                } catch {
                                  setFormData((prev) => (prev ? { ...prev, notifications: !checked } : prev));
                                }
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white dark:after:bg-gray-600 after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 dark:peer-checked:bg-green-300"></div>
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}