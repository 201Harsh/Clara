"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  ChevronDown,
  LogOut,
  PenTool,
  TrendingUp,
  Target,
  Database,
  Activity,
} from "lucide-react";
import AxiosInstance from "../config/AxiosInstance";
import { LuMessageSquareText } from "react-icons/lu";
import { useAuthStore } from "../store/auth-store";
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
    desc: "Deep work focus. Clara handles daily standups.",
  },
  {
    id: "Founder / CEO",
    icon: <Briefcase size={24} />,
    desc: "High load. Clara prioritizes external pitches & 1-on-1s.",
  },
  {
    id: "Product Manager",
    icon: <Target size={24} />,
    desc: "Alignment focus. Clara handles basic feature syncs.",
  },
  {
    id: "Marketing Lead",
    icon: <Megaphone size={24} />,
    desc: "Campaign focus. Clara proxies general updates.",
  },
  {
    id: "Data Scientist",
    icon: <Database size={24} />,
    desc: "Analysis blocks. Clara summarizes weekly reports.",
  },
  {
    id: "Design Lead",
    icon: <PenTool size={24} />,
    desc: "Creative sprints. Clara handles timeline syncs.",
  },
  {
    id: "Sales Executive",
    icon: <TrendingUp size={24} />,
    desc: "Client focus. Clara proxies internal pipeline reviews.",
  },
  {
    id: "Operations",
    icon: <Activity size={24} />,
    desc: "System focus. Clara handles vendor status calls.",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { setAccessToken, logout } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meetings, setMeetings] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      setIsLoading(true);
      try {
        let tokenToUse = null;

        // 1. URL & LocalStorage Token Management
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          const urlToken = url.searchParams.get("token");

          if (urlToken) {
            tokenToUse = urlToken;
            localStorage.setItem("clara_access_token", urlToken);
            url.searchParams.delete("token");
            window.history.replaceState(
              {},
              document.title,
              url.pathname + url.search,
            );
          } else {
            tokenToUse = localStorage.getItem("clara_access_token");
          }
        }

        // 2. CRITICAL FIX: Inject token directly into Axios defaults instantly
        if (tokenToUse) {
          setAccessToken(tokenToUse); // Sync to Zustand
          AxiosInstance.defaults.headers.common["Authorization"] =
            `Bearer ${tokenToUse}`;
        } else {
          // If absolutely no token is found anywhere, abort and redirect to login
          throw new Error("No token found");
        }

        // 3. Fire APIs safely
        const profileRes = await AxiosInstance.get("/users/profile");
        if (!isMounted) return;
        setProfile(profileRes.data.user);

        const { data } = await AxiosInstance.get("/calendar/today");
        if (!isMounted) return;
        setMeetings(data.meetings);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Dashboard Init Error:", err);

        // Handle Auth Failures (401/403/404)
        if (
          err.message === "No token found" ||
          err.response?.status === 401 ||
          err.response?.status === 403 ||
          err.response?.status === 404
        ) {
          localStorage.removeItem("clara_access_token");
          logout();
          router.replace("/signup?error=SessionExpired");
        } else {
          setError("Failed to initialize dashboard context.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, [setAccessToken, logout, router]);

  const handleRoleSelection = async (selectedRole: string) => {
    setIsLoading(true);
    try {
      await AxiosInstance.put("/users/role", { role: selectedRole });
      setProfile((prev) => (prev ? { ...prev, role: selectedRole } : null));
      await handleSync(selectedRole);
    } catch (err) {
      setError("Failed to save role. Try again.");
      setIsLoading(false);
    }
  };

  const handleSync = async (overrideRole?: string) => {
    setIsSyncing(true);
    setError(null);
    try {
      const currentRole = overrideRole || profile?.role || "Professional";
      await AxiosInstance.post("/calendar/sync", { role: currentRole });

      const { data } = await AxiosInstance.get("/calendar/today");
      setMeetings(data.meetings);
    } catch (err: any) {
      console.error("Sync Error:", err);
      // Explicitly catch the 400 error from the backend
      if (err.response?.status === 400) {
        setError("Google Calendar access missing. Please re-authenticate.");
      } else {
        setError("Calendar synchronization failed.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("clara_access_token");
    logout();
    router.replace("/signup");
  };

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

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

  // --- RENDER ROLE MODAL ---
  if (!isLoading && profile && !profile.role) {
    return (
      <div className="min-h-screen bg-[#05000a] flex items-center justify-center p-6 relative overflow-y-auto">
        <div className="absolute inset-0 bg-purple-900/10 blur-[150px] pointer-events-none" />
        <div className="max-w-4xl w-full bg-black/60 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl relative z-10 text-center shadow-2xl my-12">
          <Bot size={48} className="text-purple-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-3">
            Initialize Protocol
          </h1>
          <p className="text-zinc-400 mb-10 max-w-lg mx-auto">
            Select your operational role. This determines how Clara evaluates
            and triages your daily schedule.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => handleRoleSelection(r.id)}
                className="flex flex-col items-center text-center p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(147,51,234,0.1)]">
                  {r.icon}
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{r.id}</h3>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  {r.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#020005] text-zinc-100 p-6 md:p-10 relative overflow-hidden font-sans">
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* HEADER WITH DROPDOWN */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.15)] backdrop-blur-md">
              <CalendarIcon className="text-purple-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Daily Triage
              </h1>
              <p className="text-zinc-500 text-xs font-bold tracking-wider uppercase mt-1">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSync()}
              disabled={isSyncing || isLoading}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:border-purple-500/50 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  isSyncing
                    ? "animate-spin text-purple-400"
                    : "group-hover:text-purple-400"
                }
              />
              <span className="text-sm font-bold">
                {isSyncing ? "Syncing..." : "Force Sync"}
              </span>
            </button>

            {profile && (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors px-2 py-2 pr-4 rounded-full"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-bold text-white leading-none">
                      {profile.name}
                    </p>
                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mt-0.5">
                      {profile.role}
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-[#0a0514] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-xl"
                    >
                      <div className="p-3 border-b border-white/5 mb-2">
                        <p className="text-sm font-bold text-white truncate">
                          {profile.name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {profile.email}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-bold"
                      >
                        <LogOut size={16} /> Disconnect
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </header>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-red-400 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} />
                  <p className="font-medium text-sm">{error}</p>
                </div>
                {/* Shows the reconnect button if Google Auth is missing */}
                {error.includes("Google") && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/auth/google`}
                    className="bg-red-500/20 hover:bg-red-500/30 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shrink-0"
                  >
                    Reconnect Google
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(147,51,234,0.3)]" />
            <p className="font-mono text-xs tracking-[0.3em] text-purple-400/70">
              INITIALIZING DASHBOARD...
            </p>
          </div>
        ) : (
          <motion.div variants={containerVars} initial="hidden" animate="show">
            {meetings.length === 0 ? (
              <motion.div
                variants={itemVars}
                className="py-24 text-center border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-sm"
              >
                <CheckCircle2
                  size={48}
                  className="mx-auto text-zinc-600 mb-4"
                />
                <h3 className="text-2xl font-bold text-zinc-300 mb-2">
                  Schedule Cleared
                </h3>
                <p className="text-zinc-500 font-medium">
                  No meetings found. Clara is standing by.
                </p>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Column 1: Human */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4 border-b border-emerald-500/20 pb-3">
                    <User className="text-emerald-400" size={20} />
                    <h2 className="text-xl font-bold text-emerald-100">
                      Your Agenda
                    </h2>
                    <span className="ml-auto bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-full font-bold">
                      {humanMeetings.length}
                    </span>
                  </div>
                  {humanMeetings.map((meeting) => (
                    <motion.div
                      variants={itemVars}
                      key={meeting.googleEventId}
                      className="bg-emerald-950/5 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-5 relative overflow-hidden transition-colors"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
                      <h3 className="text-lg font-bold text-white mb-3 ml-3">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 ml-3 mb-4">
                        <Clock size={14} className="text-emerald-400" />{" "}
                        {formatTime(meeting.startTime)} -{" "}
                        {formatTime(meeting.endTime)}
                      </div>
                      <div className="bg-black/40 rounded-xl p-3.5 ml-3 border border-white/5">
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          <span className="flex items-center gap-1.5 font-bold text-zinc-400 mb-1.5 text-xs uppercase">
                            <AlignLeft size={12} /> Analysis
                          </span>
                          {meeting.reason}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Column 2: Bot */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4 border-b border-purple-500/20 pb-3">
                    <Bot className="text-purple-400" size={20} />
                    <h2 className="text-xl font-bold text-purple-100">
                      Clara Directives
                    </h2>
                    <span className="ml-auto bg-purple-500/10 text-purple-400 text-xs px-2 py-1 rounded-full font-bold">
                      {botMeetings.length}
                    </span>
                  </div>
                  {botMeetings.map((meeting) => (
                    <motion.div
                      variants={itemVars}
                      key={meeting.googleEventId}
                      className="bg-purple-950/10 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl p-5 relative overflow-hidden transition-colors"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                      <h3 className="text-lg font-bold text-white mb-3 ml-3">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 ml-3 mb-4">
                        <Clock size={14} className="text-purple-400" />{" "}
                        {formatTime(meeting.startTime)} -{" "}
                        {formatTime(meeting.endTime)}
                      </div>
                      <div className="bg-black/40 rounded-xl p-3.5 ml-3 border border-white/5">
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          <span className="flex items-center gap-1.5 font-bold text-zinc-400 mb-1.5 text-xs uppercase">
                            <AlignLeft size={12} /> Analysis
                          </span>
                          {meeting.reason}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Chatbot Floating Trigger */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-[0_0_40px_rgba(147,51,234,0.5)] border border-purple-400/30 z-40 group"
        >
          <span className="absolute inset-0 rounded-full bg-purple-400 opacity-0 group-hover:opacity-20 group-hover:animate-ping transition-opacity" />
          <LuMessageSquareText className="text-white relative z-10" size={26} />
        </motion.button>

        <ClaraAgent
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          userRole={profile?.role || null}
        />
      </div>
    </div>
  );
}
