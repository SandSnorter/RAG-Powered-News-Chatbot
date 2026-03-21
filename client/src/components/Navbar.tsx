// CLAUDE: Flagged for deletion - reason: superseded by Sidebar.tsx and page-level navbars (Home.tsx, Chat.tsx header)
// This component is no longer imported by any file.

import { Link } from "react-router-dom";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-12 py-4 bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      
      {/* Brand & Logo */}
      <div>
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/assets/logoo.png" alt="Nexus Logo" className="h-10 w-auto" />
          <span className="font-pacifico text-3xl text-white transition-colors group-hover:text-purple-400">
            Nexus
          </span>
        </Link>
      </div>

      {/* Authentication Controls */}
      <div className="flex items-center gap-4">
        
        {/* Rendered only for unauthenticated users */}
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="px-5 py-2 text-sm font-medium text-white bg-transparent border border-white/20 rounded-full transition-all hover:bg-white/10">
              Log In
            </button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button className="px-5 py-2 text-sm font-medium text-black bg-white shadow-lg shadow-white/5 rounded-full transition-all hover:bg-neutral-200">
              Get Started
            </button>
          </SignUpButton>
        </Show>

        {/* Rendered only for authenticated users */}
        <Show when="signed-in">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Welcome back!</span>
            <UserButton />
          </div>
        </Show>

      </div>
    </nav>
  );
};

export default Navbar;