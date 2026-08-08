"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaLeaf,
  FaHeart,
  FaUsers,
  FaStore,
  FaGlobe,
  FaStar,
  FaCheckCircle,
  FaQuoteLeft,
  FaQuoteRight,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaRocket,
  FaTree,
  FaRecycle,
  FaSeedling,
} from "react-icons/fa";
import type { IconType } from "react-icons";
import { motion } from "framer-motion";
// import { assets } from "@/assets/asset";
import Button from "@/components/common/Button";
import { useTheme } from "next-themes";
// import { useTheme } from "@/context/ThemeContext";

// ---------- Types ----------

type ColorKey = "green" | "blue" | "purple" | "pink" | "red";

interface ColorStyle {
  bg: string;
  text: string;
}

interface StatItem {
  icon: IconType;
  value: string;
  label: string;
  color: ColorKey;
}

interface ImpactItem {
  icon: IconType;
  value: string;
  label: string;
  color: ColorKey;
}

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
  social: string;
}

interface Testimonial {
  name: string;
  role: string;
  image: string;
  quote: string;
  rating: number;
}

interface ValueItem {
  title: string;
  description: string;
  icon: IconType;
  color: ColorKey;
}

// Tailwind needs literal class names to detect them at build time, so
// dynamic strings like `bg-${color}-100` won't reliably generate CSS.
// A static lookup map keeps every class name literal in the source.
const colorStyles: Record<ColorKey, ColorStyle> = {
  green: {
    bg: "bg-green-100 dark:bg-green-800",
    text: "text-green-600 dark:text-green-300",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-800",
    text: "text-blue-600 dark:text-blue-300",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-800",
    text: "text-purple-600 dark:text-purple-300",
  },
  pink: {
    bg: "bg-pink-100 dark:bg-pink-800",
    text: "text-pink-600 dark:text-pink-300",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-800",
    text: "text-red-600 dark:text-red-300",
  },
};

const About: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const stats: StatItem[] = [
    { icon: FaLeaf, value: "12,450+", label: "Meals Saved", color: "green" },
    {
      icon: FaUsers,
      value: "5,200+",
      label: "Community Members",
      color: "blue",
    },
    {
      icon: FaStore,
      value: "150+",
      label: "Restaurant Partners",
      color: "purple",
    },
    { icon: FaHeart, value: "8,500+", label: "Happy Tummies", color: "pink" },
  ];

  const impacts: ImpactItem[] = [
    { icon: FaTree, value: "8.2T", label: "CO₂ Reduced", color: "green" },
    {
      icon: FaRecycle,
      value: "3,200kg",
      label: "Food Waste Prevented",
      color: "blue",
    },
    {
      icon: FaSeedling,
      value: "2,500",
      label: "Trees Equivalent",
      color: "green",
    },
    { icon: FaGlobe, value: "45", label: "Cities Covered", color: "purple" },
  ];

  const team: TeamMember[] = [
    {
      name: "Priya Sharma",
      role: "Founder & CEO",
      image:
        "https://images.unsplash.com/photo-1494790108777-2869c5b8c9a9?w=150",
      bio: "Passionate about reducing food waste and building community.",
      social: "priya.sharma",
    },
    {
      name: "Rahul Verma",
      role: "Head of Operations",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      bio: "Former restaurant owner, now helping others reduce waste.",
      social: "rahul.verma",
    },
    {
      name: "Ananya Das",
      role: "Community Manager",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      bio: "Building connections between food donors and communities.",
      social: "ananya.das",
    },
  ];

  const testimonials: Testimonial[] = [
    {
      name: "Green Bistro",
      role: "Restaurant Partner",
      image: "https://images.unsplash.com/photo-1552566624-52f8a3f7b5e1?w=150",
      quote:
        "Annosetu helped us reduce our food waste by 60% while serving our community.",
      rating: 5,
    },
    {
      name: "Maria Gomes",
      role: "Home Cook",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      quote:
        "I love sharing my homemade food with neighbors. It brings joy to everyone!",
      rating: 5,
    },
    {
      name: "Hope Foundation",
      role: "NGO Partner",
      image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=150",
      quote:
        "Annosetu has been instrumental in helping us feed hundreds of families.",
      rating: 5,
    },
  ];

  const values: ValueItem[] = [
    {
      title: "Zero Waste",
      description: "We believe no good food should go to waste.",
      icon: FaRecycle,
      color: "green",
    },
    {
      title: "Community First",
      description: "Building stronger communities through food sharing.",
      icon: FaUsers,
      color: "blue",
    },
    {
      title: "Food Safety",
      description: "Strict guidelines ensure safe food for everyone.",
      icon: FaCheckCircle,
      color: "red",
    },
    {
      title: "Sustainability",
      description: "Committed to environmental sustainability.",
      icon: FaLeaf,
      color: "green",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-transparent">
      {/* Hero Section */}
      <div className=" w-full relative overflow-hidden bg-linear-to-b from-transparent dark:from-gray-600 via-green-100 dark:via-slate-900 to-green-300 dark:to-zinc-950 dark:text-white text-gray-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 backdrop-blur-sm rounded-2xl mb-8"
            >
              {/* <Image src={assets.logo} alt="Annosetu" width={80} height={80} /> */}
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="logotext">Annosetu</span>
            </h1>

            <p className="text-sm sm:text-xl mb-8 max-w-3xl mx-auto text-gray-900/90 dark:text-white/90 ">
              অন্নসেতু - Building bridges between surplus food and those who
              need it, creating a sustainable and compassionate community.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register">
                <Button variant={"primary"}>Join Our Mission</Button>
              </Link>
              <Link href="/public/contact">
                <Button variant="outline">Contact Us</Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill={isDark ? "#374151" : "#ffffff"}
            />
          </svg>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => {
            const styles = colorStyles[stat.color];
            return (
              <motion.div
                key={stat.label}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-6 text-center group"
              >
                <div
                  className={`w-14 h-14 ${styles.bg} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110`}
                >
                  <stat.icon className={`w-7 h-7 ${styles.text}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Our Story */}
      <div className=" py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Our{" "}
                <span className="text-green-600 dark:text-green-300">
                  Story
                </span>
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-200 mb-6 leading-relaxed">
                Annosetu was born from a simple observation: every day,
                restaurants and home cooks throw away perfectly good food while
                people nearby go hungry.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-200 mb-6 leading-relaxed">
                The name &apos;Annosetu&apos; combines two Bengali words -
                &apos;অন্ন&apos; (food) and &apos;সেতু&apos; (bridge) - because
                we believe in building bridges between surplus food and those
                who need it.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed">
                Today, we&apos;re a community of thousands working together to
                reduce food waste, save money, and feed those in need - all
                while protecting our planet.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-linear-to-br from-green-400 to-amber-400 border-2 border-white"
                    ></div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-bold text-gray-900 dark:text-white">
                    5,200+
                  </span>{" "}
                  community members
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                {/* <Image
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800"
                  alt="Community sharing food"
                  width={800}
                  height={533}
                  className="w-full h-full object-cover"
                /> */}
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800"
                  alt="Community sharing food"
                  width={800}
                  height={533}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 dark:from-white/80 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white dark:text-gray-900">
                  <p className="text-2xl font-bold mb-1">Together We Can</p>
                  <p className="text-sm opacity-90">
                    End food waste, one meal at a time
                  </p>
                </div>
              </div>

              {/* Floating Card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-700 rounded-xl shadow-xl p-4 max-w-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                    <FaLeaf className="w-5 h-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      8.2T
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      CO₂ Reduced
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="py-16 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our{" "}
              <span className="text-green-600 dark:text-green-300">Values</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const styles = colorStyles[value.color];
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="card shadow-lg p-6 hover:shadow-xl transition-all group"
                >
                  <div
                    className={`w-16 h-16 ${styles.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <value.icon className={`w-8 h-8 ${styles.text}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Impact Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our <span className="text-green-600">Impact</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Together, we&apos;re making a real difference
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {impacts.map((impact, index) => {
              const styles = colorStyles[impact.color];
              return (
                <motion.div
                  key={impact.label}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: "spring" }}
                  className="text-center card"
                >
                  <div
                    className={`w-20 h-20 ${styles.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                  >
                    <impact.icon className={`w-10 h-10 ${styles.text}`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {impact.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {impact.label}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-gradient-to-r from-green-300 to-amber-200 dark:from-green-900 dark:to-amber-900 rounded-2xl p-8 dark:text-white text-gray-900"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <FaRocket className="w-10 h-10" />
                <div>
                  <h3 className="text-xl font-bold">2025 Goal: 50,000 Meals</h3>
                  <p className="dark:text-white/80 text-gray-900/80">
                    We&apos;re 25% there!
                  </p>
                </div>
              </div>
              <div className="w-full md:w-64">
                <div className="w-full dark:bg-white/20 bg-gray-900/20 rounded-full h-4">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "25%" }}
                    viewport={{ once: true }}
                    className="dark:bg-white bg-gray-900 h-4 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What People{" "}
              <span className="text-green-600 dark:text-green-300">Say</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Hear from our wonderful community
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-6 relative"
              >
                <FaQuoteLeft className="absolute top-4 left-4 w-8 h-8 text-green-200 dark:text-green-700" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    {/* <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-gray-500 shadow-lg"
                    /> */}
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {testimonial.role}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: testimonial.rating }).map(
                          (_, i) => (
                            <FaStar
                              key={i}
                              className="w-4 h-4 text-yellow-400 dark:text-yellow-500"
                            />
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 italic">
                    &quot;{testimonial.quote}&quot;
                  </p>
                </div>
                <FaQuoteRight className="absolute bottom-4 right-4 w-6 h-6 text-green-200 dark:text-green-700" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Meet Our{" "}
              <span className="text-green-600 dark:text-green-300">Team</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The passionate people behind Annosetu
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card overflow-hidden group"
              >
                <div className="relative h-64 overflow-hidden">
                  {/* <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  /> */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 dark:from-white/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-4 left-4 text-white dark:text-gray-900 transform translate-y-10 group-hover:translate-y-0 transition-transform">
                    <p className="text-sm opacity-90">@{member.social}</p>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {member.name}
                  </h3>
                  <p className="text-green-600 dark:text-green-300 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {member.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-green-400/20 dark:bg-gray-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="dark:text-white text-gray-900"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join Our Mission
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-900/90 dark:text-white/90 ">
              Be part of the change. Start saving food today!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register?role=individual">
                <Button className="bg-transparent text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700 px-8 py-4 text-lg border">
                  Join as Individual
                </Button>
              </Link>
              <Link href="/auth/register?role=restaurant">
                <Button className="dark:bg-white/20 bg-gray-900/20 backdrop-blur-sm text-white border-white dark:hover:bg-white/30 hover:bg-gray-900/30 px-8 py-4 text-lg">
                  Join as Restaurant
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Info */}
      <div className=" text-white py-12 dark:text-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 dark:bg-white/10 bg-gray-900/10  rounded-xl flex items-center justify-center">
                <FaMapMarkerAlt className="w-5 h-5 dark:text-gray-200 text-gray-700" />
              </div>
              <div>
                <h4 className="font-semibold mb-1 dark:text-gray-200 text-gray-700 ">
                  Visit Us
                </h4>
                <p className="text-sm dark:text-gray-300 text-gray-600">
                  Kolkata, West Bengal
                </p>
                <p className="text-sm dark:text-gray-300 text-gray-600">
                  India
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 dark:bg-white/10 bg-gray-900/10 rounded-xl flex items-center justify-center">
                <FaEnvelope className="w-5 h-5 dark:text-gray-200 text-gray-700" />
              </div>
              <div>
                <h4 className="font-semibold mb-1 dark:text-gray-200 text-gray-700">
                  Email Us
                </h4>
                <p className="text-sm dark:text-gray-300 text-gray-600">
                  hello@annosetu.app
                </p>
                <p className="text-sm dark:text-gray-300 text-gray-600">
                  support@annosetu.app
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 dark:bg-white/10 bg-gray-900/10 rounded-xl flex items-center justify-center">
                <FaClock className="w-5 h-5 dark:text-gray-200 text-gray-700" />
              </div>
              <div>
                <h4 className="font-semibold mb-1 dark:text-gray-200 text-gray-700">
                  Working Hours
                </h4>
                <p className="text-sm dark:text-gray-300 text-gray-600">
                  Mon - Sat: 9:00 AM - 8:00 PM
                </p>
                <p className="text-sm dark:text-gray-300 text-gray-600">
                  Sunday: 10:00 AM - 6:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
