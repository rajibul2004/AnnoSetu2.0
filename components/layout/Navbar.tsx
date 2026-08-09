"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import NotificationBell from "@/components/notifications/NotificationBell";
import NavbarMessagesButton from "@/components/messages/NavbarMessagesButton";
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
  FaCompass,
  FaCommentDots,
  FaMagic,
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
    if (isIndividual) return "from-pink-500 to-rose-600";
    if (isNGO) return "from-purple-500 to-indigo-600";
    return "from-emerald-500 to-green-600";
  };

  const getRoleBadgeColor = (): string => {
    if (isRestaurant)
      return "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    if (isIndividual)
      return "bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800";
    if (isNGO)
      return "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    return "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  };

  const displayName = user?.name ?? user?.email ?? "";
  const addFoodLink = getAddFoodLink();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-[#0A192F]/85 border-b border-gray-200/70 dark:border-white/10 shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex items-center justify-center bg-emerald-500/10 p-1"
            >
              <Image
                src="/logo.png"
                alt="AnnoSetu"
                width={48}
                height={48}
                className="w-full h-full object-contain filter"
                priority
              />
            </motion.div>
            <div className="flex flex-col">
              <span className="logotext text-xl md:text-2xl font-black">
                AnnoSetu
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 dark:text-gray-400 -mt-1 hidden sm:block">
                The Food Bridge
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              href="/"
              className="px-3.5 py-2 font-semibold text-sm rounded-xl text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
            >
              <FaHome className="text-base text-emerald-600 dark:text-emerald-400" />
              <span>Home</span>
            </Link>

            <Link
              href="/public/food"
              className="px-3.5 py-2 font-semibold text-sm rounded-xl text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
            >
              <FaCompass className="text-base text-emerald-600 dark:text-emerald-400" />
              <span>Explore Food</span>
            </Link>

            <div className="h-5 w-px bg-gray-200 dark:bg-slate-700 mx-1" />

            <ThemeToggle />

            {user && (
              <>
                <NavbarMessagesButton />
                <NotificationBell />
              </>
            )}

            {user ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className="px-3.5 py-2 font-semibold text-sm rounded-xl text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
                >
                  <FaUser className="text-base text-emerald-600 dark:text-emerald-400" />
                  <span>Dashboard</span>
                </Link>

                {(isRestaurant || isIndividual) && addFoodLink && (
                  <Link
                    href={addFoodLink}
                    className="px-4 py-2 font-semibold text-sm rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-md hover:shadow-emerald-500/25 hover:scale-103 transition-all duration-200 flex items-center gap-2"
                  >
                    <FaUtensils className="text-xs" />
                    <span>Donate / Add Food</span>
                  </Link>
                )}

                {/* User Menu Dropdown */}
                <div className="relative group ml-2">
                  <button className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200">
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getRoleColor()} flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white/80 dark:ring-slate-800`}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 max-w-[100px] truncate leading-tight">
                        {displayName.split(" ")[0]}
                      </p>
                      <p
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${getRoleBadgeColor()} border inline-block mt-0.5`}
                      >
                        {user.role}
                      </p>
                    </div>
                  </button>

                  {/* Dropdown Card */}
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-slate-800 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50 backdrop-blur-xl">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                      <div
                        className={`mt-2 text-xs px-2.5 py-0.5 rounded-full ${getRoleBadgeColor()} inline-block border font-semibold`}
                      >
                        {user.role?.toUpperCase()}
                      </div>
                    </div>

                    <Link
                      href="/protected/messages"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <FaCommentDots className="text-base text-gray-400" />
                      <span>Pickup Messages</span>
                    </Link>

                    <Link
                      href="/protected/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <FaUserCircle className="text-base text-gray-400" />
                      <span>Profile Settings</span>
                    </Link>

                    {(isRestaurant || isIndividual) && addFoodLink && (
                      <Link
                        href={addFoodLink}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <FaUtensils className="text-base text-gray-400" />
                        <span>Add New Food</span>
                      </Link>
                    )}

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors border-t border-gray-100 dark:border-slate-800 mt-1"
                    >
                      <FaSignOutAlt className="text-base" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 ml-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 font-semibold text-sm rounded-xl text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
                >
                  <FaSignInAlt className="text-emerald-600 dark:text-emerald-400" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 font-semibold text-sm rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-md hover:shadow-emerald-500/25 hover:scale-103 transition-all duration-200 flex items-center gap-2"
                >
                  <FaUserPlus />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Controls */}
          <div className="md:hidden flex items-center space-x-1 sm:space-x-2">
            <ThemeToggle />
            {user && <NavbarMessagesButton />}
            {user && <NotificationBell />}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden border-t border-gray-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#0A192F]/95 backdrop-blur-2xl rounded-b-3xl shadow-2xl"
            >
              <div className="py-4 px-2 space-y-2">
                {user && (
                  <div className="p-3.5 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-full bg-gradient-to-tr ${getRoleColor()} flex items-center justify-center text-white font-bold text-lg shadow-md`}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        <div
                          className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${getRoleBadgeColor()} border inline-block`}
                        >
                          {user.role?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 font-semibold text-sm text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaHome className="text-emerald-500" />
                  <span>Home</span>
                </Link>

                <Link
                  href="/public/food"
                  className="flex items-center gap-3 px-4 py-3 font-semibold text-sm text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaCompass className="text-emerald-500" />
                  <span>Explore Food</span>
                </Link>

                {user ? (
                  <>
                    <Link
                      href={getDashboardLink()}
                      className="flex items-center gap-3 px-4 py-3 font-semibold text-sm text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaUser className="text-emerald-500" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      href="/protected/messages"
                      className="flex items-center gap-3 px-4 py-3 font-semibold text-sm text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaCommentDots className="text-emerald-500" />
                      <span>Pickup Messages</span>
                    </Link>

                    {(isRestaurant || isIndividual) && addFoodLink && (
                      <Link
                        href={addFoodLink}
                        className="flex items-center gap-3 px-4 py-3 font-semibold text-sm bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl shadow-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FaUtensils />
                        <span>Donate / Add Food</span>
                      </Link>
                    )}

                    <Link
                      href="/protected/profile"
                      className="flex items-center gap-3 px-4 py-3 font-semibold text-sm text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaUserCircle className="text-emerald-500" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      href="/protected/notifications"
                      className="flex items-center gap-3 px-4 py-3 font-semibold text-sm text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaBell className="text-emerald-500" />
                      <span>Notifications</span>
                    </Link>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 font-semibold text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer border-t border-gray-100 dark:border-slate-800 mt-2"
                    >
                      <FaSignOutAlt />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
                    <Link
                      href="/auth/login"
                      className="flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm text-gray-800 dark:text-white bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaSignInAlt className="text-emerald-500" />
                      <span>Login</span>
                    </Link>
                    <Link
                      href="/auth/register"
                      className="flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl shadow-md transition-all"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaUserPlus />
                      <span>Sign Up</span>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}