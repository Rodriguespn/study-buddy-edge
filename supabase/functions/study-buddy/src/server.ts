/**
 * MCP Server factory for Study Buddy.
 * V1: Session-based learning with performance tracking.
 */

import { z } from "zod";

import { McpServer } from "./_compat/skybridge-deno.ts";
import {
  type HandlerContext,
  handleGetUserSessions,
  handleGetUserStats,
  handleSaveSessionResults,
  handleStartStudySession,
} from "./handlers.ts";
import { DIFFICULTIES, DifficultySchema, LANGUAGES, LanguageSchema } from "./shared/schemas.ts";

/**
 * Create an MCP server with context injection.
 * @param getContext - Function to get the current handler context
 */
export function createMcpServer(getContext: () => HandlerContext) {
  const server = new McpServer(
    {
      name: "study-buddy",
      version: "1.0.0",
    },
    { capabilities: {} }
  );

  // Widget for starting a study session
  server.widget(
    "startStudySession",
    {
      description: "Start an interactive language study session with AI-generated flashcards",
    },
    {
      description: `Start a study session. The AI generates flashcards based on the language, difficulty, and topic. Users attempt answers and receive immediate feedback with optional explanations. A session record is created in the database to track performance.`,
      inputSchema: {
        language: LanguageSchema.describe(`Target language. Options: ${LANGUAGES.join(", ")}`),
        difficulty: DifficultySchema.describe(
          `Difficulty level. Options: ${DIFFICULTIES.join(", ")}`
        ),
        topic: z
          .string()
          .min(1)
          .describe(
            "Free-form topic for flashcards (e.g., 'ordering food at a restaurant', 'asking for directions', 'job interview vocabulary')"
          ),
        cards: z
          .array(
            z.object({
              prompt: z
                .string()
                .describe("The word/phrase/sentence in target language to translate"),
              correctAnswer: z.string().describe("The correct translation in English"),
              explanation: z
                .string()
                .optional()
                .describe("Optional explanation, grammar note, or example usage"),
            })
          )
          .min(1)
          .describe("Array of flashcards to study (typically 5-15 cards)"),
      },
    },
    (input) => handleStartStudySession(input, getContext())
  );

  // Tool for saving session results
  server.tool(
    "saveSessionResults",
    "Save the results of a completed study session. Call this after the user finishes all flashcards to persist their performance data.",
    {
      sessionId: z.string().uuid().describe("The session ID returned from startStudySession"),
      correct_answers: z.number().int().min(0).describe("Number of correct answers"),
      incorrect_answers: z.number().int().min(0).describe("Number of incorrect answers"),
      card_results: z
        .array(
          z.object({
            prompt: z.string().describe("The flashcard prompt"),
            correctAnswer: z.string().describe("The correct answer"),
            userAnswer: z.string().describe("What the user answered"),
            isCorrect: z.boolean().describe("Whether the answer was correct"),
            attemptedAt: z.string().describe("ISO timestamp when the answer was attempted"),
          })
        )
        .describe("Detailed results for each card"),
    },
    (input) => handleSaveSessionResults(input, getContext())
  );

  // Tool for getting user statistics
  server.tool(
    "getUserStats",
    "Get user's performance statistics. Use this to understand user's learning history and provide adaptive recommendations.",
    {
      language: LanguageSchema.optional().describe(
        `Filter by language. Options: ${LANGUAGES.join(", ")}`
      ),
      difficulty: DifficultySchema.optional().describe(
        `Filter by difficulty. Options: ${DIFFICULTIES.join(", ")}`
      ),
    },
    (input) => handleGetUserStats(input, getContext())
  );

  // Tool for getting recent sessions
  server.tool(
    "getUserSessions",
    "Get user's recent study sessions. Use this to see what the user has been studying recently.",
    {
      language: LanguageSchema.optional().describe(
        `Filter by language. Options: ${LANGUAGES.join(", ")}`
      ),
      difficulty: DifficultySchema.optional().describe(
        `Filter by difficulty. Options: ${DIFFICULTIES.join(", ")}`
      ),
      limit: z.number().int().min(1).max(50).optional().describe("Maximum number of sessions to return (default: 10)"),
    },
    (input) => handleGetUserSessions(input, getContext())
  );

  // Prompt for starting a study session
  server.prompt(
    "study-session",
    "Start a language study session with customizable topic",
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "I want to practice a language. Ask me what language, difficulty level, and topic I'd like to study, then generate appropriate flashcards.",
          },
        },
      ],
    })
  );

  return server;
}
