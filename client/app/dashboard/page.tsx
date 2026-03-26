"use client";

import { useEffect, useState } from "react";
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
  X,
} from "lucide-react";
import AxiosInstance from "../config/AxiosInstance";
import { LuMessageSquareText } from "react-icons/lu";

interface CalendarEvent {
  _id?: string;
  googleEventId: string;
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

  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has("token")) {
        currentUrl.searchParams.delete("token");
        window.history.replaceState(
          {},
          document.title,
          currentUrl.pathname + currentUrl.search,
        );
      }
    }
  }, []);

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

  const humanMeetings = meetings.filter((m) => m.decision === "human");
  const botMeetings = meetings.filter((m) => m.decision === "bot");

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

  const MeetingCard = ({
    meeting,
    isBot,
  }: {
    meeting: CalendarEvent;
    isBot: boolean;
  }) => (
    <motion.div
      variants={itemVars}
      className={`relative overflow-hidden rounded-2xl p-6 border backdrop-blur-md transition-all hover:-translate-y-1 ${
        isBot
          ? "bg-purple-950/10 border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_8px_30px_-10px_rgba(147,51,234,0.2)]"
          : "bg-emerald-950/5 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_8px_30px_-10px_rgba(16,185,129,0.15)]"
      }`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          isBot
            ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]"
            : "bg-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.8)]"
        }`}
      />

      <div className="ml-3">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {meeting.title}
          </h3>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
              isBot
                ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            }`}
          >
            {isBot ? (
              <>
                <Bot size={14} /> Clara Proxy
              </>
            ) : (
              <>
                <User size={14} /> Human
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium text-zinc-400 mb-5">
          <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
            <Clock
              size={14}
              className={isBot ? "text-purple-400" : "text-emerald-400"}
            />
            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
          </span>
          {meeting.meetLink && (
            <a
              href={meeting.meetLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Video size={14} /> Meet Link
            </a>
          )}
        </div>

        <div className="bg-black/50 border border-white/5 rounded-xl p-3.5">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            <AlignLeft size={14} /> AI Analysis
          </div>
          <p className="text-sm text-zinc-300">{meeting.reason}</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#05000a] text-zinc-100 p-6 md:p-12 relative overflow-hidden font-sans">
      <div className="fixed top-[-20%] right-[-10%] w-200 h-200 bg-purple-900/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.15)]">
                <CalendarIcon className="text-purple-400" size={24} />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">
                Daily Triage
              </h1>
            </div>
            <p className="text-zinc-400 ml-16 uppercase tracking-wider text-sm font-semibold">
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
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 hover:border-purple-500/50 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={isSyncing ? "animate-spin text-purple-400" : ""}
            />
            <span className="font-semibold">
              {isSyncing ? "Syncing..." : "Force Sync"}
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
              <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle size={20} />
                <p className="font-medium text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="font-mono text-sm tracking-[0.2em] text-purple-400/70">
              LOADING TIMELINE...
            </p>
          </div>
        ) : (
          <motion.div variants={containerVars} initial="hidden" animate="show">
            {meetings.length === 0 ? (
              <motion.div
                variants={itemVars}
                className="py-24 text-center border border-white/5 rounded-3xl bg-white/[0.02]"
              >
                <CheckCircle2
                  size={48}
                  className="mx-auto text-zinc-600 mb-4"
                />
                <h3 className="text-2xl font-bold text-zinc-300 mb-2">
                  Schedule Cleared
                </h3>
                <p className="text-zinc-500">
                  No meetings found. Clara is standing by.
                </p>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2 border-b border-emerald-500/20 pb-2">
                    <User className="text-emerald-400" size={20} />
                    <h2 className="text-xl font-bold text-emerald-100">
                      Your Agenda
                    </h2>
                    <span className="ml-auto bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-full font-bold">
                      {humanMeetings.length}
                    </span>
                  </div>
                  {humanMeetings.length === 0 && (
                    <p className="text-sm text-zinc-600 italic">
                      No human appearances required today.
                    </p>
                  )}
                  {humanMeetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.googleEventId}
                      meeting={meeting}
                      isBot={false}
                    />
                  ))}
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2 border-b border-purple-500/20 pb-2">
                    <Bot className="text-purple-400" size={20} />
                    <h2 className="text-xl font-bold text-purple-100">
                      Clara Directives
                    </h2>
                    <span className="ml-auto bg-purple-500/10 text-purple-400 text-xs px-2 py-1 rounded-full font-bold">
                      {botMeetings.length}
                    </span>
                  </div>
                  {botMeetings.length === 0 && (
                    <p className="text-sm text-zinc-600 italic">
                      No proxies deployed today.
                    </p>
                  )}
                  {botMeetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.googleEventId}
                      meeting={meeting}
                      isBot={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.4)] border border-purple-400/30 z-40 group"
        >
          <span className="absolute inset-0 rounded-full bg-purple-400 opacity-0 group-hover:opacity-20 group-hover:animate-ping transition-opacity" />
          <LuMessageSquareText className="text-white relative z-10" size={26} />
        </motion.button>

        <AnimatePresence>
          {isChatOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsChatOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full md:w-[400px] bg-[#0a0514] border-l border-purple-500/20 shadow-2xl z-50 flex flex-col"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                      <Bot size={16} className="text-purple-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      Clara Command
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-sm text-purple-200 mb-4">
                    Connection established. I have analyzed your{" "}
                    {meetings.length} meetings today. How would you like me to
                    adjust the protocol?
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-black/20">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Instruct Clara..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-purple-500 transition-colors">
                      SEND
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
