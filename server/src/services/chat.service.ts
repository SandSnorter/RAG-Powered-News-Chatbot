import 'dotenv/config';
import { Request, Response } from 'express';
import { QdrantClient } from "@qdrant/js-client-rest";
import { GoogleGenAI } from "@google/genai";
import { createClient } from 'redis';

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

// --- Client Initialization ---

// 1. Qdrant Client
const QDRANT_URL = "http://localhost:6333";
const COLLECTION_NAME = "news_articles";
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || "http://localhost:6333" });

// 2. Redis Client
const redisClient = createClient({url: process.env.REDIS_URL || 'redis://localhost:6379'});
redisClient.on('error', err => console.log('Redis Client Error', err));

// 3. Jina AI Client
import { getEmbedding } from './embedding.service';

// 4. Google Gemini Client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in your .env file.");
}
const genAI = new GoogleGenAI({apiKey: GEMINI_API_KEY});

export async function handleChat(req: Request, res: Response) {

    try {

        const { message, sessionId } = req.body;
        if (!message || !sessionId) {
            return res.status(400).json({ error: "Missing 'message' or 'sessionId' in request body." });
        }

        // --- Step 1: Retrieve chat history from Redis ---
        if(!redisClient.isOpen) await redisClient.connect();
        const historyJSON = await redisClient.get(sessionId);
        let history: Message[] = historyJSON ? JSON.parse(historyJSON) : [];

        // --- Step 2: Generate embedding for the user's message ---
        const queryEmbedding = await getEmbedding(message, 'retrieval.query');

        // --- Step 3: Query Qdrant to get relevant context ---
        const context = await qdrant.search(
            COLLECTION_NAME,
            {
                vector: queryEmbedding,
                limit: 3,
                with_payload: true
            }
        );

        // Extract just the payload data from the search results
        const contextPayLoads = context.map(item => item.payload);

        // --- Step 4: Construct a detailed prompt for the LLM ---
        const formattedHistory = history
                                    .map(msg => `${msg.sender}: ${msg.text}`)
                                    .join('\n');
        const formattedContext = contextPayLoads
                                    .map((payload, i) => `CONTEXT 1 ${i+1} (Source: ${payload?.source_url}):\n${payload?.text}`)
                                    .join('\n');

        const systemPrompt = `You are a helpful news assistant. Answer the user's question based *only* on the provided context below. Give your answer in details with points if needed. If the answer is not in the context, say "I could not find an answer in the provided news articles.".
        
            --- 
            CHAT HISTORY:
            ${formattedHistory}
            ---
            RELEVANT NEWS CONTEXT:
            ${formattedContext} 
            ---
            USER'S QUESTION: 
            ${message}
            ---
            ANSWER: 
            `;

        // --- Step 5: Stream the Response (SSE) ---
        const result = await genAI.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: systemPrompt
        });

        // Headers for SSE (Streaming)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        let fullBotResponse = '';

        // Iterate through the stream
        for await (const chunk of result){
            const chunkText = chunk.text;
            fullBotResponse += chunkText;

            // Send data to client
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }

        // --- Step 6: Send Citations ---
        const sources = contextPayLoads
                            .map(payload => payload?.source_url)
                            .filter(url => url);

        const uniqueSources = [...new Set(sources)];

        res.write(`event: sources\ndata: ${JSON.stringify({sources: uniqueSources})}\n\n`);

        // End the stream
        res.end();

        // --- Step 7: Save Updated History to Redis ---
        history.push({sender: 'user', text: message});
        history.push({sender: 'bot', text: fullBotResponse});

        // Expire session after 1 hour to save memory
        await redisClient.set(sessionId, JSON.stringify(history), {EX: 3600});

    } catch (error) {

        console.log("Error in handleChat:", error);
        // Check if headers were already sent to avoid "Cannot set headers after sent" error
        if (!res.headersSent) {
            res.status(500).json({ error: "An internal server error occurred." });
        } else {
            res.end();
        }
        
    }
}