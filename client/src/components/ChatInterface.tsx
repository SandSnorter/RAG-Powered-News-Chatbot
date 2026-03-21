import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/react";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Square, Copy, Check, ExternalLink, Globe, Sparkles, ArrowUp } from "lucide-react";

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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const SUGGESTED = [
  "What's happening in AI and tech today?",
  "Summarize the latest geopolitical events",
  "What are the top business stories right now?",
  "Tell me about recent scientific breakthroughs",
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[#8b949e] hover:text-[#f0f6fc] hover:bg-white/[0.1] transition-all text-xs"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function ChatInterface({ sessionId, initialMessages = [], onMessageSent, suggestedQuestions }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionRef = useRef(sessionId);
  const firstMessageSentRef = useRef(false);

  useEffect(() => {
    sessionRef.current = sessionId;
    setMessages(initialMessages);
    firstMessageSentRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) sendMessage(input.trim());
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const botMsgId = uuidv4();
    const now = new Date();

    setMessages(prev => [
      ...prev,
      { id: uuidv4(), text, sender: "user", timestamp: now },
      { id: botMsgId, text: "", sender: "bot", isStreaming: true, timestamp: now },
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

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
            } catch { /* ignore partial chunk parse errors */ }
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

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={sendMessage} questions={suggestedQuestions} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-white/[0.05] bg-[#080b14]/90 backdrop-blur-sm px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative glass-surface rounded-2xl border border-white/[0.08] focus-within:border-purple-500/30 focus-within:shadow-[0_0_0_3px_rgba(124,58,237,0.06)] transition-all">
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
                <button onClick={stopStreaming} className="w-8 h-8 rounded-lg bg-[#21262d] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors" title="Stop">
                  <Square className="w-3.5 h-3.5 text-[#8b949e]" />
                </button>
              ) : (
                <button onClick={() => sendMessage(input.trim())} disabled={!input.trim()} className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center hover:bg-purple-500 transition-all disabled:opacity-25 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30">
                  <ArrowUp className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
          <p className="text-center text-[10px] text-[#484f58] mt-2">
            <kbd className="px-1 py-0.5 rounded bg-white/[0.05] border border-white/[0.07] font-mono text-[9px]">Enter</kbd> to send ·{" "}
            <kbd className="px-1 py-0.5 rounded bg-white/[0.05] border border-white/[0.07] font-mono text-[9px]">Shift+Enter</kbd> new line · Answers sourced from real news
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSuggestionClick, questions }: { onSuggestionClick: (q: string) => void; questions?: string[] }) {
  const items = questions ?? SUGGESTED;
  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 flex items-center justify-center mb-5">
        <Sparkles className="w-6 h-6 text-purple-400" />
      </div>
      <h3 className="text-xl font-semibold text-[#f0f6fc] mb-2">What do you want to know?</h3>
      <p className="text-sm text-[#8b949e] mb-8 max-w-sm">
        Ask me anything about today&#39;s news. I&#39;ll retrieve real articles and give you a sourced, factual answer.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {items.map(q => (
          <button key={q} onClick={() => onSuggestionClick(q)} className="text-left px-4 py-3.5 glass-surface rounded-xl border border-white/[0.07] hover:border-purple-500/25 hover:bg-purple-500/[0.05] text-sm text-[#8b949e] hover:text-[#f0f6fc] transition-all">
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === "user";
  return (
    <div className={`flex gap-3 group ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-purple-900/30">
          <Globe className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div className={
          isUser
            ? "px-5 py-3.5 bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl rounded-tr-md text-sm text-white leading-relaxed shadow-lg shadow-purple-900/25"
            : "px-5 py-4 glass-surface rounded-3xl rounded-tl-md text-sm text-[#f0f6fc] leading-relaxed border border-white/[0.07]"
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
                    <span className="inline-block w-[2px] h-[14px] bg-purple-400 ml-0.5 rounded-full align-middle animate-blink" />
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.sources.map((url, i) => {
              let hostname = url;
              try { hostname = new URL(url).hostname.replace("www.", ""); } catch { /* keep raw */ }
              return (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-surface border border-white/[0.07] text-[11px] text-[#8b949e] hover:text-purple-300 hover:border-purple-500/25 transition-all">
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
