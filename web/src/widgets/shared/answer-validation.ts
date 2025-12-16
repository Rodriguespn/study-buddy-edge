/**
 * Answer validation utilities for Study Buddy.
 * Provides tolerance for minor variations in user answers.
 */

import type { AnswerResult } from "@study-buddy/shared";

/**
 * Normalize a string for comparison.
 * Removes punctuation, normalizes whitespace, and converts to lowercase.
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"()[\]{}¿¡«»]/g, "") // Remove punctuation
    .replace(/\s+/g, " "); // Normalize whitespace
}

/**
 * Normalize a string and remove accent marks for fuzzy matching.
 */
function normalizeWithoutAccents(str: string): string {
  return normalizeForComparison(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove accent marks
}

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between 0 and 1.
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

/**
 * Validate a user's answer against the correct answer.
 * Provides tolerance for:
 * - Case differences
 * - Extra/missing punctuation
 * - Extra/missing whitespace
 * - Accent mark variations (partial tolerance)
 */
export function validateAnswer(userAnswer: string, correctAnswer: string): AnswerResult {
  // Exact match after basic normalization (preserving accents)
  const userNormalized = normalizeForComparison(userAnswer);
  const correctNormalized = normalizeForComparison(correctAnswer);

  if (userNormalized === correctNormalized) {
    return {
      isCorrect: true,
      userAnswer,
      correctAnswer,
      similarity: 1.0,
    };
  }

  // Match without accent marks (more lenient)
  const userNoAccents = normalizeWithoutAccents(userAnswer);
  const correctNoAccents = normalizeWithoutAccents(correctAnswer);

  if (userNoAccents === correctNoAccents) {
    return {
      isCorrect: true,
      userAnswer,
      correctAnswer,
      similarity: 0.95, // Slightly lower score for missing accents
    };
  }

  // Calculate similarity for feedback
  const similarity = calculateSimilarity(userNoAccents, correctNoAccents);

  return {
    isCorrect: false,
    userAnswer,
    correctAnswer,
    similarity,
  };
}

/**
 * Get feedback message based on similarity score.
 */
export function getSimilarityFeedback(similarity: number): string {
  if (similarity >= 0.9) {
    return "Very close! Just a small typo.";
  }
  if (similarity >= 0.7) {
    return "Almost there! Check your spelling.";
  }
  if (similarity >= 0.5) {
    return "Partially correct. Review the answer.";
  }
  return "";
}
