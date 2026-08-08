"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FaHome,
  FaCompass,
  FaPlus,
  FaCommentDots,
  FaUser,
  FaSignInAlt,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessageCount } from "@/hooks/useMessaging";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, isRestaurant, isIndividual } = useAuth();
  const { data } = useUnreadMessageCount();
  const unreadCount = data?.unreadCount || 0;

  // Don't display in auth login/register screens
  const isAuthPage = pathname.startsWith("/auth");
  if (isAuthPage) return null;

  const getAddFoodLink = (): string => {
    if (isRestaurant) return "/protected/add-food?role=restaurant";
    if (isIndividual) return "/protected/add-food?role=individual";
    return "/protected/add-food";
  };

  const getProfileLink = (): string => {
    if (!isAuthenticated) return "/auth/login";
    return "/protected/profile";
  };

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: FaHome,
      isActive: pathname === "/",
    },
    {
      label: "Explore",
      href: "/public/food",
      icon: FaCompass,
      isActive: pathname.startsWith("/public/food"),
    },
    {
      label: "List",
      href: isAuthenticated ? getAddFoodLink() : "/auth/login",
      icon: FaPlus,
      isCenter: true,
      isActive: pathname.startsWith("/protected/add-food"),
    },
    {
      label: "Messages",
      href: isAuthenticated ? "/protected/messages" : "/auth/login",
      icon: FaCommentDots,
      badge: isAuthenticated && unreadCount > 0 ? unreadCount : undefined,
      isActive: pathname.startsWith("/protected/messages"),
    },
    {
      label: isAuthenticated ? "Profile" : "Login",
      href: getProfileLink(),
      icon: isAuthenticated ? FaUser : FaSignInAlt,
      isActive:
        pathname.startsWith("/protected/profile") ||
        pathname.startsWith("/protected/dashboard"),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 w-full max-w-full overflow-x-hidden bg-white/95 dark:bg-[#0A192F]/95 backdrop-blur-2xl border-t border-gray-200/80 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <nav className="w-full max-w-lg mx-auto grid grid-cols-5 items-center px-1 py-1.5 box-border">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <div key={item.label} className="flex justify-center items-center w-full min-w-0">
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center group cursor-pointer"
                  aria-label={item.label}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md ${
                      item.isActive
                        ? "bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-emerald-500/40 ring-2 ring-emerald-500/50"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight truncate max-w-full text-center">
                    {item.label}
                  </span>
                </Link>
              </div>
            );
          }

          return (
            <div key={item.label} className="flex justify-center items-center w-full min-w-0">
              <Link
                href={item.href}
                className={`w-full flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
                  item.isActive
                    ? "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-500/15"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${item.isActive ? "scale-110" : ""}`} />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-bold min-w-[15px] h-[15px] flex items-center justify-center px-1 rounded-full ring-2 ring-white dark:ring-[#0A192F] animate-pulse">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full text-center">
                  {item.label}
                </span>
              </Link>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
