/**
 * StudySessionUI component
 * Interactive flashcard study session with answer input and validation.
 */

import type { CardResult, Difficulty, Flashcard, Language } from "@study-buddy/shared";
import { useState } from "react";
import { getSimilarityFeedback, validateAnswer } from "./answer-validation";
import { difficultyColorStyles, getThemeTokens, languageNames } from "./shared-flashcard";

type CardState = "prompting" | "revealed";

type StudySessionUIProps = {
  sessionId: string;
  language: Language;
  difficulty: Difficulty;
  topic: string;
  cards: Flashcard[];
  onComplete?: (results: {
    correct_answers: number;
    incorrect_answers: number;
    card_results: CardResult[];
  }) => void;
};

export const StudySessionUI = ({
  sessionId,
  language,
  difficulty,
  topic,
  cards,
  onComplete,
}: StudySessionUIProps) => {
  const theme = window.openai?.theme || "light";
  const tokens = getThemeTokens(theme);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardState, setCardState] = useState<CardState>("prompting");
  const [userAnswer, setUserAnswer] = useState("");
  const [results, setResults] = useState<CardResult[]>([]);
  const [currentResult, setCurrentResult] = useState<{
    isCorrect: boolean;
    similarity?: number;
  } | null>(null);

  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;
  const isCompleted = currentIndex >= cards.length;

  const correctCount = results.filter((r) => r.isCorrect).length;
  const incorrectCount = results.filter((r) => !r.isCorrect).length;

  const handleSubmit = () => {
    if (!userAnswer.trim() || !currentCard) return;

    const result = validateAnswer(userAnswer, currentCard.correctAnswer);
    setCurrentResult({ isCorrect: result.isCorrect, similarity: result.similarity });
    setCardState("revealed");
  };

  const handleNext = () => {
    if (!currentCard) return;

    const cardResult: CardResult = {
      prompt: currentCard.prompt,
      correctAnswer: currentCard.correctAnswer,
      userAnswer: userAnswer,
      isCorrect: currentResult?.isCorrect ?? false,
      attemptedAt: new Date().toISOString(),
    };

    const newResults = [...results, cardResult];
    setResults(newResults);

    if (isLastCard) {
      setCurrentIndex(currentIndex + 1);
      const finalCorrect = newResults.filter((r) => r.isCorrect).length;
      const finalIncorrect = newResults.filter((r) => !r.isCorrect).length;
      onComplete?.({
        correct_answers: finalCorrect,
        incorrect_answers: finalIncorrect,
        card_results: newResults,
      });
    } else {
      setCurrentIndex(currentIndex + 1);
      setCardState("prompting");
      setUserAnswer("");
      setCurrentResult(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (cardState === "prompting") {
        handleSubmit();
      } else {
        handleNext();
      }
    }
  };

  // Completion screen
  if (isCompleted) {
    const accuracy = cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0;
    return (
      <div className={`${tokens.bg} rounded-xl shadow-lg p-8 max-w-2xl mx-auto`}>
        <div className="text-center">
          <h1 className={`text-3xl font-bold ${tokens.text} mb-4`}>Session Complete!</h1>
          <div
            className="w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6"
            style={{
              background: `linear-gradient(to bottom right, ${difficultyColorStyles[difficulty].from}, ${difficultyColorStyles[difficulty].to})`,
            }}
          >
            <span className="text-4xl font-bold text-white">{accuracy}%</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`${tokens.surface} rounded-lg p-4`}>
              <p className={`text-sm ${tokens.subtext} mb-1`}>Correct</p>
              <p className="text-2xl font-bold text-green-500">{correctCount}</p>
            </div>
            <div className={`${tokens.surface} rounded-lg p-4`}>
              <p className={`text-sm ${tokens.subtext} mb-1`}>Incorrect</p>
              <p className="text-2xl font-bold text-red-500">{incorrectCount}</p>
            </div>
          </div>
          <p className={`${tokens.subtext} text-sm`}>
            Topic: {topic} | {languageNames[language]} | {difficulty}
          </p>
          <p className={`${tokens.subtext} text-xs mt-2`}>Session ID: {sessionId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${tokens.bg} rounded-xl shadow-lg p-8 max-w-2xl mx-auto`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className={`text-2xl font-bold ${tokens.text} mb-2`}>
          {languageNames[language]} Study Session
        </h1>
        <p className={`${tokens.subtext} text-sm mb-2`}>{topic}</p>
        <div className="flex justify-center items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-sm font-semibold text-white"
            style={{
              background: `linear-gradient(to right, ${difficultyColorStyles[difficulty].from}, ${difficultyColorStyles[difficulty].to})`,
            }}
          >
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className={`text-center mb-4 rounded-lg border ${tokens.surface} p-3`}>
        <p className={`text-xs ${tokens.subtext} mb-1 uppercase tracking-wider`}>Progress</p>
        <p className={`text-lg font-bold ${tokens.text}`}>
          {currentIndex + 1} / {cards.length}
        </p>
        <div className="flex justify-center gap-4 mt-2 text-sm">
          <span className="text-green-500">✓ {correctCount}</span>
          <span className="text-red-500">✗ {incorrectCount}</span>
        </div>
      </div>

      <div className={`w-full h-2 rounded-full overflow-hidden border ${tokens.surface} mb-6`}>
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / cards.length) * 100}%`,
            background: `linear-gradient(to right, ${difficultyColorStyles[difficulty].from}, ${difficultyColorStyles[difficulty].to})`,
          }}
        />
      </div>

      {/* Flashcard */}
      <div className={`rounded-2xl shadow-xl border-2 ${tokens.surface} p-8 mb-6`}>
        <p className={`text-xs ${tokens.subtext} mb-3 uppercase tracking-wider font-medium text-center`}>
          Translate this {language} phrase:
        </p>
        <h2 className={`text-3xl font-bold ${tokens.text} text-center mb-6`}>
          {currentCard?.prompt}
        </h2>

        {cardState === "prompting" ? (
          <div>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer in English..."
              className={`w-full px-4 py-3 rounded-xl border-2 ${tokens.surface} ${tokens.text} text-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              autoFocus
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
              className="w-full mt-4 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, ${difficultyColorStyles[difficulty].from}, ${difficultyColorStyles[difficulty].to})`,
              }}
            >
              Check Answer
            </button>
          </div>
        ) : (
          <div>
            {/* Answer result */}
            <div
              className={`rounded-xl p-4 mb-4 ${
                currentResult?.isCorrect
                  ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
                  : "bg-red-100 dark:bg-red-900/30 border-2 border-red-500"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-2xl ${currentResult?.isCorrect ? "text-green-500" : "text-red-500"}`}>
                  {currentResult?.isCorrect ? "✓" : "✗"}
                </span>
                <span
                  className={`font-semibold ${currentResult?.isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}
                >
                  {currentResult?.isCorrect ? "Correct!" : "Incorrect"}
                </span>
              </div>
              <p className={`text-sm ${tokens.subtext}`}>
                Your answer: <span className="font-medium">{userAnswer}</span>
              </p>
              {!currentResult?.isCorrect && (
                <>
                  <p className={`text-sm ${tokens.subtext} mt-1`}>
                    Correct answer:{" "}
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {currentCard?.correctAnswer}
                    </span>
                  </p>
                  {currentResult?.similarity !== undefined && currentResult.similarity >= 0.5 && (
                    <p className={`text-xs ${tokens.subtext} mt-2 italic`}>
                      {getSimilarityFeedback(currentResult.similarity)}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Explanation */}
            {currentCard?.explanation && (
              <div className={`rounded-xl p-4 mb-4 ${tokens.surface} border`}>
                <p className={`text-xs ${tokens.subtext} mb-1 uppercase tracking-wider`}>Explanation</p>
                <p className={`text-sm ${tokens.text}`}>{currentCard.explanation}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleNext}
              onKeyDown={handleKeyDown}
              className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(to right, ${difficultyColorStyles[difficulty].from}, ${difficultyColorStyles[difficulty].to})`,
              }}
            >
              {isLastCard ? "Finish Session" : "Next Card →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
