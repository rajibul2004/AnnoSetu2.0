"use client";

import React, { useState } from "react";
import {
  FaUtensils,
  FaPlus,
  FaTimes,
  FaLeaf,
  FaCheck,
  FaExclamationCircle,
  FaHeartbeat,
  FaLightbulb,
} from "react-icons/fa";

interface PredefinedTag {
  id: string;
  label: string;
  emoji: string;
  category: "diet" | "allergen" | "lifestyle" | "health";
  description: string;
}

const PREDEFINED_TAGS: PredefinedTag[] = [
  { id: "vegetarian", label: "Vegetarian", emoji: "🥦", category: "diet", description: "Plant-based foods with dairy" },
  { id: "vegan", label: "Vegan", emoji: "🌱", category: "diet", description: "100% plant foods, no dairy or animal byproducts" },
  { id: "gluten_free", label: "Gluten-Free", emoji: "🌾", category: "allergen", description: "No wheat, barley, rye, or gluten grains" },
  { id: "halal", label: "Halal", emoji: "☪️", category: "diet", description: "Prepared according to Islamic dietary laws" },
  { id: "jain", label: "Jain Food", emoji: "🌿", category: "diet", description: "Pure vegetarian with no root vegetables (potatoes, onions, garlic)" },
  { id: "dairy_free", label: "Dairy-Free", emoji: "🥛", category: "allergen", description: "No milk, paneer, butter, curd, or lactose" },
  { id: "nut_free", label: "Nut-Free / Peanut-Safe", emoji: "🥜", category: "allergen", description: "Safe for individuals with nut or peanut allergies" },
  { id: "egg_free", label: "Egg-Free", emoji: "🥚", category: "allergen", description: "Contains no eggs or egg derivative ingredients" },
  { id: "high_protein", label: "High Protein", emoji: "💪", category: "lifestyle", description: "Protein-rich meals suited for fitness & nutrition" },
  { id: "low_calorie", label: "Low Calorie", emoji: "🥗", category: "health", description: "Light balanced meals with reduced calories" },
  { id: "diabetic_friendly", label: "Diabetic-Friendly", emoji: "🩺", category: "health", description: "Low glycemic index, no refined sugars" },
  { id: "keto", label: "Keto / Low-Carb", emoji: "🥑", category: "lifestyle", description: "Very low carbohydrate and healthy fats" },
  { id: "satvik", label: "Satvik / Ayurvedic", emoji: "🕉️", category: "lifestyle", description: "Fresh, pure, seasonal, soothing yogic preparation" },
  { id: "organic", label: "100% Organic", emoji: "🍎", category: "lifestyle", description: "Farm fresh pesticide-free certified organic produce" },
];

interface CustomDietaryTagManagerProps {
  selectedTags: string[];
  customTags: string[];
  onChange: (selectedTags: string[], customTags: string[]) => void;
}

export default function CustomDietaryTagManager({
  selectedTags = [],
  customTags = [],
  onChange,
}: CustomDietaryTagManagerProps) {
  const [newTagInput, setNewTagInput] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");

  const handleTogglePredefined = (tagId: string) => {
    const isSelected = selectedTags.includes(tagId);
    const updated = isSelected
      ? selectedTags.filter((t) => t !== tagId)
      : [...selectedTags, tagId];
    onChange(updated, customTags);
  };

  const handleAddCustomTag = () => {
    const clean = newTagInput.trim();
    if (!clean) return;

    // Avoid duplicates
    if (customTags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setNewTagInput("");
      return;
    }
    if (selectedTags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setNewTagInput("");
      return;
    }

    const updatedCustom = [...customTags, clean];
    onChange(selectedTags, updatedCustom);
    setNewTagInput("");
  };

  const handleRemoveCustomTag = (tagToRemove: string) => {
    const updated = customTags.filter((t) => t !== tagToRemove);
    onChange(selectedTags, updated);
  };

  const filteredPredefined =
    activeCategoryFilter === "all"
      ? PREDEFINED_TAGS
      : PREDEFINED_TAGS.filter((t) => t.category === activeCategoryFilter);

  const totalActive = selectedTags.length + customTags.length;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/20">
            <FaUtensils className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Dietary Preferences & Allergy Tags
              {totalActive > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {totalActive} Selected
                </span>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Personalize recommendations, volunteer dietary alerts, and donation food filters.
            </p>
          </div>
        </div>
      </div>

      {/* Custom Tag Creator Bar */}
      <div className="bg-emerald-50/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-emerald-100 dark:border-slate-700/60 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
            <FaLightbulb className="text-amber-500" />
            Add Custom Dietary Tag or Specific Allergen
          </label>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            e.g. &quot;No Garlic/Onion&quot;, &quot;Soy Allergy&quot;, &quot;PCOS Friendly&quot;
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomTag();
              }
            }}
            placeholder="Type your custom dietary requirement or allergy and press Enter..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleAddCustomTag}
            disabled={!newTagInput.trim()}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
          >
            <FaPlus className="text-xs" />
            Add Tag
          </button>
        </div>

        {/* Display Active Custom Tags */}
        {customTags.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mr-1">
              Your Custom Tags:
            </span>
            {customTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 shadow-sm animate-fadeIn"
              >
                <FaLeaf className="text-[10px] text-emerald-500" />
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveCustomTag(tag)}
                  className="p-0.5 rounded-full hover:bg-emerald-100 dark:hover:bg-slate-700 text-gray-400 hover:text-rose-500 transition-colors ml-0.5"
                  title="Remove tag"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Predefined Categories Filter */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <FaHeartbeat className="text-rose-500" />
            Standard Dietary Categories
          </h4>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-900/60 p-1 rounded-xl text-xs font-medium">
            {[
              { id: "all", label: "All Tags" },
              { id: "diet", label: "Diets" },
              { id: "allergen", label: "Allergens" },
              { id: "health", label: "Health" },
              { id: "lifestyle", label: "Lifestyle" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeCategoryFilter === cat.id
                    ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Predefined Grid Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPredefined.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTogglePredefined(tag.id)}
                className={`text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-sm"
                    : "bg-white dark:bg-slate-800/60 border-gray-200 dark:border-slate-700/80 hover:border-gray-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl shrink-0">{tag.emoji}</span>
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      {tag.label}
                      {tag.category === "allergen" && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">
                          Allergen
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                      {tag.description}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    isSelected
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-gray-300 dark:border-slate-600 text-transparent"
                  }`}
                >
                  <FaCheck className="text-[9px]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
