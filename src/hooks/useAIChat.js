import { useContext } from "react";
import { AIChatContext } from "../context/AIChatContext.jsx";

export function useAIChat() {
  const ctx = useContext(AIChatContext);
  if (!ctx) {
    throw new Error("useAIChat must be used within an AIChatProvider");
  }
  return ctx;
}
