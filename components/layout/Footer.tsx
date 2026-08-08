"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FaGithub,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaEnvelope,
  FaHeart,
  FaArrowUp,
} from "react-icons/fa";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on focused flows (auth funnels, fullscreen live chat, QR camera scanner)
  const shouldHideFooter =
    pathname?.startsWith("/auth/") ||
    pathname === "/protected/messages" ||
    pathname === "/protected/reservation/pickup";

  if (shouldHideFooter) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <footer className="relative pt-16 pb-8 overflow-hidden border-t border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <Link
              href="/"
              className="flex items-center space-x-3 group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
            >
              <img src="/logo.png" alt="Logo" className="size-12" />
              <span className="text-2xl logotext font-bold ">AnnaSetu</span>
            </Link>

            <p className="dark:text-gray-300 text-gray-700">
              Reducing food waste responsibly by connecting restaurants,
              individuals, and NGOs to create a sustainable food ecosystem.
            </p>
            <div className="flex space-x-3 pt-4">
              {[
                {
                  icon: FaGithub,
                  href: "https://github.com/annosetu",
                  label: "GitHub",
                },
                {
                  icon: FaTwitter,
                  href: "https://twitter.com/annosetu",
                  label: "Twitter",
                },
                {
                  icon: FaFacebook,
                  href: "https://facebook.com/annosetu",
                  label: "Facebook",
                },
                {
                  icon: FaInstagram,
                  href: "https://instagram.com/annosetu",
                  label: "Instagram",
                },
                {
                  icon: FaLinkedin,
                  href: "https://linkedin.com/company/annosetu",
                  label: "LinkedIn",
                },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-gray-200 dark:bg-gray-800 hover:bg-gradient-to-r hover:from-green-500 hover:to-green-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white dark:text-gray-600 dark:hover:text-black transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold relative inline-block">
              Quick Links
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-linear-to-r from-amber-300 to-amber-500 rounded-full"></span>
            </h3>
            <ul className="space-y-3 pt-4">
              {[
                { name: "Home", path: "/" },
                { name: "About Us", path: "/public/about" },
                { name: "How It Works", path: "/public/how-works" },
                { name: "Food Safety", path: "/public/safety" },
                { name: "Blog", path: "/public/blog" },
                { name: "Contact", path: "/public/contact" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.path}
                    className="link text-md font-semibold transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-green-500 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold relative inline-block">
              For You
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-linear-to-r from-amber-300 to-amber-500 rounded-full"></span>
            </h3>
            <ul className="space-y-3 pt-4">
              {[
                {
                  name: "Restaurants",
                  path: "/public/how-works?role=restaurant",
                  color: "bg-blue-500",
                  icon: "🏪",
                },
                {
                  name: "Individuals",
                  path: "/public/how-works?role=individual",
                  color: "bg-green-500",
                  icon: "👤",
                },
                {
                  name: "NGOs & Shelters",
                  path: "/public/how-works?role=ngo",
                  color: "bg-purple-500",
                  icon: "🏥",
                },
                {
                  name: "Kitchen Partners",
                  path: "/public/contact",
                  color: "bg-pink-500",
                  icon: "🤝",
                },
                {
                  name: "Volunteer Support",
                  path: "/public/contact",
                  color: "bg-orange-500",
                  icon: "🙋",
                },
              ].map((role) => (
                <li key={role.name}>
                  <Link
                    href={role.path}
                    className="link text-md font-semibold transition-colors duration-200 flex items-center group"
                  >
                    <span className="mr-3 text-lg">{role.icon}</span>
                    <span className="flex-1">{role.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${role.color} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                    ></span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold relative inline-block">
              Stay Updated
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-linear-to-r from-amber-300 to-amber-500 rounded-full"></span>
            </h3>

            <div className="pt-4">
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                Subscribe to our newsletter for updates on food saving tips and
                community events.
              </p>

              <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="w-full px-4 py-3 dark:bg-gray-800 bg-gray-200 border border-gray-700 rounded-lg dark:text-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    suppressHydrationWarning
                  />
                  <FaEnvelope
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    size={16}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full  btn-primary font-medium py-3 px-4 "
                  suppressHydrationWarning
                >
                  Subscribe
                </button>
              </form>

              {/* Impact Counter */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      12.5K+
                    </div>
                    <div className="text-xs text-gray-500">Meals Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">
                      8.2T
                    </div>
                    <div className="text-xs text-gray-500">CO₂ Reduced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-400">5K+</div>
                    <div className="text-xs text-gray-500">Users</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 mt-12 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="flex flex-wrap items-center justify-center text-center gap-1 text-gray-500 dark:text-gray-400 text-sm px-4">
              <span>Made with</span>
              <FaHeart className="text-red-500 animate-pulse" />
              <span>to reduce food waste.</span>
              <span>
                © {new Date().getFullYear()} AnnoSetu. All rights reserved.
              </span>
            </p>

            <div className="flex items-center space-x-6">
              <Link
                href="/privacy"
                className="text-xs text-gray-500 dark:hover:text-gray-300 hover:text-gray-700 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-gray-500 dark:hover:text-gray-300 hover:text-gray-700 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-xs text-gray-500 dark:hover:text-gray-300 hover:text-gray-700 transition-colors"
              >
                Cookie Policy
              </Link>
            </div>

            <button
              onClick={scrollToTop}
              className="cursor-pointer w-10 h-10 dark:bg-gray-800 bg-gray-200 hover:bg-gradient-to-r hover:from-green-500 hover:to-green-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 group"
              aria-label="Scroll to top"
              suppressHydrationWarning
            >
              <FaArrowUp className="group-hover:animate-bounce" />
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Food safety first. Always check expiry times and follow storage
            guidelines. AnnoSetu is a platform facilitator, not a food provider.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
