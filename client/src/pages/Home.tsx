import { Show } from "@clerk/react";
import Navbar from "../components/Navbar";
import ChatInterface from "../components/ChatInterface";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {/* Replaced <Show when="signed-out"> */}
        <Show when="signed-out">
          <h1 className="text-6xl font-bold tracking-tighter mb-4 text-white">
            Welcome to <span className="text-purple-500">Nexus</span>
          </h1>

          <p className="text-gray-400 max-w-2xl text-lg leading-relaxed text-center">
            The intelligent bridge between world news and actionable insights.
            Experience a RAG-powered chatbot that analyzes, summarizes, and
            remembers your conversations using Gemini AI and MongoDB.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
            {/* Feature 1 */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/50 transition-colors group flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-purple-500 text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">RAG Intelligence</h3>
              <p className="text-sm text-gray-400 leading-relaxed text-center">
                Nexus doesn't just "chat." It retrieves live context from news
                articles using Qdrant vector search to provide factual, source-cited answers.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/50 transition-colors group flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-purple-500 text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Real-time Stream</h3>
              <p className="text-sm text-gray-400 leading-relaxed text-center">
                Engineered with Server-Sent Events (SSE) for a seamless "typing" effect. Get low-latency responses powered by Gemini 1.5 Flash.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/50 transition-colors group flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-purple-500 text-2xl">💾</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Smart History</h3>
              <p className="text-sm text-gray-400 leading-relaxed text-center">
                Securely store your unique chat sessions in MongoDB. Switch devices and pick up exactly where you left off.
              </p>
            </div>
          </div>
        </Show>

        {/* Replaced <Show when="signed-in"> */}
        <Show when="signed-in">
          <div className="w-full flex flex-col items-center gap-6 animate-in fade-in duration-700">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold text-white">Nexus Chat</h2>
              <p className="text-gray-400">Powered by Gemini 2.5 & RAG</p>
            </div>
            <ChatInterface />
          </div>
        </Show>
      </main>
    </div>
  );
};

export default Home;
