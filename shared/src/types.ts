/**
 * Shared types for the Study Buddy application
 * V1: Session-based learning with performance tracking
 */

export type Language = "spanish" | "french" | "german" | "italian" | "portuguese";
export type Difficulty = "beginner" | "intermediate" | "advanced";

/**
 * A single flashcard with prompt, answer, and optional explanation
 */
export interface Flashcard {
  prompt: string;
  correctAnswer: string;
  explanation?: string;
}

/**
 * Configuration for starting a new study session
 */
export interface StudySessionConfig {
  language: Language;
  difficulty: Difficulty;
  topic: string;
}

/**
 * Result of validating a user's answer
 */
export interface AnswerResult {
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  similarity?: number;
}

/**
 * A single card result within a study session
 */
export interface CardResult {
  prompt: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  attemptedAt: string;
}

/**
 * A study session record stored in the database
 */
export interface StudySession {
  id: string;
  user_id: string;
  language: Language;
  difficulty: Difficulty;
  topic: string;
  total_cards: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy_percentage: number;
  started_at: string;
  completed_at: string | null;
  card_results: CardResult[];
}

/**
 * Input for creating a new study session
 */
export type CreateStudySessionInput = Pick<
  StudySession,
  "user_id" | "language" | "difficulty" | "topic" | "total_cards"
>;

/**
 * Input for completing a study session with results
 */
export interface CompleteStudySessionInput {
  correct_answers: number;
  incorrect_answers: number;
  card_results: CardResult[];
}

export const LANGUAGES: Language[] = ["spanish", "french", "german", "italian", "portuguese"];
export const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];
