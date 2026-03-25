"use client";

import { motion } from "framer-motion";
import { ShieldCheck, CalendarClock, Lock } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

export default function SignupPage() {
  const handleGoogleLogin = () => {
    try {
      window.location.href = `${process.env.NEXT_PUBLIC_SERVER_URL}/users/google`;
    } catch (err: any) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-[linear-linear(to_right,#4c1d9515_1px,transparent_1px),linear-linear(to_bottom,#4c1d9515_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-linear(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#05000a]/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(147,51,234,0.15)] overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-purple-400 to-transparent opacity-50" />

          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(147,51,234,0.2)]"
            >
              <Lock className="text-purple-400" size={28} />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Initialize Clara
            </h1>
            <p className="text-zinc-400 text-sm">
              Secure your schedule and deploy your autonomous proxy.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-sm text-zinc-300 bg-white/5 p-3 rounded-lg border border-white/5">
              <CalendarClock size={18} className="text-purple-400 shrink-0" />
              <p>Grants read-only access to triage your daily meetings.</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-300 bg-white/5 p-3 rounded-lg border border-white/5">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
              <p>OAuth 2.0 encrypted. Clara never sees your password.</p>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="cursor-pointer w-full group relative flex items-center justify-center gap-3 bg-white text-black font-semibold text-lg py-4 px-6 rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            <FcGoogle size={24} />
            <span>Continue with Google</span>
          </button>

          <p className="text-center text-xs text-zinc-500 mt-6">
            By connecting, you authorize Clara to join designated meetings on
            your behalf.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
