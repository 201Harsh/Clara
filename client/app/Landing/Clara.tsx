"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  Bot,
  Calendar,
  EyeOff,
  BrainCircuit,
  Zap,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { SiGooglemeet, SiZoom } from "react-icons/si";

export default function ClaraLandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  // GSAP Hero Animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-text", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power4.out",
        delay: 0.2,
      });
      gsap.from(".hero-badge", {
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        ease: "back.out(1.7)",
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="min-h-screen bg-[#050014] text-zinc-100 font-sans selection:bg-fuchsia-500/30">
      {/* 1. HERO SECTION */}
      <section
        ref={heroRef}
        className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-4"
      >
        {/* Neon Purple Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,rgba(0,0,0,0)_60%)]" />

        <div className="hero-badge mb-6 px-4 py-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 text-sm font-medium flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <ShieldAlert size={14} /> Agent Status: Online & Ready
        </div>

        <h1 className="hero-text text-6xl md:text-8xl font-bold text-center tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-purple-100 to-purple-500">
          Meet Clara.
          <br />
          Your Ghost PA.
        </h1>

        <p className="hero-text text-lg md:text-xl text-purple-200/70 max-w-2xl text-center mb-10">
          The autonomous assistant that reads your schedule, silently attends
          the meetings you skip, and delivers perfect summaries directly to your
          dashboard.
        </p>

        <div className="hero-text flex flex-col sm:flex-row gap-4 z-10">
          <button className="px-8 py-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]">
            Connect Google Calendar <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* 2. CALENDAR TRIAGE */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="grid md:grid-cols-2 gap-16 items-center"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Calendar className="text-purple-400" size={24} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Intelligent Schedule Triage
            </h2>
            <p className="text-zinc-400 leading-relaxed text-lg">
              Clara understands your specific role and priorities. Every
              morning, she scans your calendar to decide which meetings require
              your actual physical presence, and which ones she can handle for
              you in the background.
            </p>
          </div>
          <div className="bg-[#0a051e] border border-purple-500/20 rounded-2xl p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-sm">
            <pre className="text-sm text-fuchsia-300 overflow-x-auto">
              <code>
                {`[
  { 
    "title": "Client Pitch", 
    "decision": "human", 
    "reason": "Requires your direct presence." 
  },
  { 
    "title": "Weekly All-Hands", 
    "decision": "bot", 
    "reason": "General update. Clara will attend." 
  }
]`}
              </code>
            </pre>
          </div>
        </motion.div>
      </section>

      {/* 3. STEALTH INFILTRATION */}
      <section className="py-24 px-4 bg-[#080414] border-y border-purple-900/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <div className="order-2 md:order-1 flex gap-4 justify-center md:justify-start">
              <div className="w-32 h-32 rounded-2xl bg-[#0d0626] border border-purple-500/20 flex items-center justify-center flex-col gap-2 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
                <SiGooglemeet size={40} className="text-green-400" />
                <span className="text-xs text-purple-300/60 font-medium">
                  Proxy Joined
                </span>
              </div>
              <div className="w-32 h-32 rounded-2xl bg-[#0d0626] border border-purple-500/20 flex items-center justify-center flex-col gap-2 translate-y-8 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
                <SiZoom size={40} className="text-blue-400" />
                <span className="text-xs text-purple-300/60 font-medium">
                  Audio Secured
                </span>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center mb-6 border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
                <EyeOff className="text-fuchsia-400" size={24} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ghost Infiltration Mode
              </h2>
              <p className="text-zinc-400 leading-relaxed text-lg">
                When it is time for a meeting you are skipping, Clara
                automatically connects. She bypasses waiting rooms, mutes her
                microphone, and sits silently in the call as your designated
                proxy, capturing every word spoken.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. THE BRAIN */}
      <section className="py-24 px-4 max-w-7xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-3xl mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <BrainCircuit className="text-purple-400" size={32} />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Infinite Memory. Perfect Recall.
          </h2>
          <p className="text-zinc-400 leading-relaxed text-lg mb-12">
            Even if a meeting lasts for hours, Clara never loses focus. She
            digests the entire conversation instantly, understanding nuance,
            tracking action items, and filtering out the noise.
          </p>
        </motion.div>
      </section>

      {/* 5. ACTIONABLE SYNTHESIS & 6. FOOTER CTA */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent to-[#1a0b38]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0a051e] border border-fuchsia-500/30 mb-8 shadow-[0_0_30px_rgba(217,70,239,0.3)]">
              <Zap className="text-fuchsia-400" size={28} />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Stop attending meetings you don't need to.
            </h2>
            <p className="text-xl text-purple-200/60 mb-10">
              Get perfectly structured summaries and extracted action items
              delivered directly to your dashboard moments after the call ends.
            </p>
            <button className="px-10 py-5 rounded-full bg-white text-purple-950 font-bold text-lg hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              Deploy Clara Now
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
