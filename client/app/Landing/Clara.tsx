"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import {
  Calendar,
  EyeOff,
  BrainCircuit,
  Zap,
  ChevronRight,
  ShieldAlert,
  User,
  Bot,
  Activity,
  Lock,
} from "lucide-react";
import { SiGooglemeet } from "react-icons/si";

export default function ClaraLandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [logIndex, setLogIndex] = useState(0);

  const aiLogs = [
    "> Authenticating Google Calendar...",
    "> Scanning today's schedule: 4 events found.",
    "> Triage: 1-on-1 requires human presence.",
    "> Triage: All-Hands Sync delegated to proxy.",
    "> Booting stealth infiltration protocol...",
    "> Clara is standing by.",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % aiLogs.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [aiLogs.length]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-text", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power4.out",
        delay: 0.1,
      });
      gsap.from(".hero-widget", {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.6,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-12 px-4"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4c1d9522_1px,transparent_1px),linear-gradient(to_bottom,#4c1d9522_1px,transparent_1px)] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.15)_0%,rgba(0,0,0,0)_60%)]" />

        <div className="hero-text mb-6 px-4 py-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 text-sm font-medium flex items-center gap-2 backdrop-blur-md shadow-[0_0_20px_rgba(147,51,234,0.2)] z-10">
          <ShieldAlert size={14} /> Agent Status: Online & Ready
        </div>

        <h1 className="hero-text text-6xl md:text-8xl font-extrabold text-center tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-b from-white via-zinc-100 to-purple-200/50 z-10">
          Meet Clara.
          <br />
          Your Ghost PA.
        </h1>

        <p className="hero-text text-lg md:text-xl text-zinc-400 max-w-2xl text-center mb-10 z-10">
          The autonomous assistant that reads your schedule, silently attends
          the meetings you skip, and delivers perfect summaries directly to your
          dashboard.
        </p>

        <div className="hero-text flex flex-col sm:flex-row gap-4 z-10 mb-16">
          <button className="px-8 py-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)]">
            Connect Google Calendar <ChevronRight size={18} />
          </button>
        </div>

        <div className="hero-widget w-full max-w-3xl z-10 perspective-1000">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="bg-[#05000a]/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(147,51,234,0.15)] relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4 border-b border-purple-500/20 pb-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Activity size={18} className="animate-pulse" />
                <span className="text-sm font-mono font-semibold tracking-wider uppercase">
                  Live Engine Feed
                </span>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              </div>
            </div>

            <div className="h-24 flex flex-col justify-end font-mono text-sm text-zinc-400">
              <AnimatePresence mode="popLayout">
                {aiLogs
                  .slice(0, logIndex + 1)
                  .slice(-3)
                  .map((log, i) => (
                    <motion.div
                      key={log}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: i === 2 ? 1 : 0.5, x: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="py-1 flex items-center gap-2"
                    >
                      <span className="text-purple-500">$</span> {log}
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
            <div className="absolute top-0 left-0 w-[200%] h-full bg-linear-to-r from-transparent via-purple-500/5 to-transparent -rotate-45 -translate-x-full animate-[shimmer_3s_infinite]" />
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="grid md:grid-cols-2 gap-16 items-center"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.15)]">
              <Calendar className="text-purple-400" size={24} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Intelligent Schedule Triage
            </h2>
            <p className="text-zinc-400 leading-relaxed text-lg">
              Every morning, Clara scans your calendar. She identifies which
              meetings require your actual physical presence (like 1-on-1s), and
              which ones are just general updates that she can attend on your
              behalf.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-[#050505] border border-zinc-800 rounded-xl p-5 flex items-center justify-between shadow-lg">
              <div>
                <h3 className="font-semibold text-white">
                  Client Pitch Presentation
                </h3>
                <p className="text-sm text-zinc-500">10:00 AM • Google Meet</p>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-sm font-medium">
                <User size={14} /> You Attend
              </div>
            </div>
            <div className="bg-[#0a0314] border border-purple-500/40 rounded-xl p-5 flex items-center justify-between shadow-[0_0_30px_rgba(147,51,234,0.15)] relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              <div>
                <h3 className="font-semibold text-white">
                  Weekly All-Hands Sync
                </h3>
                <p className="text-sm text-zinc-500">1:30 PM • Zoom</p>
              </div>
              <div className="flex items-center gap-2 text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full text-sm font-medium">
                <Bot size={14} /> Proxy Attends
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="py-24 px-4 bg-[#030008] border-y border-purple-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-125 h-125 bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <div className="order-2 md:order-1 flex gap-4 justify-center md:justify-start">
              <div className="w-32 h-32 rounded-2xl bg-[#050505] border border-zinc-800 flex items-center justify-center flex-col gap-2 shadow-xl">
                <SiGooglemeet size={40} className="text-zinc-600" />
                <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                  <Lock size={12} /> Silenced
                </span>
              </div>
              <div className="w-32 h-32 rounded-2xl bg-[#0a0314] border border-purple-500/30 flex items-center justify-center flex-col gap-2 translate-y-8 shadow-[0_0_30px_rgba(147,51,234,0.15)]">
                <EyeOff size={40} className="text-purple-400" />
                <span className="text-xs text-purple-300/80 font-medium">
                  Ghost Infiltrated
                </span>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.15)]">
                <Activity className="text-purple-400" size={24} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ghost Infiltration Mode
              </h2>
              <p className="text-zinc-400 leading-relaxed text-lg">
                When it is time for a meeting you are skipping, Clara
                automatically connects. She bypasses waiting rooms, secures
                audio permissions, and sits silently in the call as your
                designated proxy, capturing every word spoken without
                interrupting the flow.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4 max-w-7xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-3xl mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6 border border-purple-500/30 shadow-[0_0_20px_rgba(147,51,234,0.15)]">
            <BrainCircuit className="text-purple-400" size={32} />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Infinite Memory. Perfect Recall.
          </h2>
          <p className="text-zinc-400 leading-relaxed text-lg mb-12">
            Even if a meeting lasts for hours, Clara never loses focus. She
            digests the entire conversation instantly, understanding nuance,
            tracking action items, and filtering out the noise so you only get
            what matters.
          </p>
        </motion.div>
      </section>

      <section className="py-24 px-4 bg-linear-to-b from-black to-[#0a0314] border-t border-purple-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#050505] border border-purple-500/40 mb-8 shadow-[0_0_30px_rgba(147,51,234,0.2)]">
              <Zap className="text-purple-400" size={28} />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Stop attending meetings you don't need to.
            </h2>
            <p className="text-xl text-zinc-400 mb-10">
              Get perfectly structured summaries and extracted action items
              delivered directly to your dashboard moments after the call ends.
            </p>
            <button className="px-10 py-5 rounded-full bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
              Deploy Clara Now
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
