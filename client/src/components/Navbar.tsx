import { Link } from "react-router-dom"
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center px-55 py-4 bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div>
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/assets/logoo.png" alt="logo" className="h-10 w-auto"/>
          <span className="font-pacifico text-white text-3xl group-hover:text-purple-400 transition-colors">Nexus</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Show when="signed-out">
          {/* Custom Styled Login Button */}
          <SignInButton mode="modal">
            <button className="px-5 py-2 text-sm font-medium text-white bg-transparent border border-white/20 rounded-full hover:bg-white/10 transition-all">
              Log In
            </button>
          </SignInButton>

          {/* Custom Styled Sign Up Button */}
          <SignUpButton mode="modal">
            <button className="px-5 py-2 text-sm font-medium text-black bg-white rounded-full hover:bg-neutral-200 transition-all shadow-lg shadow-white/5">
              Get Started
            </button>
          </SignUpButton>
        </Show>

        <Show when="signed-in">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Welcome back!</span>
            <UserButton afterSwitchSessionUrl="/"/>
          </div>
        </Show>
      </div>
    </nav>
  )
}

export default Navbar