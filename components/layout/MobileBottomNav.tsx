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
  FaUserPlus,
  FaInfoCircle,
  FaThLarge,
  FaHandHoldingHeart,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessageCount } from "@/hooks/useMessaging";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isCenter?: boolean;
  isCta?: boolean;
  badge?: number;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, isRestaurant, isIndividual, isNGO, isAdmin } = useAuth();
  const { data } = useUnreadMessageCount();
  const unreadCount = data?.unreadCount || 0;

  // Hide on auth login/register/forgot pages
  const isAuthPage = pathname.startsWith("/auth");
  if (isAuthPage) return null;

  // Determine user-specific action button link
  const getCenterAction = (): {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
  } => {
    if (isAdmin) {
      return {
        label: "Admin",
        href: "/protected/admin",
        icon: FaThLarge,
        isActive: pathname.startsWith("/protected/admin"),
      };
    }
    if (isNGO) {
      return {
        label: "Surplus",
        href: "/public/food",
        icon: FaHandHoldingHeart,
        isActive: pathname.startsWith("/public/food"),
      };
    }
    // Restaurant or Individual donor
    return {
      label: "List Food",
      href: isRestaurant
        ? "/protected/add-food?role=restaurant"
        : "/protected/add-food?role=individual",
      icon: FaPlus,
      isActive: pathname.startsWith("/protected/add-food"),
    };
  };

  const centerAction = getCenterAction();

  // Navigation schema for Authenticated Users
  const authenticatedItems: NavItem[] = [
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
      isActive: pathname.startsWith("/public/food") && !centerAction.isActive,
    },
    {
      label: centerAction.label,
      href: centerAction.href,
      icon: centerAction.icon,
      isCenter: !isAdmin,
      isActive: centerAction.isActive,
    },
    {
      label: "Messages",
      href: "/protected/messages",
      icon: FaCommentDots,
      badge: unreadCount > 0 ? unreadCount : undefined,
      isActive: pathname.startsWith("/protected/messages"),
    },
    {
      label: "Dashboard",
      href: "/protected/dashboard",
      icon: FaUser,
      isActive:
        pathname.startsWith("/protected/dashboard") ||
        pathname.startsWith("/protected/profile"),
    },
  ];

  // Navigation schema for Unauthenticated Guests
  const guestItems: NavItem[] = [
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
      label: "How It Works",
      href: "/public/how-works",
      icon: FaInfoCircle,
      isActive: pathname.startsWith("/public/how-works"),
    },
    {
      label: "Sign In",
      href: "/auth/login",
      icon: FaSignInAlt,
      isActive: pathname.startsWith("/auth/login"),
    },
    {
      label: "Join Free",
      href: "/auth/register",
      icon: FaUserPlus,
      isCta: true,
      isActive: pathname.startsWith("/auth/register"),
    },
  ];

  const currentNavItems = isAuthenticated 
    ? (isAdmin ? authenticatedItems.filter(item => item.label !== "Messages") : authenticatedItems)
    : guestItems;

  return (
    <aside
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 w-full bg-white/95 dark:bg-[#081220]/95 backdrop-blur-2xl border-t border-gray-200/80 dark:border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.7)]"
    >
      <nav 
        className="w-full max-w-lg mx-auto grid items-center px-1.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] box-border"
        style={{ gridTemplateColumns: `repeat(${currentNavItems.length}, minmax(0, 1fr))` }}
      >
        {currentNavItems.map((item) => {
          const Icon = item.icon;

          // 1. Raised Center Action (For Authenticated Users)
          if (item.isCenter) {
            return (
              <div
                key={item.label}
                className="flex justify-center items-center w-full min-w-0"
              >
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center group cursor-pointer -mt-4 transition-transform active:scale-95"
                  aria-label={item.label}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                      item.isActive
                        ? "bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-emerald-500/50 ring-4 ring-white dark:ring-[#081220]"
                        : "bg-gradient-to-tr from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 ring-4 ring-white dark:ring-[#081220]"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight truncate max-w-full text-center">
                    {item.label}
                  </span>
                </Link>
              </div>
            );
          }

          // 2. High-Conversion CTA Button (For Guest Sign Up)
          if (item.isCta) {
            return (
              <div
                key={item.label}
                className="flex justify-center items-center w-full min-w-0"
              >
                <Link
                  href={item.href}
                  className="w-full flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
                  aria-label={item.label}
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight truncate max-w-full text-center">
                    {item.label}
                  </span>
                </Link>
              </div>
            );
          }

          // 3. Standard Navigation Item
          return (
            <div
              key={item.label}
              className="flex justify-center items-center w-full min-w-0"
            >
              <Link
                href={item.href}
                className={`w-full flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${
                  item.isActive
                    ? "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-500/15"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
                }`}
                aria-label={item.label}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      item.isActive ? "scale-110" : ""
                    }`}
                  />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-black min-w-[16px] h-[16px] flex items-center justify-center px-1 rounded-full ring-2 ring-white dark:ring-[#081220] animate-pulse">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] mt-1 tracking-tight truncate max-w-full text-center">
                  {item.label}
                </span>
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
