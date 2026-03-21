import { Link, useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/react";
import { Globe, Plus, MessageSquare, Compass, Trash2, ChevronRight } from "lucide-react";

export interface ChatSession {
  sessionId: string;
  preview: string;
  timestamp: string;
  isActive?: boolean;
}

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onClearHistory: () => void;
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Sidebar({ sessions, activeSessionId, onNewChat, onSelectSession, onClearHistory }: SidebarProps) {
  const { user } = useUser();
  const navigate = useNavigate();

  const todaySessions = sessions.filter(s => {
    const d = new Date(s.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const olderSessions = sessions.filter(s => {
    const d = new Date(s.timestamp);
    const now = new Date();
    return d.toDateString() !== now.toDateString();
  });

  return (
    <aside className="w-65 shrink-0 h-screen flex flex-col glass border-r border-white/6 overflow-hidden">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2.5 group mb-4">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Globe className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-pacifico text-xl text-white group-hover:text-purple-300 transition-colors">Nexus</span>
        </Link>

        {/* New Chat */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-linear-to-r from-purple-600/20 to-blue-600/10 border border-purple-500/20 text-text-primary text-sm font-medium hover:from-purple-600/30 hover:to-blue-600/20 hover:border-purple-500/40 transition-all group"
        >
          <div className="w-5 h-5 rounded-md bg-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/50 transition-colors">
            <Plus className="w-3 h-3 text-purple-300" />
          </div>
          New Chat
        </button>
      </div>

      {/* Navigation */}
      <div className="px-3 py-3 border-b border-white/4">
        <button onClick={() => navigate("/chat")} className="sidebar-item w-full">
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>Chat</span>
        </button>
        <button onClick={() => navigate("/discover")} className="sidebar-item w-full mt-0.5">
          <Compass className="w-4 h-4 shrink-0" />
          <span>Discover</span>
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-3">
            <MessageSquare className="w-6 h-6 text-text-muted mb-2" />
            <p className="text-xs text-text-muted">No conversations yet. Start chatting!</p>
          </div>
        ) : (
          <>
            {todaySessions.length > 0 && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted px-2 mb-1.5">Today</p>
                {todaySessions.map(s => (
                  <SessionItem key={s.sessionId} session={s} isActive={s.sessionId === activeSessionId} onClick={() => onSelectSession(s.sessionId)} />
                ))}
              </>
            )}
            {olderSessions.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted px-2 mb-1.5">Earlier</p>
                {olderSessions.map(s => (
                  <SessionItem key={s.sessionId} session={s} isActive={s.sessionId === activeSessionId} onClick={() => onSelectSession(s.sessionId)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom — user + clear */}
      <div className="px-3 py-3 border-t border-white/5 space-y-2">
        <button
          onClick={onClearHistory}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-text-secondary text-xs font-medium hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5 shrink-0" />
          Clear History
        </button>

        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <UserButton
            appearance={{
              variables: { colorPrimary: "#7c3aed" },
              elements: { avatarBox: "w-7 h-7" }
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{user?.firstName || user?.username || "User"}</p>
            <p className="text-[10px] text-text-muted truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
        </div>
      </div>
    </aside>
  );
}

function SessionItem({ session, isActive, onClick }: { session: ChatSession; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`sidebar-item w-full mb-0.5 ${isActive ? "active" : ""}`}
      title={session.preview}
    >
      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
      <span className="flex-1 text-left overflow-hidden text-ellipsis whitespace-nowrap text-xs">{session.preview}</span>
      <span className="shrink-0 text-[10px] text-text-muted">{timeAgo(session.timestamp)}</span>
    </button>
  );
}
