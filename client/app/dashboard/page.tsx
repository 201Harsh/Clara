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
  Briefcase,
  Code,
  Megaphone,
} from "lucide-react";
import AxiosInstance from "../config/AxiosInstance";
import { LuMessageSquareText } from "react-icons/lu";
import ClaraAgent from "../Components/ClaraAgent";

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

interface UserProfile {
  name: string;
  email: string;
  role: string | null;
}

const ROLES = [
  {
    id: "Software Engineer",
    icon: <Code size={24} />,
    desc: "Focuses on deep work. Minimizes syncs.",
  },
  {
    id: "Founder / CEO",
    icon: <Briefcase size={24} />,
    desc: "High meeting load. Prioritizes 1-on-1s.",
  },
  {
    id: "Marketing Manager",
    icon: <Megaphone size={24} />,
    desc: "Campaign syncs. Prioritizes strategy.",
  },
];

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meetings, setMeetings] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // 1. Fetch User Profile First
        const profileRes = await AxiosInstance.get("/users/profile");
        setProfile(profileRes.data.user);

        // 2. Fetch Meetings
        const meetingRes = await AxiosInstance.get("/calendar/today");
        setMeetings(meetingRes.data.meetings);
      } catch (err) {
        console.error("Dashboard Init Error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };
    initializeDashboard();
  }, []);

  const handleRoleSelection = async (selectedRole: string) => {
    setIsLoading(true);
    try {
      await AxiosInstance.put("/users/role", { role: selectedRole });
      setProfile((prev) => (prev ? { ...prev, role: selectedRole } : null));
      // Trigger a rescan with the new role
      await handleSync();
    } catch (err) {
      setError("Failed to save role. Try again.");
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await AxiosInstance.post("/calendar/sync", { role: profile?.role });
      const { data } = await AxiosInstance.get("/calendar/today");
      setMeetings(data.meetings);
    } catch (err) {
      setError("Synchronization failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const humanMeetings = meetings.filter((m) => m.decision === "human");
  const botMeetings = meetings.filter((m) => m.decision === "bot");

  // --- RENDER ROLE MODAL IF NO ROLE ---
  if (!isLoading && profile && !profile.role) {
    return (
      <div className="min-h-screen bg-[#05000a] flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-purple-900/10 blur-[150px] pointer-events-none" />
        <div className="max-w-3xl w-full bg-black/60 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl relative z-10 text-center">
          <Bot size={48} className="text-purple-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-3">
            Initialize Clara Protocol
          </h1>
          <p className="text-zinc-400 mb-10 max-w-lg mx-auto">
            Select your operational role. This determines how Clara evaluates
            and triages your daily schedule.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => handleRoleSelection(r.id)}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                  {r.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{r.id}</h3>
                <p className="text-xs text-zinc-500">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#05000a] text-zinc-100 p-6 md:p-12 relative overflow-hidden font-sans">
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* TOP HEADER: User Info */}
        {profile && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10 bg-white/5 border border-white/10 rounded-2xl p-4 px-6 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-lg">
                {profile.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">{profile.name}</h2>
                <p className="text-xs text-zinc-400">{profile.email}</p>
              </div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                {profile.role}
              </span>
            </div>
          </div>
        )}

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
              <CalendarIcon className="text-purple-400" /> Daily Triage
            </h1>
            <p className="text-zinc-400 uppercase tracking-wider text-sm font-semibold">
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

        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="font-mono text-sm tracking-[0.2em] text-purple-400/70">
              LOADING TIMELINE...
            </p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {meetings.length === 0 ? (
              <div className="py-24 text-center border border-white/5 rounded-3xl bg-white/[0.02]">
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
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Column 1: Human */}
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
                  {humanMeetings.map((meeting) => (
                    <div
                      key={meeting.googleEventId}
                      className="bg-emerald-950/5 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
                      <h3 className="text-xl font-bold text-white mb-3 ml-3">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 ml-3 mb-4">
                        <Clock size={14} className="text-emerald-400" />{" "}
                        {formatTime(meeting.startTime)} -{" "}
                        {formatTime(meeting.endTime)}
                      </div>
                      <div className="bg-black/50 rounded-xl p-3.5 ml-3">
                        <p className="text-sm text-zinc-300">
                          <span className="font-bold text-zinc-400 block mb-1">
                            Reason:
                          </span>
                          {meeting.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column 2: Bot */}
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
                  {botMeetings.map((meeting) => (
                    <div
                      key={meeting.googleEventId}
                      className="bg-purple-950/10 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500" />
                      <h3 className="text-xl font-bold text-white mb-3 ml-3">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 ml-3 mb-4">
                        <Clock size={14} className="text-purple-400" />{" "}
                        {formatTime(meeting.startTime)} -{" "}
                        {formatTime(meeting.endTime)}
                      </div>
                      <div className="bg-black/50 rounded-xl p-3.5 ml-3">
                        <p className="text-sm text-zinc-300">
                          <span className="font-bold text-zinc-400 block mb-1">
                            Reason:
                          </span>
                          {meeting.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Chatbot Trigger */}
        <motion.button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.4)] z-40"
        >
          <LuMessageSquareText className="text-white" size={26} />
        </motion.button>

        {/* Render Isolated Chatbot */}
        <ClaraAgent
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          userRole={profile?.role || null}
        />
      </div>
    </div>
  );
}
