import { SignIn } from "@clerk/react";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-bg-base">
      {/* Ambient blobs */}
      <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-175 max-h-175 rounded-full bg-purple-600/7 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-[10%] -right-[5%] w-[50vw] h-[50vw] max-w-150 max-h-150 rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
          <Globe className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="font-pacifico text-2xl text-white group-hover:text-purple-300 transition-colors">Nexus</span>
      </Link>

      <SignIn
        path="/login"
        routing="path"
        signUpUrl="/signup"
        forceRedirectUrl="/chat"
        appearance={{
          variables: {
            colorPrimary: "#7c3aed",
            colorBackground: "#0d1117",
            colorText: "#f0f6fc",
            colorTextSecondary: "#8b949e",
            colorInputBackground: "#161b22",
            colorInputText: "#f0f6fc",
            borderRadius: "12px",
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          },
          elements: {
            card: "shadow-2xl shadow-black/60 border border-white/6",
            headerTitle: "text-text-primary font-semibold",
            socialButtonsBlockButton: "border-white/10 hover:bg-white/5 text-text-secondary",
            dividerLine: "bg-white/6",
            formFieldInput: "border-white/10 focus:border-purple-500/50",
            footerActionLink: "text-purple-400 hover:text-purple-300",
          },
        }}
      />
    </div>
  );
}
