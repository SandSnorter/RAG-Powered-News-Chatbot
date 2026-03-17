import "dotenv/config";
import { Request, Response } from "express";
import { QdrantClient } from "@qdrant/js-client-rest";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "redis";
import { Chat } from "../models/Chat";
import { getAuth } from "@clerk/express";
import { getEmbedding } from "./embedding.service";

interface Message {
    sender: "user" | "bot";
    text: string;
}

// --- 1. Client Initialization ---

// Qdrant
const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const COLLECTION_NAME = "news_articles";
const qdrant = new QdrantClient({ url: QDRANT_URL });

(async function checkQdrantHealth() {
    try {
        const result = await qdrant.getCollections();
        console.log(`[Qdrant] Connected. Collections: ${result.collections.map((c) => c.name).join(", ")}`);
    } catch (error) {
        console.error(`[Qdrant] Connection failed. Is docker-compose running?`, error instanceof Error ? error.message : error);
    }
})();

// Redis
const redisClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
redisClient.on("connect", () => console.log("[Redis] TCP connection established"));
redisClient.on("ready", () => console.log("[Redis] Ready to process commands"));
redisClient.on("error", (err) => console.error("[Redis] Client Error", err));
redisClient.on("end", () => console.warn("[Redis] Connection closed"));
redisClient.connect().catch(console.error);

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

        const { message } = req.body;
        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "Missing or invalid 'message' in request body." });
        }

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

        const systemPrompt = `
        You are a highly analytical news assistant. Your job is to extract maximum value from the provided news context and deliver it to the user.

        RULES:
        1. Answer the user's question based *only* on the provided RELEVANT NEWS CONTEXT. 
        2. If the answer is not in the context, reply exactly with: "I could not find an answer in the provided news articles."
        3. ALWAYS structure your responses using markdown formatting. 
        4. Whenever possible, break your answer down into detailed, easy-to-read bullet points or numbered lists.
        5. Be comprehensive and explain the "why" and "how" if the context provides it.
        6. Vary your introductory phrases (e.g., "Based on the provided context,", "According to the articles,", "Here is the summary.").

        ---
        CHAT HISTORY:
        ${formattedHistory}

        ---
        RELEVANT NEWS CONTEXT:
        ${formattedContext}

        ---
        USER'S QUESTION:
        ${message}
        `;

        // --- Step 5: Stream Response (SSE) ---
        const result = await genAI.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: systemPrompt,
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

        // Optimization: Save to MongoDB and Redis simultaneously without blocking the function's exit
        Promise.all([
            Chat.insertMany([
                { userId: clerkUserId, role: "user", content: message },
                { userId: clerkUserId, role: "bot", content: fullBotResponse, sources: uniqueSources },
            ]),
            redisClient.set(`context:${clerkUserId}`, JSON.stringify(history), { EX: 3600 })
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