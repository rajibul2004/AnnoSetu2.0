"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
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
  FaUtensils,
  FaCertificate,
  FaCheckCircle,
  FaBoxOpen,
  FaLeaf,
  FaMedal,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import VerificationBadgesShelf from "@/components/profile/VerificationBadgesShelf";
import DocumentVerificationSection from "@/components/profile/DocumentVerificationSection";
import CustomDietaryTagManager from "@/components/profile/CustomDietaryTagManager";
import StreakWidget from "@/components/gamification/StreakWidget";
import LevelProgressBar from "@/components/gamification/LevelProgressBar";
import { useProfile, useUpdateProfile } from "@/hooks/useProfileQueries";
import { usePublicProfile } from "@/hooks/useSocial";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import type { ProfileDTO, BadgeId } from "@/types/profile";

type TabKey = "profile" | "verification" | "dietary" | "security" | "preferences";

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
  customDietaryPreferences: string[];
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
    customDietaryPreferences: p.customDietaryPreferences ?? p.customDietaryTags ?? [],
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
  const { data: publicProfile } = usePublicProfile(profile?.id || "");
  const { updateProfile, isUpdating } = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pendingDocFiles, setPendingDocFiles] = useState<Record<string, File | null>>({});

  const [formData, setFormData] = useState<ProfileFormData | null>(null);
  const [originalData, setOriginalData] = useState<ProfileFormData | null>(null);

  // Cropper State
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCropSrc(reader.result?.toString() || "");
      setIsCropModalOpen(true);
    });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const saveCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(cropSrc!, croppedAreaPixels);
      if (croppedImage) {
        setImageFile(croppedImage);
        setImagePreview(URL.createObjectURL(croppedImage));
        setIsCropModalOpen(false);
      }
    } catch (e) {
      toast.error("Failed to crop image");
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleCancel = () => {
    if (originalData) setFormData(originalData);
    setImagePreview(profile?.profileImage || null);
    setImageFile(null);
    setPendingDocFiles({});
    setIsEditing(false);
  };

  const handleDocumentChange = async (
    key: string,
    file: File | null,
    instantVerify?: boolean
  ) => {
    if (!profile) return;
    const payload = new FormData();

    if (file) {
      payload.append(key, file);
    }

    if (instantVerify) {
      // Map key to status key
      const statusKey =
        key === "fssaiDocument"
          ? "fssaiStatus"
          : key === "gstDocument"
          ? "gstStatus"
          : key === "registrationDoc"
          ? "registrationStatus"
          : key === "taxExemptionDoc"
          ? "taxExemptionStatus"
          : key === "govtIdDoc"
          ? "govtIdStatus"
          : "foodSafetyStatus";

      payload.append(statusKey, "verified");
    }

    try {
      await updateProfile(payload);
      toast.success(
        instantVerify
          ? "Document verified successfully!"
          : "Document uploaded and submitted for review!"
      );
    } catch {
      // Error toasted by mutation
    }
  };

  const handleDietaryChange = async (selected: string[], custom: string[]) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            dietaryPreferences: selected,
            customDietaryPreferences: custom,
          }
        : prev
    );

    const payload = new FormData();
    payload.append("dietaryPreferences", JSON.stringify(selected));
    payload.append("customDietaryPreferences", JSON.stringify(custom));

    try {
      await updateProfile(payload);
      toast.success("Dietary preferences updated!");
    } catch {
      // Error toasted by mutation
    }
  };

  const hasChanges =
    Boolean(imageFile) ||
    Object.keys(pendingDocFiles).length > 0 ||
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
    payload.append("dietaryPreferences", JSON.stringify(formData.dietaryPreferences));
    payload.append("customDietaryPreferences", JSON.stringify(formData.customDietaryPreferences));

    if (profile.role === "individual") {
      payload.append("name", formData.name);
      payload.append("dateOfBirth", formData.dateOfBirth);
      payload.append("gender", formData.gender);
      payload.append("cookingExpertise", formData.cookingExpertise);
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

    if (imageFile) {
      payload.append("profileImage", imageFile);
    } else if (imagePreview === null && profile.profileImage) {
      payload.append("removeProfileImage", "true");
    }

    // Append any document files
    Object.entries(pendingDocFiles).forEach(([key, file]) => {
      if (file) payload.append(key, file);
    });

    try {
      await updateProfile(payload);
      setOriginalData(formData);
      setImageFile(null);
      setPendingDocFiles({});
      setIsEditing(false);
      toast.success("Profile saved successfully!");
    } catch {
      // useUpdateProfile's onError already toasts the failure
    }
  };

  if (profileLoading || !profile || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <LoadingSpinner text="Loading profile and credentials..." />
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

  const earnedBadges = profile.verificationBadges ?? [];
  const isFoodSafetyVerified =
    profile.foodSafetyStatus === "verified" || earnedBadges.includes("food_safety_verified");
  const isLicensed =
    profile.fssaiStatus === "verified" ||
    profile.registrationStatus === "verified" ||
    profile.govtIdStatus === "verified";

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-20 md:pt-28 md:pb-24 relative z-10">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className={`absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-15 dark:opacity-20 bg-gradient-to-tr ${styles.gradient}`}
        />
        <div
          className={`absolute bottom-20 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15 dark:opacity-20 bg-gradient-to-bl ${styles.gradient}`}
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
                {isFoodSafetyVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <FaShieldAlt className="text-[10px]" /> Food Safety Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Manage your credentials, safety badges, dietary tags, and account preferences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Action Button */}
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="hidden sm:flex bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl px-4 py-2 font-bold shadow-sm transition-all items-center gap-2 cursor-pointer"
              >
                <FaEdit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancel}
                className="hidden sm:flex bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl px-4 py-2 font-semibold transition-all items-center gap-2 cursor-pointer"
              >
                <FaTimesCircle className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            )}

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
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- INJECTED PUBLIC PROFILE PREVIEW --- */}
        {publicProfile && (
          <div className="mb-10 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r ${styles.gradient} p-6 sm:p-8 md:p-10 shadow-2xl border border-white/10`}
            >
              {/* Subtle Ambient Light Gradients */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-white/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
                {/* Avatar (Remains editable on click if isEditing) */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-[2rem] bg-white/20 backdrop-blur-md p-1.5 flex-shrink-0 shadow-lg border border-white/30 rotate-3 hover:rotate-0 transition-transform duration-300 relative">
                  <div className="w-full h-full rounded-[1.75rem] bg-white dark:bg-neutral-900 flex items-center justify-center overflow-hidden relative">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreview} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl sm:text-5xl font-black text-white/50">{displayName.charAt(0)}</span>
                    )}
                  </div>
                  
                  {isEditing && (
                    <div className="absolute -bottom-2 right-0 flex gap-1.5 z-30">
                      <label className="w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-110">
                        <FaCamera className="w-3.5 h-3.5" />
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      {imagePreview && (
                        <button onClick={removeImage} type="button" className="w-8 h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer">
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left space-y-4 w-full">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 justify-between w-full">
                    <div>
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-sm">
                        {displayName}
                      </h1>
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-semibold text-white uppercase tracking-wider mt-2 border border-white/20">
                        <FaShieldAlt className="w-3 h-3 text-teal-200" />
                        <span>{profile.role === 'restaurant' ? 'Restaurant Partner' : 'Individual Partner'}</span>
                      </div>
                    </div>
                    
                    {/* View Public Profile Link */}
                    <Link
                      href={`/protected/profile/${profile.id}`}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-black transition-all duration-300 shadow-xl border bg-white/20 text-white hover:bg-white/30 border-white/30 backdrop-blur-md"
                    >
                      <FaUser className="w-4 h-4" /> Preview Public Profile
                    </Link>
                  </div>

                  {profile.bio && (
                    <p className="text-white/90 max-w-2xl text-sm sm:text-base leading-relaxed mx-auto md:mx-0 font-medium">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center md:justify-start pt-2">
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-xl sm:text-2xl font-black drop-shadow-md">{publicProfile.followersCount}</span>
                      <span className="text-white/80 text-xs font-bold uppercase tracking-wider">Followers</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-xl sm:text-2xl font-black drop-shadow-md">{publicProfile.followingCount}</span>
                      <span className="text-white/80 text-xs font-bold uppercase tracking-wider">Following</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Unified Compact Metrics Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-6"
            >
              <div className="bg-emerald-50 dark:bg-emerald-900/20 backdrop-blur-md rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/30 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider flex justify-between items-center">
                  Total Impact <FaLeaf className="text-emerald-500 w-3 h-3" />
                </span>
                <div className="text-2xl font-black mt-2 text-gray-900 dark:text-white drop-shadow-sm truncate">
                  {(publicProfile.mealsRescued + publicProfile.mealsShared).toLocaleString()} <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">Meals</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-gray-200/60 dark:border-white/5 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider flex justify-between items-center">
                  CO₂ Saved <FaShieldAlt className="text-gray-400 w-3 h-3" />
                </span>
                <div className="text-2xl font-black mt-2 text-gray-900 dark:text-white drop-shadow-sm truncate">
                  {publicProfile.carbonSaved.toFixed(1)} <span className="text-xs font-semibold text-gray-500">kg</span>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 backdrop-blur-md rounded-2xl p-4 border border-amber-100 dark:border-amber-800/30 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider flex justify-between items-center">
                  Impact Points <FaStar className="text-amber-500 w-3 h-3" />
                </span>
                <div className="text-2xl font-black mt-2 text-gray-900 dark:text-white drop-shadow-sm truncate">
                  {publicProfile.points.toLocaleString()}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 backdrop-blur-md rounded-2xl p-4 border border-purple-100 dark:border-purple-800/30 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] sm:text-xs text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider flex justify-between items-center">
                  Badges <FaMedal className="text-purple-500 w-3 h-3" />
                </span>
                <div className="text-2xl font-black mt-2 text-gray-900 dark:text-white drop-shadow-sm truncate">
                  {publicProfile.badges.length}
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 backdrop-blur-md rounded-2xl p-4 border border-blue-100 dark:border-blue-800/30 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider flex justify-between items-center">
                  Meals Rescued <FaBoxOpen className="text-blue-500 w-3 h-3" />
                </span>
                <div className="text-2xl font-black mt-2 text-gray-900 dark:text-white drop-shadow-sm truncate">
                  {publicProfile.mealsRescued.toLocaleString()}
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 backdrop-blur-md rounded-2xl p-4 border border-orange-100 dark:border-orange-800/30 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] sm:text-xs text-orange-700 dark:text-orange-400 font-bold uppercase tracking-wider flex justify-between items-center">
                  Meals Shared <FaUtensils className="text-orange-500 w-3 h-3" />
                </span>
                <div className="text-2xl font-black mt-2 text-gray-900 dark:text-white drop-shadow-sm truncate">
                  {publicProfile.mealsShared.toLocaleString()}
                </div>
              </div>
            </motion.div>

            {/* Level Progress Bar & Streak Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <LevelProgressBar points={publicProfile.points} />
              </div>
              <div className="lg:col-span-1">
                <StreakWidget currentStreak={publicProfile.currentStreak} longestStreak={publicProfile.longestStreak} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-gray-900/85 backdrop-blur-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-xl"
            >
              {/* Tab Navigation Pill Bar */}
              <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl gap-1 mb-8 overflow-x-auto custom-scrollbar">
                {(
                  [
                    { key: "profile", label: "👤 Profile Info" },
                    { key: "verification", label: "🛡️ Verification & Badges" },
                    { key: "dietary", label: "🥦 Dietary & Tags" },
                    { key: "security", label: "🔒 Security" },
                    { key: "preferences", label: "⚙️ Preferences" },
                  ] as { key: TabKey; label: string }[]
                ).map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Panels */}
              <AnimatePresence mode="wait">
                {/* 1. Profile Info Tab */}
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
                          Keep your contact credentials and public info accurate
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
                            Culinary Experience
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

                {/* 2. Verification & Badges Tab */}
                {activeTab === "verification" && (
                  <motion.div
                    key="verification-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    {/* Verification Badges Showcase */}
                    <VerificationBadgesShelf
                      userRole={profile.role}
                      earnedBadgeIds={profile.verificationBadges ?? []}
                      onOpenVerificationModal={(badgeId) => {
                        const target = document.getElementById("document-verification-box");
                        if (target) target.scrollIntoView({ behavior: "smooth" });
                      }}
                    />

                    {/* Document Uploads & Verification Center */}
                    <div id="document-verification-box">
                      <DocumentVerificationSection
                        userRole={profile.role}
                        profileData={profile}
                        onDocumentChange={handleDocumentChange}
                        isSaving={isUpdating}
                      />
                    </div>
                  </motion.div>
                )}

                {/* 3. Custom Dietary Preferences & Tags Tab */}
                {activeTab === "dietary" && (
                  <motion.div
                    key="dietary-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <CustomDietaryTagManager
                      selectedTags={formData.dietaryPreferences}
                      customTags={formData.customDietaryPreferences}
                      onChange={handleDietaryChange}
                    />
                  </motion.div>
                )}

                {/* 4. Security Tab */}
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
                        Security & Safeguards
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

                {/* 5. Application Preferences Tab */}
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

      {/* Crop Modal */}
      <AnimatePresence>
        {isCropModalOpen && cropSrc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg"
            >
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Adjust Profile Picture</h3>
                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <FaTimesCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="relative w-full h-[400px] bg-gray-900">
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-xs font-bold text-gray-500">Zoom</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCropModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveCroppedImage}
                    className="flex-1 px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FaCheckCircle className="w-4 h-4" /> Save Crop
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}