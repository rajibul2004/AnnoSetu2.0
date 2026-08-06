export type UserRole = "individual" | "restaurant" | "ngo" | "admin";
export type Gender = "male" | "female" | "other" | "prefer_not";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type BadgeId =
  | "food_safety_verified"
  | "fssai_verified"
  | "business_license_verified"
  | "ngo_80g_certified"
  | "verified_donor"
  | "identity_verified";

export interface VerificationBadge {
  id: BadgeId;
  title: string;
  description: string;
  icon: string;
  color: string;
  isEarned: boolean;
  earnedAt?: string;
  category: "safety" | "compliance" | "community" | "identity";
}

export interface ProfileDTO {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  language: string;
  notifications: boolean;

  profileImage: string;
  bio: string;
  phone: string | null;
  address: string | null;

  // Custom Dietary & Allergy Preferences
  dietaryPreferences: string[];
  customDietaryPreferences: string[];
  verificationBadges: string[];

  // Verification Documents & Statuses
  foodSafetyDoc?: string | null;
  foodSafetyStatus?: VerificationStatus;

  // Individual specific
  name?: string;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  cookingExpertise?: string | null;
  govtIdDoc?: string | null;
  govtIdStatus?: VerificationStatus;
  customDietaryTags?: string[];

  // Restaurant specific
  restaurantName?: string;
  restaurantType?: string | null;
  fssaiLicense?: string | null;
  fssaiDocument?: string | null;
  fssaiStatus?: VerificationStatus;
  gstNumber?: string | null;
  gstDocument?: string | null;
  gstStatus?: VerificationStatus;
  website?: string | null;
  isVerified?: boolean;

  // NGO specific
  ngoName?: string;
  ngoType?: string | null;
  registrationId?: string | null;
  registrationDoc?: string | null;
  registrationStatus?: VerificationStatus;
  taxExemptionDoc?: string | null;
  taxExemptionStatus?: VerificationStatus;
  establishedYear?: number | null;
}