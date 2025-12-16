/**
 * MCP tool/widget handlers for Study Buddy.
 * V1: Session-based learning with performance tracking.
 */

import type { CallToolResult } from "npm:@modelcontextprotocol/sdk@1.20.0/types.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardResult, Difficulty, Flashcard, Language } from "./shared/types.ts";
import {
  completeStudySession,
  createStudySession,
  getUserStats,
  getUserStudySessions,
} from "./db/sessions.ts";

/**
 * Handler context passed to all handlers.
 */
export interface HandlerContext {
  userId: string;
  supabase: SupabaseClient;
}

export type StartStudySessionInput = {
  language: Language;
  difficulty: Difficulty;
  topic: string;
  cards: Flashcard[];
};

export type SaveSessionResultsInput = {
  sessionId: string;
  correct_answers: number;
  incorrect_answers: number;
  card_results: CardResult[];
};

export type GetUserStatsInput = {
  language?: Language;
  difficulty?: Difficulty;
};

export type GetUserSessionsInput = {
  language?: Language;
  difficulty?: Difficulty;
  limit?: number;
};

/**
 * Start a new study session.
 * Creates a session record in the database and returns widget data.
 */
export async function handleStartStudySession(
  { language, difficulty, topic, cards }: StartStudySessionInput,
  ctx: HandlerContext
): Promise<CallToolResult> {
  try {
    const session = await createStudySession(ctx.supabase, {
      user_id: ctx.userId,
      language,
      difficulty,
      topic,
      total_cards: cards.length,
    });

    return {
      structuredContent: {
        sessionId: session.id,
        language,
        difficulty,
        topic,
        cards,
      },
      content: [
        {
          type: "text",
          text: `Study session started: ${cards.length} ${language} flashcards at ${difficulty} level on topic "${topic}". Session ID: ${session.id}. The widget displays interactive flashcards where users can attempt answers and receive feedback.`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error starting session: ${error}` }],
      isError: true,
    };
  }
}

/**
 * Save the results of a completed study session.
 */
export async function handleSaveSessionResults(
  { sessionId, correct_answers, incorrect_answers, card_results }: SaveSessionResultsInput,
  ctx: HandlerContext
): Promise<CallToolResult> {
  try {
    const session = await completeStudySession(ctx.supabase, sessionId, ctx.userId, {
      correct_answers,
      incorrect_answers,
      card_results,
    });

    return {
      structuredContent: {
        session,
      },
      content: [
        {
          type: "text",
          text: `Session completed! Results: ${correct_answers}/${session.total_cards} correct (${session.accuracy_percentage}% accuracy). Session saved for future reference.`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error saving session results: ${error}` }],
      isError: true,
    };
  }
}

/**
 * Get user's performance statistics.
 * Useful for adaptive recommendations.
 */
export async function handleGetUserStats(
  { language, difficulty }: GetUserStatsInput,
  ctx: HandlerContext
): Promise<CallToolResult> {
  try {
    const stats = await getUserStats(ctx.supabase, ctx.userId, { language, difficulty });

    const filterDesc =
      language || difficulty
        ? ` for ${language ?? "all languages"} at ${difficulty ?? "all difficulty levels"}`
        : "";

    return {
      structuredContent: {
        stats,
      },
      content: [
        {
          type: "text",
          text: `User statistics${filterDesc}: ${stats.completedSessions} completed sessions, ${stats.averageAccuracy}% average accuracy, ${stats.totalCardsStudied} total cards studied.`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error fetching stats: ${error}` }],
      isError: true,
    };
  }
}

/**
 * Get user's recent study sessions.
 */
export async function handleGetUserSessions(
  { language, difficulty, limit }: GetUserSessionsInput,
  ctx: HandlerContext
): Promise<CallToolResult> {
  try {
    const sessions = await getUserStudySessions(
      ctx.supabase,
      ctx.userId,
      { language, difficulty, completedOnly: true },
      limit ?? 10
    );

    return {
      structuredContent: {
        sessions,
      },
      content: [
        {
          type: "text",
          text:
            sessions.length > 0
              ? `Found ${sessions.length} recent session(s). Most recent: ${sessions[0].topic} (${sessions[0].language}, ${sessions[0].difficulty}) with ${sessions[0].accuracy_percentage}% accuracy.`
              : "No completed sessions found for this user.",
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error fetching sessions: ${error}` }],
      isError: true,
    };
  }
}
