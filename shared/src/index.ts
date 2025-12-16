/**
 * @study-buddy/shared
 * Shared types and schemas for the Study Buddy application
 * V1: Session-based learning with performance tracking
 */

// Zod schemas
export {
  AnswerResultSchema,
  CardResultSchema,
  CompleteStudySessionInputSchema,
  CreateStudySessionInputSchema,
  DifficultySchema,
  FlashcardDeckSchema,
  FlashcardSchema,
  LanguageSchema,
  StudySessionConfigSchema,
  StudySessionSchema,
} from "./schemas.js";

// Types
export type {
  AnswerResult,
  CardResult,
  CompleteStudySessionInput,
  CreateStudySessionInput,
  Difficulty,
  Flashcard,
  Language,
  StudySession,
  StudySessionConfig,
} from "./types.js";

// Constants
export { DIFFICULTIES, LANGUAGES } from "./types.js";
