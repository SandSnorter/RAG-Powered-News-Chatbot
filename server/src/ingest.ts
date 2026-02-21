import 'dotenv/config';
import axios, { head } from 'axios';
import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from 'uuid';
import { getEmbedding } from './services/embedding.service';

const QDRANT_URL = "http://localhost:6333";
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = "https://newsapi.org/v2/everything";
const qdrant = new QdrantClient({ url: QDRANT_URL });
const COLLECTION_NAME = "news_articles";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  content: string; 
}

// --- 1. EXTRACT ---
async function fetchNewsArticles(query: string): Promise<NewsArticle[]> {

    if (!NEWS_API_KEY) {
        throw new Error("NEWS_API_KEY is not set in your .env file.");
    }

    const response = await axios.get(NEWS_API_URL, {
        params: {
            q: query,
            language: 'en',
            sortBy: 'relevancy',
            apiKey: NEWS_API_KEY
        }}
    );
    return response.data.articles;
}

// --- 2. TRANSFORM ---
function chunkText(text: string, chunkSize = 1000, overlap = 100): string[] {
    const chunks: string[] = [];
    for(let i = 0; i < text.length; i += chunkSize-overlap){
        chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
}

// --- 3. LOAD ---
async function embedAndStore(chunks: string[], metadata: { url: string; category: string }) {

    try {
        const points = [];

        // Loop through each text chunk
        for(const chunk of chunks){
            console.log(`Generating embedding for chunk...`);

            // We reuse the logic we wrote in embedding.service.ts
            const vector = await getEmbedding(chunk, 'retrieval.passage');

            // Prepare data "points" for Qdrant ---
            points.push({
                id: uuidv4(),
                vector: vector,
                payload: {
                    text: chunk,
                    source_url: metadata.url
                }
            });
        }

        // --- 3. Store the points in Qdrant ---
        if (points.length > 0) {
            console.log(`Upserting ${points.length} points to Qdrant...`);
            await qdrant.upsert(COLLECTION_NAME, {
                wait: true,
                points: points
            });
        }

    } catch (error) {
        console.error("Error in embedAndStore:", error);
    }
}

async function main() {
    
    console.log("Starting ingestion...");

    try {
        
        console.log("Resetting Qdrant Collection...");
        await qdrant.recreateCollection(COLLECTION_NAME, {
            vectors: {
                size: 768, // Standard size for jina-embeddings-v2-base-en
                distance: 'Cosine'
            }
        });

        const categories = ["general", "technology", "business", "sports", "science", "health", "entertainment"];

        for(const category of categories){

            // 1. EXTRACT: Fetch articles from the API
            const articles = await fetchNewsArticles(category);
            console.log(`Fetched ${articles.length} articles for category: ${category}.`);

            // 2. TRANSFORM & LOAD (for each article)
            for (const article of articles) {
                if (!article.title || !article.description) continue; // Skip bad data

                // Combine title and description for better context
                const textToEmbed = `${article.title}. ${article.description}`;
                console.log(`Processing article: ${article.title}`);

                // 2a. Transform: Chunk the text
                const chunks = chunkText(textToEmbed);

                // 2b. Load: Embed and store the chunks
                await embedAndStore(chunks, { 
                    url: article.url,
                    category: category
                });
            }
        }

        console.log("Ingestion complete!");

    } catch (error) {
        console.error("Ingestion failed:", error);
    }

}

main();