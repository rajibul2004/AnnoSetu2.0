"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className=" transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      </div>
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              AnnoSetu
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/foods"
              className="text-neutral-700 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400 transition-colors"
            >
              Browse Food
            </Link>
            <Link
              href="/about"
              className="text-neutral-700 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400 transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-neutral-700 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400 transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {session ? (
              <div className="flex items-center space-x-3">
                <Link href="/dashboard" className="btn btn-primary">
                  Dashboard
                </Link>
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="btn btn-outline">
                  Login
                </Link>
                <Link href="/register" className="btn btn-primary">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
