"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  User,
  Bot,
  ChevronDown,
  LogOut,
  Activity,
  ShieldAlert,
  AlignLeft,
} from "lucide-react";
import AxiosInstance from "../config/AxiosInstance";

// --- Types ---
interface Meeting {
  googleEventId: string;
  title: string;
  startTime: string;
  endTime: string;
  meetLink: string;
  decision: "human" | "bot" | "skipped";
  reason: string;
  status: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string | null;
}

export default function DashboardPage() {
  const router = useRouter();

  // --- State ---
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [meetingsRes, profileRes] = await Promise.all([
          AxiosInstance.get("/calendar/all/meetings"),
          AxiosInstance.get("/users/profile"),
        ]);

        setMeetings(meetingsRes.data.meetings || []);
        setUserProfile(profileRes.data.user || null);
      } catch (error: any) {
        console.error("Dashboard Load Error:", error);
        if (error.response?.status === 401) {
          router.replace("/signup"); // Kick out if unauthorized
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  // --- Helpers ---
  const handleLogout = () => {
    localStorage.removeItem("clara_access_token"); // Adjust based on your exact auth setup
    router.replace("/signup");
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // --- Animation Variants ---
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVars : any = {
    hidden: { opacity: 0, x: -20 },
    show: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans relative overflow-x-hidden selection:bg-purple-500/30">
      {/* --- Background Effects --- */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#4c1d9511_1px,transparent_1px),linear-gradient(to_bottom,#4c1d9511_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.15)_0%,rgba(0,0,0,0)_50%)] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[150px] pointer-events-none" />

      {/* --- Header --- */}
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.2)]">
              <Activity className="text-purple-400" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">
                Clara
              </h1>
              <p className="text-[10px] font-mono text-purple-400 tracking-widest uppercase mt-1">
                Command Center
              </p>
            </div>
          </div>

          {/* User Profile Dropdown */}
          {userProfile && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all px-2 py-2 pr-4 rounded-full cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-600 flex items-center justify-center font-bold text-white text-sm shadow-[0_0_10px_rgba(147,51,234,0.4)]">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-bold text-white leading-none">
                    {userProfile.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                    {userProfile.email}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-zinc-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-3 w-64 bg-[#0a0314] border border-purple-500/30 rounded-2xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(147,51,234,0.15)] z-50 backdrop-blur-xl"
                  >
                    <div className="p-4 border-b border-white/5 mb-2">
                      <p className="text-sm font-bold text-white truncate">
                        {userProfile.name}
                      </p>
                      <p className="text-xs text-zinc-500 truncate mt-1">
                        {userProfile.email}
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-mono uppercase tracking-wider">
                        <ShieldAlert size={12} />{" "}
                        {userProfile.role || "Role: Unassigned"}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm font-bold cursor-pointer"
                    >
                      <LogOut size={16} /> Disconnect Session
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Page Title */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white to-zinc-400 mb-3">
            Today's Directive
          </h2>
          <p className="text-zinc-400 text-lg">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(147,51,234,0.3)]" />
            <p className="font-mono text-sm tracking-[0.2em] text-purple-400/70 animate-pulse">
              SYNCING CALENDAR FEED...
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="relative"
          >
            {/* Vertical Timeline Line */}
            <div className="absolute left-[39px] md:left-[119px] top-4 bottom-4 w-px bg-linear-to-b from-purple-500/50 via-purple-500/10 to-transparent" />

            {meetings.length === 0 ? (
              <div className="py-20 text-center border border-white/5 rounded-3xl bg-[#05000a]/50 backdrop-blur-sm">
                <CalendarIcon
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
              <div className="space-y-8">
                {meetings.map((meeting, index) => {
                  const isBot = meeting.decision === "bot";

                  return (
                    <motion.div
                      variants={itemVars}
                      key={meeting.googleEventId}
                      className="relative flex items-start gap-6 md:gap-8 group"
                    >
                      {/* Timeline Time (Hidden on very small screens, visible on md+) */}
                      <div className="hidden md:block w-20 pt-4 text-right shrink-0">
                        <span className="text-sm font-bold text-zinc-400">
                          {formatTime(meeting.startTime)}
                        </span>
                      </div>

                      {/* Timeline Node */}
                      <div className="relative z-10 shrink-0 mt-5">
                        <div
                          className={`w-5 h-5 rounded-full border-4 border-black flex items-center justify-center ${
                            isBot
                              ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                              : "bg-zinc-600"
                          }`}
                        >
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                      </div>

                      {/* Meeting Card */}
                      <div
                        className={`flex-1 rounded-2xl p-6 md:p-8 transition-all duration-300 border backdrop-blur-xl ${
                          isBot
                            ? "bg-[#0a0314]/80 border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_30px_rgba(147,51,234,0.1)] hover:shadow-[0_0_40px_rgba(147,51,234,0.2)]"
                            : "bg-[#050505]/80 border-white/5 hover:border-white/10 hover:bg-[#0a0a0a]"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                          <div>
                            {/* Mobile Time (Only shows on small screens) */}
                            <span className="md:hidden text-xs font-bold text-purple-400 mb-2 block">
                              {formatTime(meeting.startTime)}
                            </span>
                            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
                              {meeting.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm font-medium text-zinc-500">
                              <span className="flex items-center gap-1.5">
                                <Clock
                                  size={14}
                                  className={isBot ? "text-purple-400" : ""}
                                />
                                {formatTime(meeting.endTime)} (End)
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
                          </div>

                          {/* Attendance Badge */}
                          <div
                            className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
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
                                <User size={14} /> You Attend
                              </>
                            )}
                          </div>
                        </div>

                        {/* Analysis Box */}
                        <div className="mt-6 bg-black/40 border border-white/5 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <AlignLeft size={14} /> System Directive
                          </div>
                          <p className="text-sm text-zinc-300 leading-relaxed">
                            {meeting.reason}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
