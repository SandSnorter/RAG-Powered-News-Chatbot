import "dotenv/config";
import { Request, Response } from "express";
import { QdrantClient } from "@qdrant/js-client-rest";
import { GoogleGenAI } from "@google/genai";
import { Chat } from "../models/Chat";
import { getAuth } from "@clerk/express";
import { getEmbedding } from "./embedding.service";
import redisClient from "../lib/redis.client"; 

interface Message {
    sender: "user" | "bot";
    text: string;
}

// --- 1. Client Initialization ---

// Qdrant
const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const COLLECTION_NAME = "news_articles";
const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY 
});

(async function checkQdrantHealth() {
    try {
        const result = await qdrant.getCollections();
        console.log(`[Qdrant] Connected. Collections: ${result.collections.map((c) => c.name).join(", ")}`);
    } catch (error) {
        console.error(`[Qdrant] Connection failed. Is docker-compose running?`, error instanceof Error ? error.message : error);
    }
})();

const MAX_HISTORY_MESSAGES = 10; // Keep last 5 exchanges (user + bot pairs)

// Google Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in your .env file.");
}
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- 2. Chat Handler ---

export async function handleChat(req: Request, res: Response) {
    try {
        // --- Auth & Validation ---
        const { userId: clerkUserId } = getAuth(req);
        if (!clerkUserId) {
            return res.status(401).json({ error: "User not authenticated." });
        }

        const { message, sessionId } = req.body;
        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "Missing or invalid 'message' in request body." });
        }
        const chatSessionId: string = (typeof sessionId === "string" && sessionId.trim()) ? sessionId.trim() : "default";

        // --- Step 1 & 2: Fetch History & Generate Embedding (Parallelized) ---
        // Optimization: Redis fetch and embedding generation don't depend on each other.
        const [historyJSON, queryEmbedding] = await Promise.all([
            redisClient.get(`context:${clerkUserId}`),
            getEmbedding(message, "retrieval.query")
        ]);

        const history: Message[] = historyJSON ? JSON.parse(historyJSON) : [];

        // --- Step 3: Query Qdrant ---
        const contextResults = await qdrant.search(COLLECTION_NAME, {
            vector: queryEmbedding,
            limit: 3,
            with_payload: true,
        });

        // Safely extract payloads, filtering out undefined
        const contextPayloads = contextResults.map((item) => item.payload).filter(Boolean);

        // --- Step 4: Construct Prompt ---
        const formattedHistory = history.map((msg) => `${msg.sender}: ${msg.text}`).join("\n");
        const formattedContext = contextPayloads
            .map((payload, i) => `CONTEXT ${i + 1} (Source: ${payload?.source_url}):\n${payload?.text}`)
            .join("\n\n");

        const systemInstruction = `You are Nexus, an AI news analyst. You MUST follow this exact output format for EVERY response.

STRICT FORMAT RULES:
- Start with ONE short sentence answering the question directly.
- Then ALWAYS use a numbered list (1. 2. 3. 4. 5.) as the main body. Every response MUST have a numbered list. No exceptions.
- Each numbered point should be 1-2 sentences. Bold the key fact at the start of each point.
- After the numbered list, end with "**Bottom Line:** " followed by one summary sentence.
- Use markdown: **bold** for emphasis, numbered lists for all main points. Do NOT use headers (no # or ##). Do NOT write long paragraphs.
- Never use bullet points (- or *). ONLY use numbered lists (1. 2. 3.).
- Never output URLs. Sources are handled separately by the system.
- Only use information from the provided context. If no relevant context exists, say so briefly.

EXAMPLE OUTPUT FORMAT:
The EU has taken significant action against Apple over antitrust concerns.

1. **€500M fine imposed** — The European Commission fined Apple for violating the Digital Markets Act by restricting app developers from linking to outside payment options.
2. **App Store changes required** — Apple must allow third-party app stores and sideloading on iPhones sold in Europe by March 2025.
3. **Apple's response** — The company has filed an appeal, arguing the regulations compromise user security and privacy.
4. **Broader impact** — This sets a precedent for how regulators worldwide may approach Big Tech market dominance.

**Bottom Line:** The EU is aggressively enforcing its new digital regulations, and Apple faces both financial penalties and mandatory changes to its business model in Europe.

Follow this EXACT structure. Numbered list is MANDATORY.`;

        const userPrompt = `CHAT HISTORY:
${formattedHistory || "(none)"}

NEWS CONTEXT:
${formattedContext || "(none)"}

QUESTION: ${message}`;

        // --- Step 5: Stream Response (SSE) ---
        const result = await genAI.models.generateContentStream({
            model: "gemini-2.5-flash",
            config: { systemInstruction: systemInstruction },
            contents: userPrompt,
        });

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        let fullBotResponse = "";

        for await (const chunk of result) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullBotResponse += chunkText;
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        // --- Step 6: Send Citations ---
        const sources = contextPayloads
            .map((payload) => payload?.source_url)
            .filter((url): url is string => Boolean(url));

        const uniqueSources = [...new Set(sources)];
        res.write(`event: sources\ndata: ${JSON.stringify({ sources: uniqueSources })}\n\n`);
        res.end();

        // --- Step 7: Storage (MongoDB & Redis Parallelized) ---
        history.push({ sender: "user", text: message }, { sender: "bot", text: fullBotResponse });

        // Trim to MAX_HISTORY_MESSAGES to prevent Redis context from growing unbounded
        const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES);

        // Optimization: Save to MongoDB and Redis simultaneously without blocking the function's exit
        Promise.all([
            Chat.insertMany([
                { userId: clerkUserId, sessionId: chatSessionId, role: "user", content: message },
                { userId: clerkUserId, sessionId: chatSessionId, role: "bot", content: fullBotResponse, sources: uniqueSources },
            ]),
            redisClient.set(`context:${clerkUserId}`, JSON.stringify(trimmedHistory), { EX: 3600 })
        ]).catch((err) => console.error("[Storage Error] Failed to save chat data:", err));

    } catch (error) {
        console.error("[Chat Error]:", error instanceof Error ? error.message : error);
        if (!res.headersSent) {
            res.status(500).json({ error: "An internal server error occurred." });
        } else {
            res.end();
        }
    }
}
