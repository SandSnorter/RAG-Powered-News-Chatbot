import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { v4 as uuidv4 } from "uuid";

interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    sources?: string[];
}

const ChatInterface = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const { getToken } = useAuth();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const currentInput = input;
        const userMsgId = uuidv4();
        const botMsgId = uuidv4();

        // 1. Optimistically update UI
        setMessages((prev) => [
            ...prev,
            { id: userMsgId, text: currentInput, sender: "user" },
            { id: botMsgId, text: "", sender: "bot" },
        ]);
        setInput("");
        setIsTyping(true);

        // Helper to update the bot's message state
        const updateBotMessage = (updates: Partial<Message>) => {
            setMessages((prev) =>
                prev.map((msg) => (msg.id === botMsgId ? { ...msg, ...updates } : msg))
            );
        };

        // 2. Setup Streaming (SSE)
        try {
            const token = await getToken();
            const response = await fetch("http://localhost:3001/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: currentInput }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Backend Error:", errorText);
                updateBotMessage({ text: "Sorry, I encountered a server error." });
                return;
            }

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = ""; // Buffer to handle chunks that get cut off mid-JSON

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                
                // Keep the last incomplete line in the buffer
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const dataStr = line.slice(6).trim();
                        if (!dataStr) continue;

                        try {
                            const data = JSON.parse(dataStr);
                            
                            if (data.text) {
                                // Append text chunk
                                setMessages((prev) => prev.map((msg) => 
                                    msg.id === botMsgId ? { ...msg, text: msg.text + data.text } : msg
                                ));
                            } else if (data.sources) {
                                // Apply sources array
                                updateBotMessage({ sources: data.sources });
                            }
                        } catch (parseError) {
                            console.error("Failed to parse stream chunk:", parseError, "Chunk:", dataStr);
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Chat Error:", err);
            updateBotMessage({ text: "Sorry, my connection failed." });
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-4xl bg-black/20 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 italic">
                        <p>Ask me anything about today's news...</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                            <div
                                className={`max-w-[80%] p-4 rounded-2xl ${
                                    msg.sender === "user"
                                        ? "bg-purple-600 text-white rounded-tr-none"
                                        : "bg-white/10 text-gray-200 border border-white/5 rounded-tl-none"
                                }`}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            
                            {/* Render Sources if available */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 flex gap-2 max-w-[80%] flex-wrap">
                                    {msg.sources.map((url, idx) => (
                                        <a 
                                            key={idx} 
                                            href={url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-purple-300 hover:text-purple-200 transition-colors"
                                        >
                                            Source {idx + 1}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                />
                <button
                    disabled={isTyping}
                    className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg shadow-purple-500/20"
                >
                    {isTyping ? "..." : "→"}
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;