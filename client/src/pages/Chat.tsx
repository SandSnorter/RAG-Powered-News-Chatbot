import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { v4 as uuidv4 } from "uuid";
import ChatInterface, { type Message } from "../components/ChatInterface";
import Sidebar, { type ChatSession } from "../components/Sidebar";
import { Globe, Menu, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function ChatPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const categorySuggestions = (location.state as { suggestions?: string[] } | null)?.suggestions;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => uuidv4());
  const [sessionMessages, setSessionMessages] = useState<Map<string, Message[]>>(new Map());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate("/");
  }, [isLoaded, isSignedIn, navigate]);

  // Load session list from backend on mount
  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/chats/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch {
        // sessions are optional — sidebar shows empty gracefully
      }
    })();
    return () => { cancelled = true; };
  }, [isSignedIn, getToken]);

  const handleNewChat = useCallback(() => {
    const newId = uuidv4();
    setActiveSessionId(newId);
    setSidebarOpen(false);
  }, []);

  const handleSelectSession = useCallback(async (sessionId: string) => {
    setSidebarOpen(false);

    // If already cached, switch immediately
    if (sessionMessages.has(sessionId)) {
      setActiveSessionId(sessionId);
      return;
    }

    // Fetch messages FIRST, then switch — so ChatInterface mounts with data
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/chats/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const msgs: Message[] = (data.messages || []).map((m: { role: string; content: string; sources?: string[]; createdAt?: string }) => ({
          id: uuidv4(),
          text: m.content,
          sender: m.role === "user" ? "user" : "bot",
          sources: m.sources,
          timestamp: new Date(m.createdAt || Date.now()),
        }));
        setSessionMessages(prev => new Map(prev).set(sessionId, msgs));
      }
    } catch {
      // silently fail — session will open with empty messages
    }

    // Switch after messages are loaded
    setActiveSessionId(sessionId);
  }, [getToken, sessionMessages]);

  const handleClearHistory = useCallback(async () => {
    if (!confirm("Clear all conversation history? This cannot be undone.")) return;
    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/chats/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions([]);
      setSessionMessages(new Map());
      handleNewChat();
    } catch {
      // silently fail
    }
  }, [getToken, handleNewChat]);

  // Called when the first message is sent in a new session
  const handleFirstMessage = useCallback((firstMsg: string) => {
    const preview = firstMsg.length > 45 ? firstMsg.slice(0, 45) + "…" : firstMsg;
    const newSession: ChatSession = {
      sessionId: activeSessionId,
      preview,
      timestamp: new Date().toISOString(),
    };
    setSessions(prev => {
      const filtered = prev.filter(s => s.sessionId !== activeSessionId);
      return [newSession, ...filtered];
    });
  }, [activeSessionId]);

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-base">
        <div className="flex gap-1.5">
          {[0, 150, 300].map(d => (
            <div key={d} className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  const currentMessages = sessionMessages.get(activeSessionId) ?? [];

  return (
    <div className="h-screen flex overflow-hidden bg-bg-base">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:relative z-50 h-full transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onClearHistory={handleClearHistory}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top bar */}
        <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/6 glass">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Globe className="w-3 h-3 text-white" />
            </div>
            <span className="font-pacifico text-lg text-white">Nexus</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-400">Live</span>
            </div>
            <span className="hidden sm:block text-xs text-text-muted px-2.5 py-1 rounded-full bg-white/3 border border-white/6">
              Gemini 2.5 Flash · RAG
            </span>
          </div>
        </header>

        {/* Chat interface */}
        <div className="flex-1 min-h-0">
          <ChatInterface
            key={activeSessionId}
            sessionId={activeSessionId}
            initialMessages={currentMessages}
            onMessageSent={handleFirstMessage}
            suggestedQuestions={categorySuggestions}
          />
        </div>
      </div>
    </div>
  );
}
