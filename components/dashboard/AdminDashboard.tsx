"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  FaShieldAlt,
  FaUsers,
  FaUtensils,
  FaBoxOpen,
  FaLeaf,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaBan,
  FaSearch,
  FaFilter,
  FaSyncAlt,
  FaBullhorn,
  FaHistory,
  FaEye,
  FaClock,
  FaFileAlt,
  FaCheck,
  FaTrash,
  FaServer,
  FaChartPie,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatDate } from "@/lib/formatters";

type AdminTab =
  | "overview"
  | "users"
  | "listings"
  | "reservations"
  | "reports"
  | "broadcast";

export default function AdminDashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [listingSearch, setListingSearch] = useState("");
  const [listingStatusFilter, setListingStatusFilter] = useState("all");
  const [reservationSearch, setReservationSearch] = useState("");
  const [reservationStatusFilter, setReservationStatusFilter] = useState("all");

  // Document Verification Modal / Drawer State
  const [selectedUserForVerification, setSelectedUserForVerification] = useState<any | null>(null);

  // Broadcast Composer State
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "restaurant" | "ngo" | "individual">("all");
  const [broadcastPriority, setBroadcastPriority] = useState<"low" | "medium" | "high" | "urgent">("high");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // Action Loading Tracker
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // 1. Fetch Stats & Aggregations
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    }
  };

  // 2. Fetch Users
  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set("search", userSearch);
      if (userRoleFilter !== "all") params.set("role", userRoleFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  // 3. Fetch Listings
  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      if (listingSearch) params.set("search", listingSearch);
      if (listingStatusFilter !== "all") params.set("status", listingStatusFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/admin/listings?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setListings(data.data.listings || []);
      }
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    }
  };

  // 4. Fetch Reservations
  const fetchReservations = async () => {
    try {
      const params = new URLSearchParams();
      if (reservationSearch) params.set("search", reservationSearch);
      if (reservationStatusFilter !== "all") params.set("status", reservationStatusFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/admin/reservations?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReservations(data.data.reservations || []);
      }
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
    }
  };

  // 5. Fetch Reports
  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/reports?limit=50");
      const data = await res.json();
      if (data.success) {
        setReports(data.data.reports || []);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  // Initial Load & Refresh
  const reloadAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchListings(),
      fetchReservations(),
      fetchReports(),
    ]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    reloadAll();
  }, []);

  // Filter triggers
  useEffect(() => {
    if (!loading) fetchUsers();
  }, [userSearch, userRoleFilter]);

  useEffect(() => {
    if (!loading) fetchListings();
  }, [listingSearch, listingStatusFilter]);

  useEffect(() => {
    if (!loading) fetchReservations();
  }, [reservationSearch, reservationStatusFilter]);

  // Admin Actions
  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !currentActive }),
      });
      if (res.ok) {
        await Promise.all([fetchUsers(), fetchStats()]);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateVerification = async (
    userId: string,
    docType: "fssai" | "govtId" | "darpan" | "taxExempt",
    newStatus: "verified" | "rejected" | "unverified"
  ) => {
    setActionLoadingId(userId);
    try {
      const verificationUpdates: any = {};
      if (docType === "fssai") {
        verificationUpdates.fssaiStatus = newStatus;
        if (newStatus === "verified") verificationUpdates.verificationBadge = "fssai_verified";
      } else if (docType === "govtId") {
        verificationUpdates.govtIdStatus = newStatus;
        if (newStatus === "verified") verificationUpdates.verificationBadge = "id_verified";
      } else if (docType === "darpan") {
        verificationUpdates.darpanStatus = newStatus;
        if (newStatus === "verified") verificationUpdates.verificationBadge = "darpan_verified";
      } else if (docType === "taxExempt") {
        verificationUpdates.taxExemptStatus = newStatus;
        if (newStatus === "verified") verificationUpdates.verificationBadge = "80g_verified";
      }

      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, verificationUpdates }),
      });

      if (res.ok) {
        await Promise.all([fetchUsers(), fetchStats()]);
        setSelectedUserForVerification(null);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleListingAction = async (
    foodId: string,
    action: "force_expire" | "toggle_active" | "restore" | "delete"
  ) => {
    setActionLoadingId(foodId);
    try {
      if (action === "delete") {
        await fetch(`/api/admin/listings?foodId=${foodId}`, { method: "DELETE" });
      } else {
        await fetch("/api/admin/listings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodId, action }),
        });
      }
      await Promise.all([fetchListings(), fetchStats()]);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReservationAction = async (
    reservationId: string,
    status: "confirmed" | "picked_up" | "cancelled"
  ) => {
    setActionLoadingId(reservationId);
    try {
      await fetch("/api/admin/reservations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, status }),
      });
      await Promise.all([fetchReservations(), fetchStats()]);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReportAction = async (
    reportId: string,
    status: "reviewed" | "actioned" | "dismissed"
  ) => {
    setActionLoadingId(reportId);
    try {
      await fetch("/api/admin/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status }),
      });
      await Promise.all([fetchReports(), fetchStats()]);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setBroadcastSending(true);
    setBroadcastSuccess(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          targetRole: broadcastTarget,
          priority: broadcastPriority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBroadcastSuccess(data.message);
        setBroadcastTitle("");
        setBroadcastMessage("");
      }
    } catch (err: any) {
      alert("Failed to send broadcast: " + err.message);
    } finally {
      setBroadcastSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LoadingSpinner />
        <p className="text-sm font-semibold text-slate-400">Loading AnnoSetu Admin Suite...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. TOP HEADER & SYSTEM HEALTH BAR */}
      <div
        className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? "bg-slate-900/90 border-slate-800 text-white shadow-purple-950/20"
            : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-purple-600/30">
            <FaShieldAlt />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                AnnoSetu Operations Center
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Admin Suite
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Real-time platform moderation, compliance verifications, and operational analytics.
            </p>
          </div>
        </div>

        {/* System Health Status & Refresh */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold ${
              isDark ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold">System Status</span>
              <span className="text-emerald-500 font-bold">Operational (99.98%)</span>
            </div>
          </div>

          <button
            onClick={reloadAll}
            disabled={refreshing}
            className={`p-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${
              isDark
                ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
            }`}
            title="Refresh All Data"
          >
            <FaSyncAlt className={refreshing ? "animate-spin text-purple-400" : ""} />
          </button>
        </div>
      </div>

      {/* 2. 6 KEY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Users */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
            <FaUsers className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{stats?.users?.total ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>🍽️ {stats?.users?.restaurant ?? 0} Rest.</span>
            <span>🤝 {stats?.users?.ngo ?? 0} NGOs</span>
            <span>👤 {stats?.users?.individual ?? 0} Indiv.</span>
          </div>
        </div>

        {/* Card 2: Food Surplus Listings */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Listings</span>
            <FaUtensils className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats?.foods?.active ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>🎁 {stats?.foods?.donations ?? 0} Free</span>
            <span>🏷️ {stats?.foods?.paid ?? 0} Discount</span>
            <span>⏳ {stats?.foods?.expired ?? 0} Expired</span>
          </div>
        </div>

        {/* Card 3: Completed Pickups */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Meals Rescued</span>
            <FaBoxOpen className="text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400">
            {stats?.impact?.portionsRescued ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>~{stats?.impact?.kgRescued ?? 0} kg surplus rescued</span>
          </div>
        </div>

        {/* Card 4: Environmental CO2 Saved */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">CO₂ Avoided</span>
            <FaLeaf className="text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-400">{stats?.impact?.co2SavedKg ?? 0} kg</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>Reduced landfill methane</span>
          </div>
        </div>

        {/* Card 5: Verification Queue */}
        <div
          onClick={() => setActiveTab("users")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-amber-500/50 ${
            stats?.queues?.pendingVerifications > 0
              ? isDark
                ? "bg-amber-950/20 border-amber-800/40"
                : "bg-amber-50 border-amber-200"
              : isDark
              ? "bg-slate-900/80 border-slate-800"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Verifications</span>
            <FaFileAlt className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 flex items-center gap-2">
            <span>{stats?.queues?.pendingVerifications ?? 0}</span>
            {stats?.queues?.pendingVerifications > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold animate-pulse">
                Pending
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>FSSAI & NGO audit queue</span>
          </div>
        </div>

        {/* Card 6: Safety Moderation Queue */}
        <div
          onClick={() => setActiveTab("reports")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-rose-500/50 ${
            stats?.queues?.pendingReports > 0
              ? isDark
                ? "bg-rose-950/20 border-rose-800/40"
                : "bg-rose-50 border-rose-200"
              : isDark
              ? "bg-slate-900/80 border-slate-800"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Safety Reports</span>
            <FaExclamationTriangle className="text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 flex items-center gap-2">
            <span>{stats?.queues?.pendingReports ?? 0}</span>
            {stats?.queues?.pendingReports > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold animate-pulse">
                Action
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>Community flags to review</span>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "overview", label: "Overview & Analytics", icon: FaChartPie },
          {
            id: "users",
            label: "User & Verification Center",
            icon: FaUsers,
            badge: stats?.queues?.pendingVerifications,
          },
          { id: "listings", label: "Food Surplus Moderation", icon: FaUtensils },
          { id: "reservations", label: "Reservations Ledger", icon: FaBoxOpen },
          {
            id: "reports",
            label: "Safety & Flag Reports",
            icon: FaExclamationTriangle,
            badge: stats?.queues?.pendingReports,
          },
          { id: "broadcast", label: "Broadcast Alerts", icon: FaBullhorn },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105"
                  : isDark
                  ? "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm"
              }`}
            >
              <Icon />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENT AREAS */}
      <div className="space-y-6">
        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Impact Highlights */}
            <div
              className={`lg:col-span-8 p-6 rounded-3xl border ${
                isDark ? "bg-slate-900/90 border-slate-800 text-white" : "bg-white border-slate-200 shadow-md"
              }`}
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🌍</span>
                <span>AnnoSetu Planetary & Community Impact</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="text-xs text-slate-400 font-bold uppercase">Meals Served</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {stats?.impact?.portionsRescued ?? 0}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Portions distributed</div>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="text-xs text-slate-400 font-bold uppercase">Landfill Avoidance</div>
                  <div className="text-2xl font-black text-teal-400 mt-1">
                    {stats?.impact?.kgRescued ?? 0} kg
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Direct food rescue</div>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="text-xs text-slate-400 font-bold uppercase">Economic Value Rescued</div>
                  <div className="text-2xl font-black text-purple-400 mt-1">
                    ₹{stats?.impact?.volumeInr ?? 0}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Total transactions</div>
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>Listing Model: Free Donations vs Discounted Food</span>
                    <span>
                      {stats?.foods?.total > 0
                        ? `${Math.round(((stats?.foods?.donations || 0) / stats?.foods?.total) * 100)}% Free`
                        : "0%"}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      style={{
                        width: `${
                          stats?.foods?.total > 0
                            ? ((stats?.foods?.donations || 0) / stats?.foods?.total) * 100
                            : 50
                        }%`,
                      }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-400"
                    />
                    <div
                      style={{
                        width: `${
                          stats?.foods?.total > 0
                            ? ((stats?.foods?.paid || 0) / stats?.foods?.total) * 100
                            : 50
                        }%`,
                      }}
                      className="bg-gradient-to-r from-purple-500 to-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>Pickup Fulfillment Rate</span>
                    <span>
                      {stats?.reservations?.total > 0
                        ? `${Math.round(
                            ((stats?.reservations?.pickedUp || 0) / stats?.reservations?.total) * 100
                          )}% Fulfilled`
                        : "0%"}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      style={{
                        width: `${
                          stats?.reservations?.total > 0
                            ? ((stats?.reservations?.pickedUp || 0) / stats?.reservations?.total) * 100
                            : 0
                        }%`,
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Tasks */}
            <div
              className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between ${
                isDark ? "bg-slate-900/90 border-slate-800 text-white" : "bg-white border-slate-200 shadow-md"
              }`}
            >
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <span>⚡</span>
                  <span>Urgent Admin Actions</span>
                </h3>

                <div className="space-y-3">
                  <div
                    onClick={() => setActiveTab("users")}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between ${
                      isDark ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                        <FaFileAlt />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Document Verifications</div>
                        <div className="text-[11px] text-slate-400">
                          {stats?.queues?.pendingVerifications} awaiting review
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-purple-400 font-bold">Review →</span>
                  </div>

                  <div
                    onClick={() => setActiveTab("reports")}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between ${
                      isDark ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                        <FaExclamationTriangle />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Safety Reports Queue</div>
                        <div className="text-[11px] text-slate-400">
                          {stats?.queues?.pendingReports} pending moderation
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-purple-400 font-bold">Triage →</span>
                  </div>

                  <div
                    onClick={() => setActiveTab("broadcast")}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between ${
                      isDark ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                        <FaBullhorn />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Dispatch Platform Broadcast</div>
                        <div className="text-[11px] text-slate-400">Reach all active users</div>
                      </div>
                    </div>
                    <span className="text-xs text-purple-400 font-bold">Send →</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 text-xs text-slate-400">
                Admin Session Active • All actions are logged and audited.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER & VERIFICATION CENTER */}
        {activeTab === "users" && (
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? "bg-slate-900/90 border-slate-800 text-white" : "bg-white border-slate-200 shadow-md"
            }`}
          >
            {/* Header & Search Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>👥</span>
                  <span>User & Verification Directory</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Manage accounts, review KYC documents, FSSAI licenses, and verify organizations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                {/* Search Bar */}
                <div
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border ${
                    isDark ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <FaSearch className="text-slate-400 text-xs" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="bg-transparent border-none outline-none text-xs sm:text-sm w-44 sm:w-60"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className={`text-xs font-semibold px-3 py-2 rounded-2xl border cursor-pointer ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="all">All Roles</option>
                  <option value="restaurant">Restaurants</option>
                  <option value="ngo">NGOs</option>
                  <option value="individual">Individuals</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800/60">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? "bg-slate-950/60 text-slate-400" : "bg-slate-50 text-slate-600"
                  }`}
                >
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Verification</th>
                    <th className="p-3.5">Activity</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-medium">
                  {users.map((u) => {
                    const displayName =
                      u.restaurantProfile?.restaurantName ||
                      u.ngoProfile?.ngoName ||
                      u.individualProfile?.name ||
                      u.email?.split("@")[0];

                    const fssai = u.restaurantProfile?.fssaiStatus;
                    const darpan = u.ngoProfile?.registrationStatus;
                    const govtId = u.individualProfile?.govtIdStatus;

                    const hasPendingDoc =
                      fssai === "pending" || darpan === "pending" || govtId === "pending";

                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors ${
                          isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                        }`}
                      >
                        {/* User Identity */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center text-sm border border-purple-500/30">
                              {displayName?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <div className="font-bold text-slate-100">{displayName}</div>
                              <div className="text-xs text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase ${
                              u.role === "restaurant"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : u.role === "ngo"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : u.role === "admin"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-slate-700/30 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        {/* Verification Badges */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {fssai && (
                              <button
                                onClick={() => setSelectedUserForVerification(u)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                                  fssai === "verified"
                                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60"
                                    : fssai === "pending"
                                    ? "bg-amber-950/40 text-amber-400 border-amber-800/60 animate-pulse"
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                                }`}
                              >
                                FSSAI: {fssai}
                              </button>
                            )}

                            {darpan && (
                              <button
                                onClick={() => setSelectedUserForVerification(u)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                                  darpan === "verified"
                                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60"
                                    : darpan === "pending"
                                    ? "bg-amber-950/40 text-amber-400 border-amber-800/60 animate-pulse"
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                                }`}
                              >
                                Darpan: {darpan}
                              </button>
                            )}

                            {govtId && (
                              <button
                                onClick={() => setSelectedUserForVerification(u)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                                  govtId === "verified"
                                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60"
                                    : govtId === "pending"
                                    ? "bg-amber-950/40 text-amber-400 border-amber-800/60 animate-pulse"
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                                }`}
                              >
                                ID: {govtId}
                              </button>
                            )}

                            {!fssai && !darpan && !govtId && (
                              <span className="text-xs text-slate-500">Unverified</span>
                            )}
                          </div>
                        </td>

                        {/* Counts */}
                        <td className="p-3.5 text-xs text-slate-400">
                          <div>🍲 {u._count?.foods || 0} listings</div>
                          <div>📦 {u._count?.reservationsPlaced || 0} reservations</div>
                        </td>

                        {/* Status Toggle */}
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                              u.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {u.isActive ? "Active" : "Suspended"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedUserForVerification(u)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                              title="Audit KYC / Documents"
                            >
                              Audit
                            </button>

                            <button
                              onClick={() => handleToggleUserActive(u.id, u.isActive)}
                              disabled={actionLoadingId === u.id}
                              className={`p-2 rounded-xl text-xs border transition-colors ${
                                u.isActive
                                  ? "bg-rose-950/30 text-rose-400 border-rose-800/50 hover:bg-rose-900/50"
                                  : "bg-emerald-950/30 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/50"
                              }`}
                              title={u.isActive ? "Suspend User" : "Activate User"}
                            >
                              {u.isActive ? <FaBan /> : <FaCheck />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Document Verification Drawer / Modal */}
            <AnimatePresence>
              {selectedUserForVerification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl ${
                      isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-bold flex items-center gap-2">
                        <span>🛡️</span>
                        <span>Document Verification & Audit</span>
                      </h4>
                      <button
                        onClick={() => setSelectedUserForVerification(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700 mb-4 text-xs">
                      <div className="font-bold text-sm text-purple-400">
                        {selectedUserForVerification.email}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        Role: <span className="uppercase">{selectedUserForVerification.role}</span>
                      </div>
                    </div>

                    {/* Restaurant FSSAI Section */}
                    {selectedUserForVerification.role === "restaurant" && (
                      <div className="p-4 rounded-2xl border border-slate-700/60 mb-4 space-y-3">
                        <div className="text-xs font-bold uppercase text-amber-400">
                          FSSAI License & Certificate
                        </div>
                        <div className="text-xs">
                          License Number:{" "}
                          <span className="font-mono font-bold">
                            {selectedUserForVerification.restaurantProfile?.fssaiLicense || "Not provided"}
                          </span>
                        </div>
                        <div className="text-xs">
                          Status:{" "}
                          <span className="font-bold uppercase text-amber-400">
                            {selectedUserForVerification.restaurantProfile?.fssaiStatus || "unverified"}
                          </span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() =>
                              handleUpdateVerification(selectedUserForVerification.id, "fssai", "verified")
                            }
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                          >
                            <FaCheck />
                            <span>Approve FSSAI</span>
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateVerification(selectedUserForVerification.id, "fssai", "rejected")
                            }
                            className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                          >
                            <FaTimesCircle />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* NGO Darpan Section */}
                    {selectedUserForVerification.role === "ngo" && (
                      <div className="p-4 rounded-2xl border border-slate-700/60 mb-4 space-y-3">
                        <div className="text-xs font-bold uppercase text-emerald-400">
                          NITI Aayog Darpan & 80G Certificate
                        </div>
                        <div className="text-xs">
                          Registration ID:{" "}
                          <span className="font-mono font-bold">
                            {selectedUserForVerification.ngoProfile?.registrationId || "Not provided"}
                          </span>
                        </div>
                        <div className="text-xs">
                          Status:{" "}
                          <span className="font-bold uppercase text-emerald-400">
                            {selectedUserForVerification.ngoProfile?.registrationStatus || "unverified"}
                          </span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() =>
                              handleUpdateVerification(selectedUserForVerification.id, "darpan", "verified")
                            }
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                          >
                            <FaCheck />
                            <span>Approve Darpan</span>
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateVerification(selectedUserForVerification.id, "darpan", "rejected")
                            }
                            className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                          >
                            <FaTimesCircle />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Individual Govt ID */}
                    {selectedUserForVerification.role === "individual" && (
                      <div className="p-4 rounded-2xl border border-slate-700/60 mb-4 space-y-3">
                        <div className="text-xs font-bold uppercase text-indigo-400">
                          Govt ID & Food Safety Pledge
                        </div>
                        <div className="text-xs">
                          Status:{" "}
                          <span className="font-bold uppercase text-indigo-400">
                            {selectedUserForVerification.individualProfile?.govtIdStatus || "unverified"}
                          </span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() =>
                              handleUpdateVerification(selectedUserForVerification.id, "govtId", "verified")
                            }
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                          >
                            <FaCheck />
                            <span>Approve ID</span>
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateVerification(selectedUserForVerification.id, "govtId", "rejected")
                            }
                            className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                          >
                            <FaTimesCircle />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedUserForVerification(null)}
                      className="w-full py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      Close Audit Drawer
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB 3: FOOD SURPLUS MODERATION */}
        {activeTab === "listings" && (
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? "bg-slate-900/90 border-slate-800 text-white" : "bg-white border-slate-200 shadow-md"
            }`}
          >
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>🍲</span>
                  <span>Food Surplus Moderation Hub</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Inspect listings, verify freshness guidelines, force expire or delist policy violations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border ${
                    isDark ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <FaSearch className="text-slate-400 text-xs" />
                  <input
                    type="text"
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    placeholder="Search food title, supplier, address..."
                    className="bg-transparent border-none outline-none text-xs sm:text-sm w-44 sm:w-60"
                  />
                </div>

                <select
                  value={listingStatusFilter}
                  onChange={(e) => setListingStatusFilter(e.target.value)}
                  className={`text-xs font-semibold px-3 py-2 rounded-2xl border cursor-pointer ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Available</option>
                  <option value="expired">Expired / Inactive</option>
                  <option value="donations">Donations Only</option>
                  <option value="paid">Discounted Only</option>
                </select>
              </div>
            </div>

            {/* Listings Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800/60">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? "bg-slate-950/60 text-slate-400" : "bg-slate-50 text-slate-600"
                  }`}
                >
                  <tr>
                    <th className="p-3.5">Food Listing</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5">Portions / Pricing</th>
                    <th className="p-3.5">Expiry Window</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-medium">
                  {listings.map((f) => {
                    const isExpired = new Date(f.expiresAt) <= new Date() || !f.isActive;
                    const supplierName =
                      f.supplier?.restaurantProfile?.restaurantName ||
                      f.supplier?.individualProfile?.name ||
                      f.supplier?.email?.split("@")[0];

                    return (
                      <tr
                        key={f.id}
                        className={`transition-colors ${
                          isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="p-3.5">
                          <div className="font-bold text-slate-100">{f.name}</div>
                          <div className="text-xs text-slate-400 truncate max-w-xs">
                            {f.pickupAddress || "No address provided"}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-slate-200">{supplierName}</div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400">
                            {f.supplier?.role}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold">
                            {f.quantity} {f.quantityUnit}
                          </div>
                          <div className="text-xs text-slate-400">
                            {f.isDonation ? "Free Donation 🎁" : `₹${f.price} / portion`}
                          </div>
                        </td>

                        <td className="p-3.5 text-xs text-slate-300">
                          {formatDate(f.expiresAt)}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                              !isExpired
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-slate-700/40 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {!isExpired ? "Available" : "Expired / Inactive"}
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isExpired ? (
                              <button
                                onClick={() => handleListingAction(f.id, "force_expire")}
                                disabled={actionLoadingId === f.id}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-950/40 text-amber-400 border border-amber-800/60 hover:bg-amber-900/60 transition-colors"
                              >
                                Force Expire
                              </button>
                            ) : (
                              <button
                                onClick={() => handleListingAction(f.id, "restore")}
                                disabled={actionLoadingId === f.id}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60 transition-colors"
                              >
                                Restore
                              </button>
                            )}

                            <button
                              onClick={() => handleListingAction(f.id, "delete")}
                              disabled={actionLoadingId === f.id}
                              className="p-2 rounded-xl text-xs bg-rose-950/40 text-rose-400 border border-rose-800/60 hover:bg-rose-900/60 transition-colors"
                              title="Delete listing"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: RESERVATION & PICKUP AUDIT */}
        {activeTab === "reservations" && (
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? "bg-slate-900/90 border-slate-800 text-white" : "bg-white border-slate-200 shadow-md"
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>📦</span>
                  <span>Reservation & Pickup Audit Ledger</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Track full transaction cycles, pickup verification codes, and handle dispute overrides.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border ${
                    isDark ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <FaSearch className="text-slate-400 text-xs" />
                  <input
                    type="text"
                    value={reservationSearch}
                    onChange={(e) => setReservationSearch(e.target.value)}
                    placeholder="Search by pickup code, food, user..."
                    className="bg-transparent border-none outline-none text-xs sm:text-sm w-44 sm:w-60"
                  />
                </div>

                <select
                  value={reservationStatusFilter}
                  onChange={(e) => setReservationStatusFilter(e.target.value)}
                  className={`text-xs font-semibold px-3 py-2 rounded-2xl border cursor-pointer ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="all">All Statuses</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800/60">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? "bg-slate-950/60 text-slate-400" : "bg-slate-50 text-slate-600"
                  }`}
                >
                  <tr>
                    <th className="p-3.5">Pickup Code</th>
                    <th className="p-3.5">Food Item</th>
                    <th className="p-3.5">Claimer</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Admin Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-medium">
                  {reservations.map((r) => (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-sm px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {r.pickupCode || "N/A"}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-100">{r.food?.name}</div>
                        <div className="text-xs text-slate-400">{r.quantity} portions</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">
                          {r.reserver?.individualProfile?.name || r.reserver?.email}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">{r.reserver?.role}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">
                          {r.supplier?.restaurantProfile?.restaurantName ||
                            r.supplier?.individualProfile?.name ||
                            r.supplier?.email}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">{r.supplier?.role}</div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                            r.status === "picked_up"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : r.status === "confirmed"
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : r.status === "cancelled"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status !== "picked_up" && (
                            <button
                              onClick={() => handleReservationAction(r.id, "picked_up")}
                              disabled={actionLoadingId === r.id}
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              Force Complete
                            </button>
                          )}

                          {r.status !== "cancelled" && (
                            <button
                              onClick={() => handleReservationAction(r.id, "cancelled")}
                              disabled={actionLoadingId === r.id}
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
                            >
                              Cancel & Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SAFETY REPORTS & MODERATION */}
        {activeTab === "reports" && (
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? "bg-slate-900/90 border-slate-800 text-white" : "bg-white border-slate-200 shadow-md"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Safety Reports & Flag Moderation</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Review safety violations, misleading food listings, and community flags.
                </p>
              </div>
            </div>

            {reports.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400">
                <FaCheckCircle className="text-4xl text-emerald-400 mx-auto mb-2" />
                <p className="font-bold">Zero active reports in the moderation queue!</p>
                <p className="text-xs mt-1">Platform community standards are strictly maintained.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isDark ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {rep.reason}
                        </span>
                        <span className="text-xs text-slate-400">
                          Reported: {formatDate(rep.createdAt)}
                        </span>
                      </div>
                      <div className="font-bold text-slate-100 text-sm">
                        Item: {rep.food?.name || "Deleted Food Item"}
                      </div>
                      <div className="text-xs text-slate-300 italic mt-0.5">
                        &ldquo;{rep.details || "No details provided"}&rdquo;
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReportAction(rep.id, "actioned")}
                        disabled={actionLoadingId === rep.id}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
                      >
                        Delist & Action
                      </button>

                      <button
                        onClick={() => handleReportAction(rep.id, "dismissed")}
                        disabled={actionLoadingId === rep.id}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: BROADCAST SYSTEM ALERTS */}
        {activeTab === "broadcast" && (
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? "bg-slate-900/90 border-slate-800 text-white" : "bg-white border-slate-200 shadow-md"
            }`}
          >
            <div className="mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>📢</span>
                <span>System Broadcast & Emergency Alerts</span>
              </h3>
              <p className="text-xs text-slate-400">
                Dispatch platform-wide notifications or role-specific announcements directly to user inboxes.
              </p>
            </div>

            <form onSubmit={handleSendBroadcast} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Input (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Alert Title
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Scheduled Maintenance Notice / Severe Weather Surplus Request"
                    className={`w-full text-sm px-4 py-3 rounded-2xl border outline-none ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-white focus:border-purple-500"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Target Audience
                    </label>
                    <select
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value as any)}
                      className={`w-full text-sm px-3.5 py-3 rounded-2xl border cursor-pointer ${
                        isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      }`}
                    >
                      <option value="all">All Users (Universal)</option>
                      <option value="restaurant">Restaurants Only</option>
                      <option value="ngo">NGOs Only</option>
                      <option value="individual">Individuals Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Priority Level
                    </label>
                    <select
                      value={broadcastPriority}
                      onChange={(e) => setBroadcastPriority(e.target.value as any)}
                      className={`w-full text-sm px-3.5 py-3 rounded-2xl border cursor-pointer ${
                        isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      }`}
                    >
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent / Emergency</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Announcement Content
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Provide clear details and any instructions for recipients..."
                    className={`w-full text-sm px-4 py-3 rounded-2xl border outline-none ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-white focus:border-purple-500"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500"
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={broadcastSending || !broadcastTitle || !broadcastMessage}
                  className="w-full py-3.5 px-4 rounded-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-lg shadow-purple-600/30 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                >
                  <FaBullhorn />
                  <span>{broadcastSending ? "Dispatching Broadcast..." : "Dispatch Broadcast Alert"}</span>
                </button>

                {broadcastSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <FaCheckCircle />
                    <span>{broadcastSuccess}</span>
                  </div>
                )}
              </div>

              {/* Live Preview Card (5 cols) */}
              <div
                className={`lg:col-span-5 p-5 rounded-2xl border flex flex-col justify-between ${
                  isDark ? "bg-slate-800/30 border-slate-700/60" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div>
                  <div className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center justify-between">
                    <span>Live Notification Preview</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 uppercase font-bold">
                      {broadcastPriority}
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border shadow-md ${
                      isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold">
                        📢
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-100">
                          {broadcastTitle || "AnnoSetu Platform Announcement"}
                        </div>
                        <div className="text-[10px] text-slate-400">Just now • System Broadcast</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {broadcastMessage ||
                        "Preview message content will render here in real-time as you compose your broadcast announcement."}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mt-4 border-t border-slate-700/40 pt-3">
                  Delivered via real-time WebSocket stream & persistent Notification Center.
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
