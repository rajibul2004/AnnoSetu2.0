"use client";

import React, { useState, useRef } from "react";
import {
  FaFileUpload,
  FaFilePdf,
  FaFileImage,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTimesCircle,
  FaExternalLinkAlt,
  FaShieldAlt,
  FaCertificate,
  FaBuilding,
  FaIdCard,
  FaTrashAlt,
  FaMagic,
} from "react-icons/fa";
import { UserRole, VerificationStatus } from "@/types/profile";

interface DocumentVerificationSectionProps {
  userRole: UserRole;
  profileData: {
    foodSafetyDoc?: string | null;
    foodSafetyStatus?: VerificationStatus;
    fssaiLicense?: string | null;
    fssaiDocument?: string | null;
    fssaiStatus?: VerificationStatus;
    gstNumber?: string | null;
    gstDocument?: string | null;
    gstStatus?: VerificationStatus;
    registrationId?: string | null;
    registrationDoc?: string | null;
    registrationStatus?: VerificationStatus;
    taxExemptionDoc?: string | null;
    taxExemptionStatus?: VerificationStatus;
    govtIdDoc?: string | null;
    govtIdStatus?: VerificationStatus;
  };
  onDocumentChange: (key: string, file: File | null, instantVerify?: boolean) => void;
  isSaving?: boolean;
}

interface DocSlotConfig {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  docUrl?: string | null;
  status?: VerificationStatus;
  icon: React.ReactNode;
  accept: string;
  requirementNotes: string;
}

export default function DocumentVerificationSection({
  userRole,
  profileData,
  onDocumentChange,
  isSaving,
}: DocumentVerificationSectionProps) {
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [localFiles, setLocalFiles] = useState<Record<string, { file: File; preview: string }>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Configure slots per role
  const slots: DocSlotConfig[] = [];

  // 1. Food Safety Certificate (Universal across all roles)
  slots.push({
    key: "foodSafetyDoc",
    title: "Food Safety & Hygiene Handling Certificate",
    subtitle: "HACCP / FoSTaC / FSSAI Food Safety Training or Audit Report",
    description: "Upload certificate confirming safe temperature control, hygiene standards, and food packing integrity.",
    docUrl: profileData.foodSafetyDoc,
    status: profileData.foodSafetyStatus ?? "unverified",
    icon: <FaShieldAlt className="text-emerald-500 text-xl" />,
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    requirementNotes: "Must show valid certification date, accredited issuing body, or kitchen audit seal.",
  });

  // 2. Restaurant specific: FSSAI & GST
  if (userRole === "restaurant") {
    slots.push({
      key: "fssaiDocument",
      title: "FSSAI Food Business License Certificate",
      subtitle: `License No: ${profileData.fssaiLicense || "Not specified"}`,
      description: "Official Food Safety and Standards Authority of India 14-digit license certificate copy.",
      docUrl: profileData.fssaiDocument,
      status: profileData.fssaiStatus ?? "unverified",
      icon: <FaCertificate className="text-amber-500 text-xl" />,
      accept: ".pdf,.jpg,.jpeg,.png",
      requirementNotes: "14-digit FSSAI registration number and valid expiration date must be legible.",
    });

    slots.push({
      key: "gstDocument",
      title: "GST / Trade License Document",
      subtitle: `GSTIN: ${profileData.gstNumber || "Not specified"}`,
      description: "Certificate of GST registration or municipal trade license proving commercial establishment.",
      docUrl: profileData.gstDocument,
      status: profileData.gstStatus ?? "unverified",
      icon: <FaBuilding className="text-blue-500 text-xl" />,
      accept: ".pdf,.jpg,.jpeg,.png",
      requirementNotes: "State/Central commercial tax GSTIN certificate matching restaurant trade name.",
    });
  }

  // 3. NGO specific: NGO Darpan / 80G Tax Exemption
  if (userRole === "ngo") {
    slots.push({
      key: "registrationDoc",
      title: "NGO Darpan / Registration Certificate",
      subtitle: `Reg ID: ${profileData.registrationId || "Not specified"}`,
      description: "NITI Aayog NGO Darpan unique ID certificate or Societies/Trusts Registration Act certificate.",
      docUrl: profileData.registrationDoc,
      status: profileData.registrationStatus ?? "unverified",
      icon: <FaBuilding className="text-purple-500 text-xl" />,
      accept: ".pdf,.jpg,.jpeg,.png",
      requirementNotes: "Official society/trust deed registration certificate or NITI Aayog portal slip.",
    });

    slots.push({
      key: "taxExemptionDoc",
      title: "80G / 12A Tax Exemption Certificate",
      subtitle: "Income Tax Exemption Approval",
      description: "Certificates under Section 80G & 12A of the Income Tax Act for tax-deductible donor receipts.",
      docUrl: profileData.taxExemptionDoc,
      status: profileData.taxExemptionStatus ?? "unverified",
      icon: <FaCertificate className="text-indigo-500 text-xl" />,
      accept: ".pdf,.jpg,.jpeg,.png",
      requirementNotes: "Active 80G approval order from Commissioner of Income Tax.",
    });
  }

  // 4. Individual specific: Govt ID Verification
  if (userRole === "individual") {
    slots.push({
      key: "govtIdDoc",
      title: "Government Photo Identity Proof",
      subtitle: "Aadhaar / Voter ID / Passport / Driving License",
      description: "Verify your identity to earn the Verified Community Donor badge and build recipient trust.",
      docUrl: profileData.govtIdDoc,
      status: profileData.govtIdStatus ?? "unverified",
      icon: <FaIdCard className="text-sky-500 text-xl" />,
      accept: ".pdf,.jpg,.jpeg,.png",
      requirementNotes: "Clear front/back image showing full name matching your profile.",
    });
  }

  const handleFileSelect = (key: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit. Please choose a smaller file.");
      return;
    }
    const isImage = file.type.startsWith("image/");
    const preview = isImage ? URL.createObjectURL(file) : "";
    setLocalFiles((prev) => ({ ...prev, [key]: { file, preview } }));
    onDocumentChange(key, file, false);
  };

  const handleRemoveLocal = (key: string) => {
    setLocalFiles((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    onDocumentChange(key, null, false);
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = "";
    }
  };

  const renderStatusBadge = (status?: VerificationStatus) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <FaCheckCircle className="text-emerald-600 dark:text-emerald-400" />
            Verified & Active
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <FaClock className="text-amber-600 dark:text-amber-400 animate-pulse" />
            Under Verification Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <FaTimesCircle className="text-rose-600 dark:text-rose-400" />
            Rejected - Resubmit
          </span>
        );
      case "unverified":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
            <FaExclamationTriangle className="text-gray-400" />
            Not Uploaded
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaShieldAlt className="text-emerald-500" />
            Compliance & Document Verification
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload official certificates to earn verified trust seals on your profile and listings.
          </p>
        </div>
      </div>

      {/* Document Slots */}
      <div className="grid grid-cols-1 gap-5">
        {slots.map((slot) => {
          const localFile = localFiles[slot.key];
          const hasExisting = Boolean(slot.docUrl);
          const isVerified = slot.status === "verified";

          return (
            <div
              key={slot.key}
              className={`rounded-2xl border p-5 transition-all ${
                isVerified
                  ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/60"
                  : "bg-white dark:bg-slate-800/80 border-gray-200 dark:border-slate-700"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Info */}
                <div className="flex items-start gap-3.5 max-w-xl">
                  <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 shrink-0">
                    {slot.icon}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                        {slot.title}
                      </h4>
                      {renderStatusBadge(slot.status)}
                    </div>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                      {slot.subtitle}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                      {slot.description}
                    </p>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Requirement:</span>
                      {slot.requirementNotes}
                    </div>
                  </div>
                </div>

                {/* Actions & Upload Area */}
                <div className="flex flex-col items-end gap-2.5 shrink-0">
                  {/* Existing Document Link */}
                  {hasExisting && (
                    <div className="flex items-center gap-2">
                      <a
                        href={slot.docUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                      >
                        <FaExternalLinkAlt className="text-[10px]" />
                        View Stored Certificate
                      </a>
                    </div>
                  )}

                  {/* Local Selected File indicator */}
                  {localFile && (
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/50 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                      {localFile.file.type.includes("pdf") ? <FaFilePdf /> : <FaFileImage />}
                      <span className="font-medium truncate max-w-[140px]">{localFile.file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLocal(slot.key)}
                        className="text-rose-500 hover:text-rose-700 ml-1"
                        title="Remove file"
                      >
                        <FaTrashAlt className="text-[11px]" />
                      </button>
                    </div>
                  )}

                  {/* Upload Drop Button */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={(el) => {
                        fileInputRefs.current[slot.key] = el;
                      }}
                      type="file"
                      accept={slot.accept}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(slot.key, file);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[slot.key]?.click()}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-all shadow-sm"
                    >
                      <FaFileUpload className="text-emerald-500" />
                      {hasExisting ? "Upload New Copy" : "Select Document"}
                    </button>

                    {/* Instant Demo Verification Button */}
                    {!isVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          onDocumentChange(slot.key, localFile?.file || null, true);
                        }}
                        title="Instantly verify for demonstration & testing"
                        className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all"
                      >
                        <FaMagic className="text-emerald-500 text-[11px]" />
                        Instant Verify
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
