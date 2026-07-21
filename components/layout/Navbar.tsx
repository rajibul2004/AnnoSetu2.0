"use client";
 
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";
// import NotificationBell from "@/components/common/NotificationBell"; // old placeholder
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import {
  FaBars,
  FaTimes,
  FaUser,
  FaUtensils,
  FaHome,
  FaSignInAlt,
  FaUserPlus,
  FaSignOutAlt,
  FaUserCircle,
  FaBell,
} from "react-icons/fa";
 
export default function Navbar() {
  const { user, isRestaurant, isIndividual, isNGO, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
 
  const getDashboardLink = (): string => {
    if (isRestaurant) return "/protected/dashboard?role=restaurant";
    if (isIndividual) return "/protected/dashboard?role=individual";
    if (isNGO) return "/protected/dashboard?role=ngo";
    return "/protected/dashboard";
  };
 
  const getAddFoodLink = (): string | null => {
    if (isRestaurant) return "/protected/add-food?role=restaurant";
    if (isIndividual) return "/protected/add-food?role=individual";
    return null;
  };
 
  const getRoleColor = (): string => {
    if (isRestaurant) return "from-blue-500 to-blue-600";
    if (isIndividual) return "from-pink-500 to-pink-600";
    if (isNGO) return "from-purple-500 to-purple-600";
    return "from-primary-500 to-secondary-500";
  };
 
  const getRoleBadgeColor = (): string => {
    if (isRestaurant) return "bg-blue-100 text-blue-800 border-blue-200";
    if (isIndividual) return "bg-pink-100 text-pink-800 border-pink-200";
    if (isNGO) return "bg-purple-100 text-purple-800 border-purple-200";
    return "bg-primary-100 text-primary-800 border-primary-200";
  };
 
  // `user.name` already holds the correct display name (restaurant name,
  // NGO name, or individual name) — auth.config.ts resolves that once at
  // sign-in time, so there's no need to re-derive it here per role.
  const displayName = user?.name ?? user?.email ?? "";
  const addFoodLink = getAddFoodLink();
 
  return (
    <nav className="transition-all duration-300 relative z-[9999]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-15 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full">
              <Image
                src="/logo.png"
                alt="AnnaSetu"
                width={56}
                height={56}
                className="w-full h-full object-contain filter"
              />
            </div>
            <span className="logotext text-xl md:text-3xl font-bold">
              AnnaSetu
            </span>
          </Link>
 
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <ThemeToggle />
 
            {user && <NotificationBell />}
 
            <Link
              href="/"
              className="link px-4 py-2 font-medium rounded-lg hover:bg-green-100 dark:hover:bg-[#1a2639] hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <FaHome className="text-lg" />
              <span>Home</span>
            </Link>
 
            {user ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className="px-4 py-2 link font-medium rounded-lg hover:bg-green-100 dark:hover:bg-[#1a2639] hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  <FaUser className="text-lg" />
                  <span>Dashboard</span>
                </Link>
 
                {(isRestaurant || isIndividual) && addFoodLink && (
                  <Link
                    href={addFoodLink}
                    className="px-4 py-2 link font-medium rounded-lg hover:bg-green-100 dark:hover:bg-[#1a2639] hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2"
                  >
                    <FaUtensils />
                    <span>Add Food</span>
                  </Link>
                )}
 
                {/* User Menu */}
                <div className="relative group ml-2">
                  <button className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-all duration-200">
                    <div
                      className={`w-10 h-10 rounded-full bg-linear-to-r ${getRoleColor()} flex items-center justify-center text-white font-semibold text-xl shadow-md group-hover:shadow-lg transition-all duration-200`}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-semibold">
                        {displayName.split(" ")[0]}
                      </p>
                      <p
                        className={`text-xs px-1 py-0.5 rounded-sm ${getRoleBadgeColor()} border`}
                      >
                        {user.role}
                      </p>
                    </div>
                  </button>
 
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-64 bg-gray-100 dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      <div
                        className={`mt-2 text-xs px-2 py-1 rounded-full ${getRoleBadgeColor()} inline-block border`}
                      >
                        {user.role}
                      </div>
                    </div>
 
                    <Link
                      href="/protected/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm link hover:bg-green-100 dark:hover:bg-[#1a2639] transition-colors duration-150"
                    >
                      <FaUserCircle className="text-lg" />
                      <span>Profile Settings</span>
                    </Link>
 
                    {(isRestaurant || isIndividual) && addFoodLink && (
                      <Link
                        href={addFoodLink}
                        className="flex items-center gap-3 px-4 py-3 text-sm link hover:bg-green-100 dark:hover:bg-[#1a2639] transition-colors duration-150"
                      >
                        <FaUtensils className="text-lg" />
                        <span>Add New Food</span>
                      </Link>
                    )}
 
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-100 cursor-pointer dark:hover:bg-[#1a2639] transition-colors duration-150 border-t border-gray-200 dark:border-gray-800"
                    >
                      <FaSignOutAlt className="text-lg" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="link px-4 py-2 font-medium rounded-lg hover:bg-green-100 dark:hover:bg-[#1a2639] hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  <FaSignInAlt />
                  <span>Login</span>
                </Link>
                <Link
                  href="/auth/register"
                  className="link px-4 py-2 font-medium rounded-lg hover:bg-green-100 dark:hover:bg-[#1a2639] hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  <FaUserPlus />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
 
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            <ThemeToggle />
            {user && <NotificationBell />}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
 
        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-gray-200 dark:border-gray-800"
            >
              <div className="py-4 space-y-2 z-50">
                {user && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRoleColor()} flex items-center justify-center text-white font-semibold text-xl`}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        <div
                          className={`mt-1 text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()} inline-block`}
                        >
                          {user.role}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
 
                <Link
                  href="/"
                  className="link flex items-center gap-3 px-4 py-3 hover:bg-green-100 dark:hover:bg-[#1a2639] rounded-lg transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaHome />
                  <span className="font-medium">Home</span>
                </Link>
 
                {user ? (
                  <>
                    <Link
                      href={getDashboardLink()}
                      className="link flex items-center gap-3 px-4 py-3 hover:bg-green-100 dark:hover:bg-[#1a2639] rounded-lg transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaUser className="text-lg" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
 
                    {(isRestaurant || isIndividual) && addFoodLink && (
                      <Link
                        href={addFoodLink}
                        className="link flex items-center gap-3 px-4 py-3 hover:bg-green-100 dark:hover:bg-[#1a2639] rounded-lg transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FaUtensils className="text-lg" />
                        <span className="font-medium">Add Food</span>
                      </Link>
                    )}
 
                    <Link
                      href="/protected/profile"
                      className="link flex items-center gap-3 px-4 py-3 hover:bg-green-100 dark:hover:bg-[#1a2639] rounded-lg transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaUserCircle className="text-lg" />
                      <span className="font-medium">Profile</span>
                    </Link>
 
                    <Link
                      href="/protected/notifications"
                      className="link flex items-center gap-3 px-4 py-3 hover:bg-green-100 dark:hover:bg-[#1a2639] rounded-lg transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaBell className="text-lg" />
                      <span className="font-medium">Notifications</span>
                    </Link>
 
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-100 cursor-pointer dark:hover:bg-[#1a2639] rounded-lg transition-colors duration-200 border-t border-gray-200 dark:border-gray-800 mt-2 pt-3"
                    >
                      <FaSignOutAlt className="text-lg" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="link flex items-center gap-3 px-4 py-3 hover:bg-green-100 dark:hover:bg-[#1a2639] rounded-lg transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaSignInAlt />
                      <span className="font-medium">Login</span>
                    </Link>
                    <Link
                      href="/auth/register"
                      className="link flex items-center gap-3 px-4 py-3 hover:bg-green-100 dark:hover:bg-[#1a2639] rounded-lg transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaUserPlus />
                      <span className="font-medium">Sign Up</span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}