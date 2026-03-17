# 📰 RAG-Powered News Chatbot 

## 🚀 Overview
An enterprise-grade, event-driven chat application that utilizes **Retrieval-Augmented Generation (RAG)** to provide factual, up-to-date news analysis. 

Instead of relying on the static, pre-trained knowledge of an LLM, this microservice architecture intercepts the user's query, embeds it into a vector space, searches a local Rust-based vector database (Qdrant) for relevant news articles, and forces the LLM to generate responses strictly based on the retrieved context. 

## 🧠 Architecture & Data Flow

1. **Authentication (Event-Driven):** Users authenticate via **Clerk**. Upon creation, Clerk fires a secure webhook to the backend via **Ngrok**. The payload is cryptographically verified using **Svix** and saved to **MongoDB** via an idempotent upsert strategy.
2. **Context Retrieval (Memory):** When a user sends a message, the Node.js backend instantly fetches the last 5 conversation messages from **Redis** (in-memory caching) to provide the AI with sub-millisecond conversational context.
3. **Vector Embedding:** The user's query is sent to the **Jina Embeddings API** to be mapped into a high-dimensional vector space.
4. **Semantic Search (RAG):** The vector is queried against a local **Qdrant** database running in **Docker**. Qdrant performs cosine similarity math to retrieve the most factually relevant news articles.
5. **Generative AI & Streaming:** The chat history, the retrieved articles, and the user's prompt are compiled and sent to the **Google Gemini API**. The response is streamed back to the **React** frontend in real-time using **Server-Sent Events (SSE)**.

## 🛠️ Tech Stack
* **Frontend:** React, TypeScript, Tailwind CSS
* **Backend:** Node.js, Express, TypeScript
* **Databases:** * **MongoDB** (User metadata & profiles)
  * **Redis** (Ephemeral chat memory & context window)
  * **Qdrant** (Vector database for RAG)
* **AI / ML Pipeline:** * **Google Gemini API** (Generative LLM)
  * **Jina AI** (Embedding models)
* **DevOps & Auth:** Docker, Docker Compose, Clerk, Svix, Ngrok

## ✨ Key Engineering Features
* **Idempotent Webhooks:** Designed the `user.created` webhook to handle network retries and duplicate events gracefully using `findOneAndUpdate({ upsert: true })`, preventing `E11000 duplicate key` database crashes.
* **Optimized LLM Streaming (SSE):** Utilized one-way HTTP Server-Sent Events instead of WebSockets to stream generative text chunks to the client, reducing overhead and cleanly handling `undefined` stream artifacts.
* **Separation of Concerns:** Decoupled the embedding model (Jina) from the generative model (Gemini). This modular AI pipeline allows for seamless swapping of models without breaking the vector database.
* **Local Containerization:** Ran Qdrant and Redis locally via Docker to eliminate cloud latency during development and testing, while explicitly binding MongoDB to `127.0.0.1` to prevent port collisions between Docker and host networks.

## ⚙️ Local Development Setup

### 1. Prerequisites
* Node.js (v18+)
* Docker Desktop
* MongoDB Compass (Native)

### 2. Clone & Install
```bash
git clone https://github.com/SandSnorter/RAG-Powered-News-Chatbot.git
cd news-chatbot
npm install  # (Run in both /client and /server)
```

### 3. Environment Variables
#### A. Create a `.env` file in the `server` directory:
```env
GEMINI_API_KEY = your_key
JINA_API_KEY = your_key
NEWS_API_KEY = your_key

MONGO_URI = mongodb://127.0.0.1:27017/news_chatbot
PORT = 3001

# CLERK API KEYS
CLERK_PUBLISHABLE_KEY = your_key
CLERK_SECRET_KEY = your_key
CLERK_WEBHOOK_SECRET = your_key
```
#### B. Create a `.env` file in the `client` directory:
```env
VITE_CLERK_PUBLISHABLE_KEY = your_key
```

### 4. Boot Up Databases
Ensure Docker is running, then spin up Qdrant and Redis:
```bash
docker-compose up -d
```

### 5. Seed the Vector Database
Run the ingestion script in your server directory to embed your news articles and populate Qdrant:
```bash
npx ts-node src/scripts/injest.ts
```

### 6. Start the Application
```bash
# In the server directory:
npm start

# In the client directory:
npm run dev
```
