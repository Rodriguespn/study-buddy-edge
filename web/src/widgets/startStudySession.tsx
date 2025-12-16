import "@/index.css";
import type { Difficulty, Flashcard, Language } from "@study-buddy/shared";
import { mountWidget, useToolOutput } from "skybridge/web";
import { useSendFollowUpMessage } from "@/hooks/useSendFollowUpMessage";
import { StudySessionUI } from "./shared/StudySessionUI";

/**
 * startStudySession widget
 * Interactive flashcard study session with answer input and validation.
 * Creates a session record in the database and tracks performance.
 */

type WidgetProps = {
  sessionId: string;
  language: Language;
  difficulty: Difficulty;
  topic: string;
  cards: Flashcard[];
};

const StartStudySession = () => {
  const toolOutput = useToolOutput() as WidgetProps;
  const { sendFollowUpMessage } = useSendFollowUpMessage();

  const sessionId = toolOutput?.sessionId ?? "";
  const language: Language = toolOutput?.language ?? "french";
  const difficulty: Difficulty = toolOutput?.difficulty ?? "beginner";
  const topic = toolOutput?.topic ?? "";
  const cards: Flashcard[] = toolOutput?.cards ?? [];

  const handleComplete = (results: {
    correct_answers: number;
    incorrect_answers: number;
    card_results: Array<{
      prompt: string;
      correctAnswer: string;
      userAnswer: string;
      isCorrect: boolean;
      attemptedAt: string;
    }>;
  }) => {
    // Send a message to save the session results
    sendFollowUpMessage(
      `Session completed! Please save my results using saveSessionResults with sessionId: ${sessionId}, correct_answers: ${results.correct_answers}, incorrect_answers: ${results.incorrect_answers}, and the detailed card_results.`
    );
  };

  return (
    <StudySessionUI
      sessionId={sessionId}
      language={language}
      difficulty={difficulty}
      topic={topic}
      cards={cards}
      onComplete={handleComplete}
    />
  );
};

export default StartStudySession;

mountWidget(<StartStudySession />);
