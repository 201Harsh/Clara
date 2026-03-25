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

  // THE FIX: Unconditionally fire the fetch. The Layout already guarantees we are authenticated.
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
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVars: any = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-zinc-900 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.15)]">
                <CalendarIcon className="text-purple-400" size={20} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Today's Triage
              </h1>
            </div>
            <p className="text-zinc-400 ml-13">
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0a051e] border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Scanning Calendar..." : "Rescan Calendar"}
          </button>
        </header>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400">
                <AlertCircle size={20} />
                <p className="font-medium text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="font-mono text-sm tracking-widest animate-pulse text-purple-400/70">
              LOADING SCHEDULER...
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="grid gap-4"
          >
            {meetings.length === 0 ? (
              <motion.div
                variants={itemVars}
                className="py-20 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50"
              >
                <CheckCircle2
                  size={40}
                  className="mx-auto text-zinc-700 mb-4"
                />
                <h3 className="text-xl font-medium text-zinc-300 mb-2">
                  Schedule Cleared
                </h3>
                <p className="text-zinc-500">
                  No meetings found for today. Clara is standing by.
                </p>
              </motion.div>
            ) : (
              meetings.map((meeting) => (
                <motion.div
                  key={meeting._id}
                  variants={itemVars}
                  className={`relative overflow-hidden rounded-xl p-6 border backdrop-blur-sm transition-all hover:shadow-lg ${
                    meeting.decision === "bot"
                      ? "bg-[#0a0314] border-purple-500/30 shadow-[0_0_20px_rgba(147,51,234,0.05)]"
                      : "bg-[#021108] border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                  }`}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${meeting.decision === "bot" ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.8)]"}`}
                  />

                  <div className="flex flex-col md:flex-row justify-between gap-6 ml-2">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {meeting.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-4">
                        <span className="flex items-center gap-1.5">
                          <Clock size={16} /> {formatTime(meeting.startTime)} -{" "}
                          {formatTime(meeting.endTime)}
                        </span>
                        {meeting.meetLink && (
                          <a
                            href={meeting.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Video size={16} /> External Link
                          </a>
                        )}
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium mb-1">
                          <AlignLeft size={14} /> Description / AI Note
                        </div>
                        <p className="text-sm text-zinc-500">
                          {meeting.reason}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end justify-start min-w-[200px]">
                      <div className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">
                        Attending Status
                      </div>
                      <div
                        className={`inline-flex w-full md:w-auto items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold border ${
                          meeting.decision === "bot"
                            ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                            : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {meeting.decision === "bot" ? (
                          <>
                            <Bot size={18} /> Clara (AI Proxy)
                          </>
                        ) : (
                          <>
                            <User size={18} /> Human Required
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
