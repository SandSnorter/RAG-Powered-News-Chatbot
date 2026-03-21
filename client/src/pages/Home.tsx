import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, SignInButton, SignUpButton } from "@clerk/react";
import { Brain, Zap, Database, Shield, Search, ArrowRight, MessageSquare, ChevronRight, Globe, Clock, Layers, Cpu } from "lucide-react";

const STATS = [
  { value: "560+", label: "Articles Indexed" },
  { value: "<100ms", label: "Vector Search" },
  { value: "SSE", label: "Real-time Stream" },
  { value: "3 DBs", label: "Multi-layer Storage" },
];

const FEATURES = [
  { icon: Brain, title: "RAG Intelligence", desc: "Doesn't guess — retrieves. Every answer is grounded in real news articles fetched from a Qdrant vector database using cosine similarity search.", color: "from-purple-500/20 to-purple-600/5", border: "hover:border-purple-500/30", iconColor: "text-purple-400", iconBg: "bg-purple-500/10" },
  { icon: Zap, title: "Real-time Streaming", desc: "Server-Sent Events deliver Gemini's response token-by-token the moment they're generated — zero buffering, zero waiting.", color: "from-blue-500/20 to-blue-600/5", border: "hover:border-blue-500/30", iconColor: "text-blue-400", iconBg: "bg-blue-500/10" },
  { icon: MessageSquare, title: "Conversation Memory", desc: "Redis caches your last 5 exchanges in sub-millisecond memory. Ask follow-ups naturally — Nexus always knows the context.", color: "from-emerald-500/20 to-emerald-600/5", border: "hover:border-emerald-500/30", iconColor: "text-emerald-400", iconBg: "bg-emerald-500/10" },
  { icon: Search, title: "Semantic Vector Search", desc: "Jina AI maps your query into a 768-dimensional embedding space. Qdrant finds semantically similar articles — not keyword matches.", color: "from-orange-500/20 to-orange-600/5", border: "hover:border-orange-500/30", iconColor: "text-orange-400", iconBg: "bg-orange-500/10" },
  { icon: Shield, title: "Secure by Design", desc: "Clerk authentication + cryptographically verified Svix webhooks. Your data is user-scoped and never shared across sessions.", color: "from-rose-500/20 to-rose-600/5", border: "hover:border-rose-500/30", iconColor: "text-rose-400", iconBg: "bg-rose-500/10" },
  { icon: Database, title: "Multi-layer Storage", desc: "MongoDB persists conversation history. Redis handles live context. Qdrant stores vectors. Three databases, one seamless experience.", color: "from-violet-500/20 to-violet-600/5", border: "hover:border-violet-500/30", iconColor: "text-violet-400", iconBg: "bg-violet-500/10" },
];

const STEPS = [
  { step: "01", icon: MessageSquare, title: "You Ask", desc: "Type any question about current events. Natural language — no special syntax needed." },
  { step: "02", icon: Cpu, title: "Jina Embeds", desc: "Your query is converted into a 768-dim vector capturing its full semantic meaning." },
  { step: "03", icon: Search, title: "Qdrant Retrieves", desc: "Cosine similarity search returns the 3 most relevant news articles from the database." },
  { step: "04", icon: Zap, title: "Gemini Streams", desc: "Context + history + query go to Gemini 2.5 Flash. The answer streams back in real time." },
];

const TECH = [
  { name: "React 19", color: "#61DAFB" }, { name: "TypeScript", color: "#3178C6" },
  { name: "Node.js", color: "#339933" }, { name: "Express", color: "#8b949e" },
  { name: "Gemini AI", color: "#4285F4" }, { name: "Jina AI", color: "#a855f7" },
  { name: "Qdrant", color: "#DC143C" }, { name: "Redis", color: "#FF4438" },
  { name: "MongoDB", color: "#47A248" }, { name: "Clerk", color: "#6C47FF" },
  { name: "Docker", color: "#2496ED" }, { name: "Tailwind", color: "#06B6D4" },
];

export default function Home() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) navigate("/chat");
  }, [isSignedIn, navigate]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] max-w-225 max-h-225 rounded-full bg-purple-600/7 blur-[120px] animate-glow-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] max-w-200 max-h-200 rounded-full bg-blue-600/5 blur-[120px] animate-glow-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/6">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-pacifico text-2xl text-white group-hover:text-purple-300 transition-colors">Nexus</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pipeline" className="hover:text-white transition-colors">Pipeline</a>
            <a href="#tech" className="hover:text-white transition-colors">Stack</a>
          </div>
          <div className="flex items-center gap-3">
            <SignInButton mode="modal" forceRedirectUrl="/chat">
              <button className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white border border-white/10 hover:border-white/20 rounded-full transition-all">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/chat">
              <button className="px-4 py-2 text-sm font-semibold text-white bg-linear-to-r from-purple-600 to-blue-600 rounded-full hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/30">
                Get Started Free
              </button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                RAG-Powered · Gemini 2.5 Flash · Real-time SSE
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
                The AI that
                <br />
                <span className="gradient-text">reads the news</span>
                <br />
                for you.
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-xl">
                Ask anything about today's world. Nexus retrieves real articles, reasons over them with Gemini 2.5, and streams a grounded answer — never a hallucination.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <SignUpButton mode="modal" forceRedirectUrl="/chat">
                  <button className="group flex items-center gap-2 px-6 py-3.5 bg-linear-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/40">
                    Start for Free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </SignUpButton>
                <a href="#pipeline" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-white transition-colors">
                  How it works <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Mock chat card */}
            <div className="flex-1 w-full max-w-lg animate-float">
              <div className="glass rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/6 bg-white/1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/60" />
                  <span className="text-xs font-medium text-text-secondary">Nexus Intelligence</span>
                  <span className="ml-auto text-xs text-text-muted">Gemini 2.5 · RAG</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-end">
                    <div className="max-w-[80%] px-4 py-2.5 bg-linear-to-br from-purple-600 to-purple-700 rounded-2xl rounded-tr-sm text-sm text-white shadow-md">
                      What happened with Apple and the EU today?
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-purple-900/40">
                      <Globe className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 px-4 py-3 glass-surface rounded-2xl rounded-tl-sm text-sm">
                      <p className="text-text-primary font-medium mb-2">Based on retrieved articles:</p>
                      <ul className="space-y-1.5 text-xs text-text-secondary">
                        <li className="flex gap-2"><span className="text-purple-400 mt-0.5 shrink-0">•</span>Apple faces €500M fine under EU Digital Markets Act</li>
                        <li className="flex gap-2"><span className="text-purple-400 mt-0.5 shrink-0">•</span>App Store interoperability requirements take effect</li>
                        <li className="flex gap-2"><span className="text-purple-400 mt-0.5 shrink-0">•</span>Apple appeals decision, citing security concerns</li>
                      </ul>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex gap-1">
                          {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                        </div>
                        <span className="text-[10px] text-text-muted">Sourced from 3 articles</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 border-t border-white/6 bg-black/20">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-white/4 border border-white/7 rounded-full">
                    <span className="text-sm text-text-muted flex-1">Ask about today&#39;s news...</span>
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 border-y border-white/5 bg-white/0.8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold gradient-text-purple">{s.value}</div>
                <div className="text-xs text-text-muted mt-1.5 font-medium uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/4 border border-white/8 text-text-secondary text-xs font-medium mb-4">
              <Layers className="w-3.5 h-3.5" /> Engineering Excellence
            </div>
            <h2 className="text-4xl font-bold mb-4 text-text-primary">Built for precision, not magic</h2>
            <p className="text-text-secondary max-w-xl mx-auto">Every component is purpose-built. Observable, deterministic, and production-grade.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className={`glass-card rounded-2xl p-6 bg-linear-to-br ${f.color} border border-white/6 ${f.border} transition-all duration-300`}>
                <div className={`w-10 h-10 ${f.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section id="pipeline" className="py-24 px-6 border-t border-white/4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/4 border border-white/8 text-text-secondary text-xs font-medium mb-4">
              <Clock className="w-3.5 h-3.5" /> Request Lifecycle
            </div>
            <h2 className="text-4xl font-bold text-text-primary mb-4">From question to answer in milliseconds</h2>
            <p className="text-text-secondary max-w-xl mx-auto">A fully observable pipeline. No black boxes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => (
              <div key={step.step} className="relative">
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+32px)] right-[-50%] h-px bg-linear-to-r from-purple-500/30 to-transparent" />
                )}
                <div className="glass-card rounded-2xl p-6 text-center border border-white/6 hover:border-purple-500/20 transition-all">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-linear-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-xs font-mono text-purple-500 mb-1">{step.step}</div>
                  <h3 className="font-semibold text-text-primary mb-2">{step.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="py-16 px-6 border-t border-white/4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted mb-8">Powered by industry-leading technology</p>
          <div className="flex flex-wrap justify-center gap-3">
            {TECH.map((t) => (
              <div key={t.name} className="px-4 py-2 rounded-full glass-surface border border-white/7 text-sm font-medium text-text-secondary hover:text-white hover:border-white/20 transition-all cursor-default">
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle" style={{ backgroundColor: t.color }} />
                {t.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12 border border-white/8 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-purple-600/10 to-blue-600/10 pointer-events-none" />
            <h2 className="relative text-4xl font-bold text-text-primary mb-4">Ready to get smarter<br />about the news?</h2>
            <p className="relative text-text-secondary mb-8 max-w-md mx-auto">Join Nexus and get factual, sourced, AI-powered answers — free, forever.</p>
            <SignUpButton mode="modal" forceRedirectUrl="/chat">
              <button className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full hover:from-purple-500 hover:to-blue-500 transition-all shadow-xl shadow-purple-900/40 text-base">
                Start for Free <ArrowRight className="w-5 h-5" />
              </button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/4 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Globe className="w-3 h-3 text-white" />
            </div>
            <span className="font-pacifico text-lg text-white">Nexus</span>
          </div>
          <p className="text-xs text-text-muted">RAG-Powered News Intelligence · Built with Gemini 2.5, Qdrant &amp; Jina AI</p>
        </div>
      </footer>
    </div>
  );
}
