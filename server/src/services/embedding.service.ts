import 'dotenv/config';
import axios from 'axios';

const JINA_API_KEY = process.env.JINA_API_KEY;
const JINA_API_URL = "https://api.jina.ai/v1/embeddings";

export type JinaEmbeddingTask = 'retrieval.query' | 'retrieval.passage';

interface JinaEmbeddingResult {
  object: string;
  index: number;
  embedding: number[];
}

// Generates a vector embedding for a single text input using Jina AI.
export async function getEmbedding(input: string, task: JinaEmbeddingTask = 'retrieval.passage'): Promise<number[]> {
    if (!JINA_API_KEY) {
        throw new Error("JINA_API_KEY is not set in your .env file.");
    }

    if (!input || input.trim().length === 0) {
        console.warn("⚠️ Skipping empty text chunk");
        return []; 
    }

    try {
        const response = await axios.post(
            JINA_API_URL,
            {
                // API expects a batch (array), even for single inputs
                input: [input], 
                model: 'jina-embeddings-v2-base-en',
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${JINA_API_KEY}`,
                }
            }
        );

        const embeddings: JinaEmbeddingResult[] = response.data.data;

        // Ensure the API returned a valid embedding structure before accessing index 0
        if (!embeddings || embeddings.length === 0) {
            throw new Error("No embeddings returned from Jina API");
        }

        if (!embeddings[0]) {
            throw new Error("First embedding is undefined");
        }

        return embeddings[0].embedding;

    } catch (error: any) {
        // Distinguish between an API failure and a network/code error
        if (axios.isAxiosError(error) && error.response) {
            console.error("❌ Jina API Error:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error getting embedding from Jina:", error.message);
        }
        throw new Error("Failed to generate embedding.");
    }
}