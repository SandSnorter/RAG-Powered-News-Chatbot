import { useState, useEffect, useRef, useCallback, type ChangeEvent, type KeyboardEvent } from "react";
import { useAuth } from "@clerk/react";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Square, Copy, Check, ExternalLink, Globe, Sparkles, ArrowUp } from "lucide-react";

// ── Types ──────────────────────────────────────────────

export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  sources?: string[];
  isStreaming?: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  sessionId: string;
  initialMessages?: Message[];
  onMessageSent?: (firstMsg: string) => void;
  suggestedQuestions?: string[];
}

// ── Constants ──────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const DEFAULT_SUGGESTIONS = [
  "What's happening in AI and tech today?",
  "Summarize the latest geopolitical events",
  "What are the top business stories right now?",
  "Tell me about recent scientific breakthroughs",
];

// ── Main Component ─────────────────────────────────────

export default function ChatInterface({ sessionId, initialMessages = [], onMessageSent, suggestedQuestions }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<string | null>(null);
  const { getToken } = useAuth();

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionRef = useRef(sessionId);
  const firstMessageSentRef = useRef(false);

  // Reset state when session changes.
  // initialMessages excluded from deps — its default [] is a new reference every render.
  useEffect(() => {
    sessionRef.current = sessionId;
    setMessages(initialMessages);
    firstMessageSentRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Abort in-flight request on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // ── Core: send message and stream SSE response ─────

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const botMsgId = uuidv4();
    const now = new Date();

    // Optimistically render user bubble + empty bot bubble
    setMessages(prev => [
      ...prev,
      { id: uuidv4(), text, sender: "user", timestamp: now },
      { id: botMsgId, text: "", sender: "bot", isStreaming: true, timestamp: now },
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

    // Notify parent on first message (for sidebar preview)
    if (!firstMessageSentRef.current) {
      firstMessageSentRef.current = true;
      onMessageSent?.(text);
    }

    abortRef.current = new AbortController();

    const updateBot = (updates: Partial<Message>) => {
      setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, ...updates } : m));
    };

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, sessionId: sessionRef.current }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        updateBot({ text: "Sorry, I encountered a server error. Please try again.", isStreaming: false });
        return;
      }
      if (!res.body) throw new Error("No response body.");

      // Parse SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) { currentEvent = ""; continue; }
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === "sources" || data.sources) {
                updateBot({ sources: data.sources });
              } else if (data.text) {
                setMessages(prev => prev.map(m =>
                  m.id === botMsgId ? { ...m, text: m.text + data.text } : m
                ));
              }
            } catch { /* partial JSON chunk — safe to ignore */ }
            currentEvent = "";
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      updateBot({ text: "Connection failed. Please check your network and try again.", isStreaming: false });
    } finally {
      updateBot({ isStreaming: false });
      setIsLoading(false);
    }
  }, [isLoading, getToken, onMessageSent]);

  // Auto-send after suggestion is placed in input (400ms delay so user sees it)
  useEffect(() => {
    if (!pendingSuggestion) return;
    const timer = setTimeout(() => {
      sendMessage(pendingSuggestion);
      setPendingSuggestion(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [pendingSuggestion, sendMessage]);

  // ── Handlers ───────────────────────────────────────

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) sendMessage(input.trim());
    }
  };

  const handleSuggestionClick = useCallback((text: string) => {
    setInput(text);
    setPendingSuggestion(text);
  }, []);

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
  };

  // ── Render ─────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={handleSuggestionClick} questions={suggestedQuestions} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/5 bg-bg-base/90 backdrop-blur-sm px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative glass-surface rounded-2xl border border-white/8 focus-within:border-purple-500/30 focus-within:shadow-[0_0_0_3px_rgba(124,58,237,0.06)] transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "Nexus is thinking..." : "Ask about today's news..."}
              disabled={isLoading}
              rows={1}
              className="chat-input pr-14 disabled:opacity-40"
            />
            <div className="absolute right-3 bottom-3">
              {isLoading ? (
                <button onClick={stopStreaming} className="w-8 h-8 rounded-lg bg-bg-overlay border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors" title="Stop">
                  <Square className="w-3.5 h-3.5 text-text-secondary" />
                </button>
              ) : (
                <button onClick={() => sendMessage(input.trim())} disabled={!input.trim()} className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center hover:bg-purple-500 transition-all disabled:opacity-25 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30">
                  <ArrowUp className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
          <p className="text-center text-[10px] text-text-muted mt-2">
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/7 font-mono text-[9px]">Enter</kbd> to send ·{" "}
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/7 font-mono text-[9px]">Shift+Enter</kbd> new line · Answers sourced from real news
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────

function EmptyState({ onSuggestionClick, questions }: { onSuggestionClick: (q: string) => void; questions?: string[] }) {
  const items = questions ?? DEFAULT_SUGGESTIONS;
  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-100 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 flex items-center justify-center mb-5">
        <Sparkles className="w-6 h-6 text-purple-400" />
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">What do you want to know?</h3>
      <p className="text-sm text-text-secondary mb-8 max-w-sm">
        Ask me anything about today&#39;s news. I&#39;ll retrieve real articles and give you a sourced, factual answer.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {items.map(q => (
          <button key={q} onClick={() => onSuggestionClick(q)} className="text-left px-4 py-3.5 glass-surface rounded-xl border border-white/7 hover:border-purple-500/25 hover:bg-purple-500/5 text-sm text-text-secondary hover:text-text-primary transition-all">
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all text-xs">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === "user";
  return (
    <div className={`flex gap-3 group ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-purple-900/30">
          <Globe className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div className={
          isUser
            ? "px-5 py-3.5 bg-linear-to-br from-purple-600 to-purple-700 rounded-3xl rounded-tr-md text-sm text-white leading-relaxed shadow-lg shadow-purple-900/25"
            : "px-5 py-4 glass-surface rounded-3xl rounded-tl-md text-sm text-text-primary leading-relaxed border border-white/7"
        }>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.text}</p>
          ) : (
            <div className="nexus-prose text-sm">
              {!message.text && message.isStreaming ? (
                <span className="inline-flex gap-1.5 items-center py-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              ) : (
                <>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                  {message.isStreaming && (
                    <span className="inline-block w-0.5 h-3.5 bg-purple-400 ml-0.5 rounded-full align-middle animate-blink" />
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.sources.map((url, i) => {
              let hostname = url;
              try { hostname = new URL(url).hostname.replace("www.", ""); } catch { /* keep raw */ }
              return (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-surface border border-white/7 text-[11px] text-text-secondary hover:text-purple-300 hover:border-purple-500/25 transition-all">
                  <ExternalLink className="w-2.5 h-2.5" />
                  {hostname}
                </a>
              );
            })}
          </div>
        )}

        {!isUser && message.text && !message.isStreaming && <CopyButton text={message.text} />}
      </div>
    </div>
  );
}
