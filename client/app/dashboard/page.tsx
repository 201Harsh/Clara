"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Calendar as CalendarIcon,
  Clock,
  Video,
  User,
  Bot,
  AlertCircle,
  CheckCircle2,
  AlignLeft,
} from "lucide-react";
import AxiosInstance from "../config/AxiosInstance";
import { LuMessageSquareText } from "react-icons/lu";

interface CalendarEvent {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  meetLink?: string;
  decision: "human" | "bot" | "skipped";
  reason: string;
  status: string;
}

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const { data } = await AxiosInstance.get("/calendar/today");
      setMeetings(data.meetings);
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
      setError("Failed to load local schedule. Please rescan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await AxiosInstance.post("/calendar/sync");
      await fetchMeetings();
    } catch (err) {
      console.error("Sync failed:", err);
      setError("Calendar synchronization failed. Check Google permissions.");
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const itemVars: any = {
    hidden: { opacity: 0, x: -20 },
    show: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="min-h-screen bg-[#020005] text-zinc-100 p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Deep Background Glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.15)] backdrop-blur-md">
                <CalendarIcon className="text-purple-400" size={24} />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
                Daily Directive
              </h1>
            </div>
            <p className="text-zinc-500 ml-16 font-medium tracking-wide uppercase text-sm">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing || isLoading}
            className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:border-purple-500/50 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none backdrop-blur-sm"
          >
            <RefreshCw
              size={18}
              className={`${isSyncing ? "animate-spin text-purple-400" : "group-hover:text-purple-400 transition-colors"}`}
            />
            <span className="font-semibold">
              {isSyncing ? "Syncing Uplink..." : "Force Sync"}
            </span>
          </button>
        </header>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="mb-10 p-5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-4 text-red-400 backdrop-blur-md">
                <AlertCircle size={22} className="mt-0.5 shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(147,51,234,0.3)]" />
            <p className="font-mono text-xs tracking-[0.3em] text-purple-400/70">
              INITIALIZING TIMELINE...
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="relative"
          >
            {/* Timeline Line */}
            {meetings.length > 0 && (
              <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-purple-500/50 via-white/10 to-transparent hidden md:block" />
            )}

            {meetings.length === 0 ? (
              <motion.div
                variants={itemVars}
                className="py-24 text-center border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-sm"
              >
                <CheckCircle2
                  size={48}
                  className="mx-auto text-zinc-600 mb-6"
                />
                <h3 className="text-2xl font-bold text-zinc-200 mb-3">
                  Schedule Cleared
                </h3>
                <p className="text-zinc-500 font-medium">
                  No active directives for today. Clara is standing by.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {meetings.map((meeting) => {
                  const isBot = meeting.decision === "bot";
                  return (
                    <motion.div
                      key={meeting._id}
                      variants={itemVars}
                      className="relative md:pl-16"
                    >
                      {/* Timeline Dot */}
                      <div
                        className={`absolute left-[21px] top-8 w-3 h-3 rounded-full hidden md:block shadow-[0_0_15px_currentColor] border-2 border-black ${isBot ? "bg-purple-500 text-purple-500" : "bg-emerald-500 text-emerald-500"}`}
                      />

                      <div
                        className={`group relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 ${
                          isBot
                            ? "bg-purple-950/10 border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_10px_40px_-10px_rgba(147,51,234,0.2)]"
                            : "bg-emerald-950/5 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.15)]"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row justify-between gap-8">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-2xl font-bold text-white tracking-tight">
                                {meeting.title}
                              </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-zinc-400 mb-6">
                              <span className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                <Clock
                                  size={16}
                                  className={
                                    isBot
                                      ? "text-purple-400"
                                      : "text-emerald-400"
                                  }
                                />
                                {formatTime(meeting.startTime)} -{" "}
                                {formatTime(meeting.endTime)}
                              </span>
                              {meeting.meetLink && (
                                <a
                                  href={meeting.meetLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg"
                                >
                                  <Video size={16} /> Join Protocol
                                </a>
                              )}
                            </div>

                            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                              <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                <AlignLeft size={14} /> Triage Analysis
                              </div>
                              <p className="text-sm text-zinc-300 leading-relaxed">
                                {meeting.reason}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col md:items-end justify-start min-w-[220px]">
                            <div
                              className={`w-full flex items-center justify-center md:justify-end gap-3 px-5 py-4 rounded-xl text-sm font-bold border ${
                                isBot
                                  ? "bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-[inset_0_0_20px_rgba(147,51,234,0.1)]"
                                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]"
                              }`}
                            >
                              {isBot ? (
                                <>
                                  <Bot size={20} /> Proxy Deployed
                                </>
                              ) : (
                                <>
                                  <User size={20} /> Human Required
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* FLOATING CHAT BOT BUTTON */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_40px_rgba(147,51,234,0.5)] border border-purple-400/50 z-50 group"
        >
          {/* Ping animation behind the button */}
          <span className="absolute inset-0 rounded-full bg-purple-500 opacity-20 group-hover:animate-ping" />
          <LuMessageSquareText
            className="text-white relative z-10"
            size={28}
          />
        </motion.button>
      </div>
    </div>
  );
}
