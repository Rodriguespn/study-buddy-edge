/**
 * UI-specific constants and utilities for flashcard widgets
 * V1: Session-based learning
 *
 * Core types (Language, Difficulty, Flashcard) are imported from @study-buddy/shared
 */

import type { Difficulty, Language } from "@study-buddy/shared";

export const languageNames: Record<Language, string> = {
  spanish: "Spanish",
  french: "French",
  german: "German",
  italian: "Italian",
  portuguese: "Portuguese",
};

export const difficultyColorStyles: Record<Difficulty, { from: string; to: string }> = {
  beginner: { from: "#4ade80", to: "#16a34a" },
  intermediate: { from: "#facc15", to: "#f97316" },
  advanced: { from: "#ef4444", to: "#b91c1c" },
};

export const difficultyLabels: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/**
 * Theme-aware styling tokens
 */
export const getThemeTokens = (theme?: string) => ({
  bg: theme === "dark" ? "bg-gray-900" : "bg-gray-50",
  surface: theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
  text: theme === "dark" ? "text-gray-100" : "text-gray-900",
  subtext: theme === "dark" ? "text-gray-400" : "text-gray-600",
  border: theme === "dark" ? "border-gray-700" : "border-gray-200",
  hover: theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100",
  input: theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300",
});
