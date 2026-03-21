import { SignUp } from "@clerk/react";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#080b14]">
      <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-purple-600/[0.07] blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-[10%] -right-[5%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-blue-600/[0.05] blur-[100px] pointer-events-none" />

      <Link to="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
          <Globe className="w-4 h-4 text-white" />
        </div>
        <span className="font-pacifico text-2xl text-white group-hover:text-purple-300 transition-colors">Nexus</span>
      </Link>

      <SignUp
        path="/signup"
        routing="path"
        signInUrl="/login"
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
            card: "shadow-2xl shadow-black/60 border border-white/[0.06]",
            headerTitle: "text-[#f0f6fc] font-semibold",
            socialButtonsBlockButton: "border-white/10 hover:bg-white/5 text-[#8b949e]",
            dividerLine: "bg-white/[0.06]",
            formFieldInput: "border-white/10 focus:border-purple-500/50",
            footerActionLink: "text-purple-400 hover:text-purple-300",
          },
        }}
      />
    </div>
  );
}
