"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  FaBars,
  FaHome,
  FaSignInAlt,
  FaTimes,
  FaUserPlus,
} from "react-icons/fa";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <nav className=" transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-15 md:h-20">
          <Link href={"/"} className="flex items-center space-x-3 group ">
            <div className="w-10 h-10 md:w-14 md:h-14  rounded-full ">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-contain filter "
              />
            </div>
            <span className="logotext text-xl md:text-3xl font-bold">
              AnnaSetu
            </span>
          </Link>

          {/* desktop */}
          <div className="hidden md:flex items-center space-x-2">
            <ThemeToggle />
            <Link
              href="/"
              className="link px-4 py-2 font-medium rounded-lg hover:bg-green-100 dark:hover:bg-[#1a2639] hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <FaHome className="text-lg" />
              <span>Home</span>
            </Link>
            <Link
              href="/login"
              className="link px-4 py-2 font-medium rounded-lg hover:bg-green-100 dark:hover:bg-[#1a2639] hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <FaSignInAlt className="text-lg" />
              <span>Login</span>
            </Link>
            <Link
              href="/register"
              className="link px-4 py-2 font-medium rounded-lg hover:bg-green-100 dark:hover:bg-[#1a2639] hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <FaUserPlus className="text-lg" />
              <span>Sign Up</span>
            </Link>
          </div>

          {/* mobile */}
          <div className="md:hidden flex items-center space-x-3">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-gray-200 dark:border-gray-800"
            >
              <div></div>
              <Link
                href={"/"}
                className="link flex items-center gap-3 px-4 py-3 hover:bg-green-100 dark:hover:bg-[#1a2639] rounded-lg transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                <FaHome />
                <span className="font-medium">Home</span>
              </Link>
              <Link
                href={"/login"}
                className="link flex items-center gap-3 px-4 py-3 hover:bg-green-100 dark:hover:bg-[#1a2639] rounded-lg transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                <FaSignInAlt />
                <span className="font-medium">Login</span>
              </Link>
              <Link
                href="/register"
                className="link flex items-center gap-3 px-4 py-3 hover:bg-green-100 dark:hover:bg-[#1a2639] rounded-lg transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                <FaUserPlus />
                <span className="font-medium">Sign Up</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
