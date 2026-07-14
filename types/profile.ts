export type UserRole = "individual" | "restaurant" | "ngo" | "admin";
export type Gender = "male" | "female" | "other" | "prefer_not";
 
export interface ProfileDTO {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  language: string;
  // Real field on User in the schema — unlike twoFactorAuth, which has
  // no backing column at all and stays a stub in the UI.
  notifications: boolean;
 
  profileImage: string;
  bio: string;
  phone: string | null;
  address: string | null;
 
  // Individual
  name?: string;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  cookingExpertise?: string | null;
  dietaryPreferences?: string[];
 
  // Restaurant
  restaurantName?: string;
  restaurantType?: string | null;
  fssaiLicense?: string | null;
  gstNumber?: string | null;
  website?: string | null;
 
  // NGO
  ngoName?: string;
  ngoType?: string | null;
  registrationId?: string | null;
  establishedYear?: number | null;
}
 