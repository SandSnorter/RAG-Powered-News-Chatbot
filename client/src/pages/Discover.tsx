import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { Globe, Cpu, TrendingUp, Heart, FlaskConical, Briefcase, Gamepad2, Globe2, ArrowRight, Zap } from "lucide-react";
import Sidebar, { type ChatSession } from "../components/Sidebar";
import { v4 as uuidv4 } from "uuid";

const CATEGORIES = [
  {
    icon: Globe2, label: "World News", desc: "International events, diplomacy, and geopolitics",
    color: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-400", iconBg: "bg-blue-500/10",
    query: "What are the major world events happening today?",
    questions: [
      "What's the latest on the Russia-Ukraine conflict?",
      "Are there any new developments in US-China relations?",
      "What's happening with the Gaza ceasefire negotiations?",
      "Which countries are facing political instability right now?",
    ],
  },
  {
    icon: Cpu, label: "Technology", desc: "AI, startups, software, and the digital economy",
    color: "from-purple-500/20 to-purple-600/5", iconColor: "text-purple-400", iconBg: "bg-purple-500/10",
    query: "What's happening in tech and AI today?",
    questions: [
      "What are the latest AI model releases and updates?",
      "Are there any major tech company layoffs or hiring news?",
      "What's new in the smartphone and consumer tech space?",
      "Are there any big cybersecurity incidents in the news?",
    ],
  },
  {
    icon: Briefcase, label: "Business", desc: "Markets, earnings, M&A, and economic news",
    color: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-400", iconBg: "bg-emerald-500/10",
    query: "What are the top business and financial stories right now?",
    questions: [
      "How did the stock market perform this week?",
      "Are there any major mergers or acquisitions in the news?",
      "What's the Federal Reserve's latest stance on interest rates?",
      "Which companies just released their quarterly earnings?",
    ],
  },
  {
    icon: FlaskConical, label: "Science", desc: "Research, space, climate, and discoveries",
    color: "from-orange-500/20 to-orange-600/5", iconColor: "text-orange-400", iconBg: "bg-orange-500/10",
    query: "What are the latest scientific breakthroughs and discoveries?",
    questions: [
      "What's the latest in space exploration and NASA missions?",
      "Are there any new climate change reports or findings?",
      "What recent scientific discoveries have been announced?",
      "What's new in renewable energy and sustainability research?",
    ],
  },
  {
    icon: Heart, label: "Health", desc: "Medicine, public health, and wellness research",
    color: "from-rose-500/20 to-rose-600/5", iconColor: "text-rose-400", iconBg: "bg-rose-500/10",
    query: "What's the latest news in health and medicine?",
    questions: [
      "Are there any new drug approvals or medical breakthroughs?",
      "What's the latest on global disease outbreaks or pandemics?",
      "Are there new studies on mental health or nutrition?",
      "What public health policies are being debated right now?",
    ],
  },
  {
    icon: Gamepad2, label: "Entertainment", desc: "Film, music, gaming, and cultural news",
    color: "from-yellow-500/20 to-yellow-600/5", iconColor: "text-yellow-400", iconBg: "bg-yellow-500/10",
    query: "What's happening in entertainment, movies, and gaming?",
    questions: [
      "What are the biggest box office hits right now?",
      "Are there any major gaming releases or announcements?",
      "What's trending in music and award shows?",
      "Which new TV shows or streaming series are making headlines?",
    ],
  },
];

export default function DiscoverPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate("/");
  }, [isLoaded, isSignedIn, navigate]);

  const goToChat = (query: string) => {
    navigate("/chat", { state: { initialQuery: query } });
  };

  const goToChatWithCategory = (cat: typeof CATEGORIES[number]) => {
    navigate("/chat", { state: { suggestions: cat.questions } });
  };

  const emptySessions: ChatSession[] = [];
  const dummyId = uuidv4();

  if (!isLoaded) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-bg-base">
      {/* Sidebar */}
      <Sidebar
        sessions={emptySessions}
        activeSessionId={dummyId}
        onNewChat={() => navigate("/chat")}
        onSelectSession={() => navigate("/chat")}
        onClearHistory={() => {}}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="sticky top-0 z-10 glass border-b border-white/6 px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-text-primary">Discover</h1>
              <p className="text-xs text-text-muted">Explore today&#39;s news by topic</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-8 max-w-5xl">
          {/* Trending section */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-semibold text-text-primary">Trending Now</h2>
              <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Zap className="w-2.5 h-2.5 text-orange-400" />
                <span className="text-[10px] font-medium text-orange-400">Live</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["EU AI Act", "Apple vs EU", "Gemini 2.5", "Gaza Ceasefire", "Fed Rate Decision", "OpenAI o3", "SpaceX Launch", "Tesla Earnings"].map(topic => (
                <button
                  key={topic}
                  onClick={() => goToChat(`Tell me about ${topic} in the news`)}
                  className="px-3.5 py-1.5 rounded-full glass-surface border border-white/7 text-sm text-text-secondary hover:text-text-primary hover:border-purple-500/25 hover:bg-purple-500/5 transition-all"
                >
                  {topic}
                </button>
              ))}
            </div>
          </section>

          {/* Categories — click to open chat with category questions */}
          <section>
            <h2 className="text-sm font-semibold text-text-primary mb-4">Browse by Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => goToChatWithCategory(cat)}
                  className={`glass-card p-5 rounded-2xl border border-white/6 bg-linear-to-br ${cat.color} text-left group hover:border-opacity-40 transition-all duration-300`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 ${cat.iconBg} rounded-xl flex items-center justify-center`}>
                      <cat.icon className={`w-4.5 h-4.5 ${cat.iconColor}`} />
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-1 text-sm">{cat.label}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{cat.desc}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
