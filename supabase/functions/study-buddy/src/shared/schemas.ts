/**
 * Shared Zod schemas for the Study Buddy application
 * V1: Session-based learning with performance tracking
 */

import { z } from "zod";
import {
  type AnswerResult,
  type CardResult,
  type CompleteStudySessionInput,
  type CreateStudySessionInput,
  DIFFICULTIES,
  type Difficulty,
  type Flashcard,
  LANGUAGES,
  type Language,
  type StudySession,
  type StudySessionConfig,
} from "./types.ts";

/**
 * Schema for supported languages
 */
export const LanguageSchema: z.ZodType<Language> = z.enum(LANGUAGES as [Language, ...Language[]]);

/**
 * Schema for difficulty levels
 */
export const DifficultySchema: z.ZodType<Difficulty> = z.enum(
  DIFFICULTIES as [Difficulty, ...Difficulty[]]
);

/**
 * Schema for a single flashcard
 */
export const FlashcardSchema: z.ZodType<Flashcard> = z.object({
  prompt: z.string(),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
});

/**
 * Schema for an array of flashcards
 */
export const FlashcardDeckSchema: z.ZodType<Flashcard[]> = z.array(FlashcardSchema);

/**
 * Schema for study session configuration
 */
export const StudySessionConfigSchema: z.ZodType<StudySessionConfig> = z.object({
  language: LanguageSchema,
  difficulty: DifficultySchema,
  topic: z.string().min(1),
});

/**
 * Schema for answer validation result
 */
export const AnswerResultSchema: z.ZodType<AnswerResult> = z.object({
  isCorrect: z.boolean(),
  userAnswer: z.string(),
  correctAnswer: z.string(),
  similarity: z.number().min(0).max(1).optional(),
});

/**
 * Schema for a single card result
 */
export const CardResultSchema: z.ZodType<CardResult> = z.object({
  prompt: z.string(),
  correctAnswer: z.string(),
  userAnswer: z.string(),
  isCorrect: z.boolean(),
  attemptedAt: z.string(),
});

/**
 * Schema for a complete study session
 */
export const StudySessionSchema: z.ZodType<StudySession> = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  language: LanguageSchema,
  difficulty: DifficultySchema,
  topic: z.string(),
  total_cards: z.number().int().min(0),
  correct_answers: z.number().int().min(0),
  incorrect_answers: z.number().int().min(0),
  accuracy_percentage: z.number().min(0).max(100),
  started_at: z.string(),
  completed_at: z.string().nullable(),
  card_results: z.array(CardResultSchema),
});

/**
 * Schema for creating a new study session
 */
export const CreateStudySessionInputSchema: z.ZodType<CreateStudySessionInput> = z.object({
  user_id: z.string(),
  language: LanguageSchema,
  difficulty: DifficultySchema,
  topic: z.string().min(1),
  total_cards: z.number().int().min(1),
});

/**
 * Schema for completing a study session
 */
export const CompleteStudySessionInputSchema: z.ZodType<CompleteStudySessionInput> = z.object({
  correct_answers: z.number().int().min(0),
  incorrect_answers: z.number().int().min(0),
  card_results: z.array(CardResultSchema),
});

// Re-export constants for convenience
export { DIFFICULTIES, LANGUAGES } from "./types.ts";

// Re-export constants from types for convenience
export { CATEGORIES, DIFFICULTIES, LANGUAGES } from "./types.ts";
