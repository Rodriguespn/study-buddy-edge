import { useCallback } from "react";

/**
 * Hook to send a follow-up message to the LLM using window.openai.sendFollowUpMessage.
 * Returns an object with sendFollowUpMessage function.
 */
export function useSendFollowUpMessage() {
  const sendFollowUpMessage = useCallback(async (prompt: string): Promise<void> => {
    if (!window.openai?.sendFollowUpMessage) {
      throw new Error("window.openai.sendFollowUpMessage is not available");
    }
    return window.openai.sendFollowUpMessage({ prompt });
  }, []);
  return { sendFollowUpMessage };
}
