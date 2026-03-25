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
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* 1. HERO SECTION */}
      <section
        ref={heroRef}
        className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-4"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.1)_0%,rgba(0,0,0,0)_50%)]" />

        <div className="hero-badge mb-6 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium flex items-center gap-2 backdrop-blur-md">
          <ShieldAlert size={14} /> System Online: Llama 3.3 70B
        </div>

        <h1 className="hero-text text-6xl md:text-8xl font-bold text-center tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
          Meet Clara.
          <br />
          Your Ghost PA.
        </h1>

        <p className="hero-text text-lg md:text-xl text-zinc-400 max-w-2xl text-center mb-10">
          The autonomous AI agent that seamlessly triages your calendar,
          stealthily attends meetings as your proxy, and synthesizes infinite
          context.
        </p>

        <div className="hero-text flex flex-col sm:flex-row gap-4 z-10">
          <button className="px-8 py-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all flex items-center gap-2">
            Connect Google Calendar <ChevronRight size={18} />
          </button>
          <button className="px-8 py-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-semibold transition-all">
            View Architecture
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
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
              <Calendar className="text-blue-400" size={24} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Autonomous Triage Matrix
            </h2>
            <p className="text-zinc-400 leading-relaxed text-lg">
              Clara does not just read your calendar; she understands your role.
              By analyzing your daily schedule, she dynamically decides which
              meetings require your physical presence and which ones she handles
              as a proxy.
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
            <pre className="text-sm text-blue-300 overflow-x-auto">
              <code>
                {`[
  { 
    "title": "IRIS AI Meeting", 
    "decision": "human", 
    "reason": "1-on-1 requires presence" 
  },
  { 
    "title": "Weekly All-Hands", 
    "decision": "bot", 
    "reason": "General update, listen-only" 
  }
]`}
              </code>
            </pre>
          </div>
        </motion.div>
      </section>

      {/* 3. STEALTH INFILTRATION */}
      <section className="py-24 px-4 bg-zinc-950 border-y border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <div className="order-2 md:order-1 flex gap-4 justify-center md:justify-start">
              <div className="w-32 h-32 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-col gap-2">
                <SiGooglemeet size={40} className="text-green-500" />
                <span className="text-xs text-zinc-500 font-medium">
                  Bypassed
                </span>
              </div>
              <div className="w-32 h-32 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-col gap-2 translate-y-8">
                <SiZoom size={40} className="text-blue-500" />
                <span className="text-xs text-zinc-500 font-medium">
                  Infiltrated
                </span>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
                <EyeOff className="text-purple-400" size={24} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Puppeteer Stealth Protocol
              </h2>
              <p className="text-zinc-400 leading-relaxed text-lg">
                Powered by headless Chromium and evasion plugins. Clara bypasses
                waiting rooms, fakes media stream hardware to avoid permission
                blocks, and enters your calls silently to capture pure audio
                data.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. THE BRAIN (LLAMA 70B) */}
      <section className="py-24 px-4 max-w-7xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-3xl mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <BrainCircuit className="text-indigo-400" size={32} />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            70 Billion Parameters. Zero Context Lost.
          </h2>
          <p className="text-zinc-400 leading-relaxed text-lg mb-12">
            Clara processes hour-long transcripts instantly using Llama 3.3 70B
            via Groq for ultra-low latency, falling back to Gemini 2.5 Flash for
            infinite-context document synthesis.
          </p>
        </motion.div>
      </section>

      {/* 5. ACTIONABLE SYNTHESIS & 6. FOOTER CTA */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent to-indigo-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 mb-8">
              <Zap className="text-yellow-400" size={28} />
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Stop attending meetings you don't need to.
            </h2>
            <p className="text-xl text-zinc-400 mb-10">
              Get perfectly structured summaries, extracted action items, and
              complete transcripts delivered directly to your dashboard moments
              after the call ends.
            </p>
            <button className="px-10 py-5 rounded-full bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95">
              Deploy Clara Now
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
