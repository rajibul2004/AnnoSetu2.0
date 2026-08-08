"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaComments,
  FaShieldAlt,
  FaUtensils,
  FaPaperPlane,
  FaCheckCircle,
  FaHeadset,
  FaHeart,
  FaInfoCircle,
} from "react-icons/fa";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";

const CONTACT_CHANNELS = [
  {
    title: "Community Helpline",
    description: "Urgent surplus pickups and food rescue emergency assistance.",
    value: "+91 (800) 123-4567",
    action: "tel:+918001234567",
    actionLabel: "Call 24/7 Helpline",
    icon: FaPhoneAlt,
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "Kitchen & NGO Support",
    description: "Partnership inquiries, banquet listings, and NGO verification.",
    value: "partnerships@annosetu.org",
    action: "mailto:partnerships@annosetu.org",
    actionLabel: "Email Partner Team",
    icon: FaUtensils,
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Technical & Feedback",
    description: "App assistance, AI assistant troubleshooting, or suggestions.",
    value: "support@annosetu.org",
    action: "mailto:support@annosetu.org",
    actionLabel: "Email Support",
    icon: FaHeadset,
    color: "from-purple-500 to-pink-600",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "general",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Thank you! Your message has been sent to our team.");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-transparent pt-20 sm:pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Hero */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-4">
            <FaComments className="text-emerald-500" />
            <span>We&apos;re Here to Help</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            Connect with the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600">
              AnnoSetu Team
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
            Have questions about sharing food, becoming a verified partner kitchen, or connecting with local food shelters? Reach out directly.
          </p>
        </motion.div>

        {/* Contact Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {CONTACT_CHANNELS.map((ch) => {
            const Icon = ch.icon;
            return (
              <div
                key={ch.title}
                className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between hover:shadow-2xl transition-all group"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${ch.color} text-white flex items-center justify-center text-xl mb-5 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                    {ch.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                    {ch.description}
                  </p>
                  <div className="text-sm font-black text-gray-900 dark:text-white mb-6">
                    {ch.value}
                  </div>
                </div>

                <a
                  href={ch.action}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white text-gray-800 dark:text-gray-200 text-xs font-bold text-center transition-colors block"
                >
                  {ch.actionLabel} &rarr;
                </a>
              </div>
            );
          })}
        </div>

        {/* Form and Hub Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Card */}
          <div className="lg:col-span-7 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-gray-200/80 dark:border-slate-800 shadow-xl">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              Send us a Message
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-8">
              Fill in your inquiry details below and our team will get back to you within 24 hours.
            </p>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                  <FaCheckCircle />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                  Message Dispatched!
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                  Thank you for reaching out. We have logged your request and a representative will follow up with you shortly.
                </p>
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({
                      name: "",
                      email: "",
                      phone: "",
                      subject: "general",
                      message: "",
                    });
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs"
                >
                  Send Another Inquiry
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Priya Sharma"
                    required
                  />

                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="priya@example.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number (Optional)"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+91 98765 43210"
                  />

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                      Topic / Category
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, subject: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="general">General Community Question</option>
                      <option value="restaurant">Restaurant Partner Enrollment</option>
                      <option value="ngo">NGO / Relief Organization Verification</option>
                      <option value="app_feedback">App Feature & AI Feedback</option>
                      <option value="safety">Food Safety Report</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Your Message
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, message: e.target.value }))
                    }
                    placeholder="Tell us how we can help you or describe your inquiry..."
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>

                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <FaPaperPlane className="text-xs" />
                  <span>Submit Inquiry</span>
                </Button>
              </form>
            )}
          </div>

          {/* Info & Operations Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-slate-800 shadow-xl space-y-6">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                Operations &amp; Hubs
              </h3>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Central Innovation Hub
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                    AnnoSetu Food Rescue Foundation <br />
                    Sector 5, Tech Enclave, Salt Lake <br />
                    Kolkata, WB - 700091, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FaClock />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Operating Hours
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                    App &amp; Rescue Alerts: 24/7 <br />
                    Partner Support Desk: 8:00 AM – 10:00 PM IST
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <FaShieldAlt />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Food Safety Compliance
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    All partner kitchens are monitored for compliant temperature guidelines and FSSAI safe disposal protocols.
                  </p>
                </div>
              </div>
            </div>

            {/* Micro Community Notice */}
            <div className="p-5 rounded-2xl bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-3">
              <FaHeart className="text-emerald-500 shrink-0 text-lg" />
              <span>
                <strong>100% Volunteer Driven &amp; AI Powered.</strong> Every inquiry helps us rescue more meals and feed more neighborhoods.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}