import { createContext, useState } from "react";

export const AIChatContext = createContext(null);

/**
 * Shared AI Assistant conversation state, lifted out of the individual
 * page/widget components and up to DashboardLayout (which stays mounted
 * across route changes — only the routed page inside its <Outlet />
 * unmounts/remounts).
 *
 * Fixes: chat history used to live in local `useState([])` on the
 * dedicated /ai-assistant page component itself, so navigating away and
 * back reset it to empty every time — the page unmounts on navigation
 * like any other route. The floating AIAssistantWidget (mounted once in
 * DashboardLayout, not per-route) never had this problem, which is why
 * its history persisted while the full page's didn't.
 *
 * Both the full AI Assistant page and the floating widget now read/write
 * the SAME `messages` array via this context, so: (a) history survives
 * navigation, and (b) they show one continuous conversation instead of
 * two separate ones with different histories — asking something in the
 * floating widget and then opening the full page shows the same thread.
 */
export function AIChatProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);
  const clearMessages = () => setMessages([]);

  const value = { messages, setMessages, addMessage, clearMessages };

  return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>;
}
