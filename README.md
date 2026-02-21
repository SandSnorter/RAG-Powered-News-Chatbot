# AI News Sentinel: Enterprise-Grade RAG Chatbot

An intelligent, full-stack news assistant that uses **Retrieval-Augmented Generation (RAG)** to provide factual, context-aware answers from scraped news data. This project demonstrates modern SDE practices, including microservices containerization, vector databases, and real-time streaming.



## 🚀 Key Features
* **RAG Pipeline:** Extracts live news data, generates embeddings via Gemini/Jina, and stores them in **Qdrant** for semantic search.
* **Real-time Streaming:** Implements **Server-Sent Events (SSE)** for a "typewriter" UI effect, providing a superior UX over standard REST.
* **Contextual Memory:** Uses **Redis** to manage session-based chat history for multi-turn conversations.
* **Type-Safe Engineering:** Built entirely with **TypeScript** across the monorepo for robust error handling and developer productivity.
* **Production Ready:** Fully containerized using **Docker** and **Docker Compose** for one-command deployment.

---

## 🛠️ Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React (Vite), TypeScript, SCSS |
| **Backend** | Node.js, Express, TypeScript |
| **LLM / AI** | Google Gemini API, Jina Embeddings |
| **Vector DB** | Qdrant |
| **Cache** | Redis Stack |
| **DevOps** | Docker, Docker Compose |

---

## 🏗️ Architecture Overview
1.  **Ingestion (ETL):** A standalone script scrapes news, chunks the text, generates vector embeddings, and upserts them to **Qdrant**.
2.  **Retrieval:** When a user asks a question, the backend searches Qdrant for the most relevant article chunks.
3.  **Augmentation:** The system constructs a prompt combining the user query + retrieved context + chat history from **Redis**.
4.  **Generation:** The **Gemini API** generates a response which is streamed back to the **React** client via SSE.

---

## 🚦 Getting Started

### Prerequisites
* Docker & Docker Compose
* Gemini API Key

### Installation & Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/SandSnorter/RAG-Powered-News-Chatbot
   cd news-chatbot
