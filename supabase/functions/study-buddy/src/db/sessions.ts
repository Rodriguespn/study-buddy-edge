/**
 * Database operations for study sessions.
 * Accepts SupabaseClient as first parameter for RLS enforcement.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CardResult,
  CreateStudySessionInput,
  Difficulty,
  Language,
  StudySession,
} from "../shared/types.ts";

export type SearchSessionsFilters = {
  language?: Language;
  difficulty?: Difficulty;
  completedOnly?: boolean;
};

/**
 * Create a new study session.
 * Called at the start of a study session.
 */
export async function createStudySession(
  supabase: SupabaseClient,
  input: CreateStudySessionInput
): Promise<StudySession> {
  const { data, error } = await supabase
    .from("study_sessions")
    .insert({
      user_id: input.user_id,
      language: input.language,
      difficulty: input.difficulty,
      topic: input.topic,
      total_cards: input.total_cards,
      correct_answers: 0,
      incorrect_answers: 0,
      card_results: [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create study session: ${error.message}`);
  }

  return data as StudySession;
}

/**
 * Complete a study session with results.
 * Called at the end of a study session.
 */
export async function completeStudySession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  results: {
    correct_answers: number;
    incorrect_answers: number;
    card_results: CardResult[];
  }
): Promise<StudySession> {
  const { data, error } = await supabase
    .from("study_sessions")
    .update({
      correct_answers: results.correct_answers,
      incorrect_answers: results.incorrect_answers,
      card_results: results.card_results,
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to complete study session: ${error.message}`);
  }

  return data as StudySession;
}

/**
 * Get a study session by ID.
 */
export async function getStudySessionById(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<StudySession | null> {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch study session: ${error.message}`);
  }

  return data as StudySession;
}

/**
 * Get user's study session history with optional filters.
 * Returns sessions ordered by most recent first.
 */
export async function getUserStudySessions(
  supabase: SupabaseClient,
  userId: string,
  filters?: SearchSessionsFilters,
  limit = 50
): Promise<StudySession[]> {
  let query = supabase.from("study_sessions").select("*").eq("user_id", userId);

  if (filters?.language) {
    query = query.eq("language", filters.language);
  }

  if (filters?.difficulty) {
    query = query.eq("difficulty", filters.difficulty);
  }

  if (filters?.completedOnly) {
    query = query.not("completed_at", "is", null);
  }

  const { data, error } = await query
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch user sessions: ${error.message}`);
  }

  return data as StudySession[];
}

/**
 * Get aggregated statistics for a user.
 * Returns stats per language and difficulty.
 */
export async function getUserStats(
  supabase: SupabaseClient,
  userId: string,
  filters?: { language?: Language; difficulty?: Difficulty }
): Promise<{
  totalSessions: number;
  completedSessions: number;
  averageAccuracy: number;
  totalCardsStudied: number;
  sessionsByLanguage: Record<Language, number>;
  sessionsByDifficulty: Record<Difficulty, number>;
}> {
  let query = supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", userId)
    .not("completed_at", "is", null);

  if (filters?.language) {
    query = query.eq("language", filters.language);
  }

  if (filters?.difficulty) {
    query = query.eq("difficulty", filters.difficulty);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch user stats: ${error.message}`);
  }

  const sessions = data as StudySession[];

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.completed_at !== null).length;
  const totalCardsStudied = sessions.reduce((sum, s) => sum + s.total_cards, 0);
  const averageAccuracy =
    totalSessions > 0
      ? sessions.reduce((sum, s) => sum + s.accuracy_percentage, 0) / totalSessions
      : 0;

  const sessionsByLanguage: Record<Language, number> = {
    spanish: 0,
    french: 0,
    german: 0,
    italian: 0,
    portuguese: 0,
  };
  const sessionsByDifficulty: Record<Difficulty, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  };

  for (const session of sessions) {
    sessionsByLanguage[session.language]++;
    sessionsByDifficulty[session.difficulty]++;
  }

  return {
    totalSessions,
    completedSessions,
    averageAccuracy: Math.round(averageAccuracy * 100) / 100,
    totalCardsStudied,
    sessionsByLanguage,
    sessionsByDifficulty,
  };
}
