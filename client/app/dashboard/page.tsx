"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  User,
  Bot,
  Activity,
  Briefcase,
  Code,
  Megaphone,
  PenTool,
  LineChart,
  Headphones,
  Database,
  Target,
  Layers,
  X,
  AlignLeft,
  MessageSquare,
  Terminal,
} from "lucide-react";
import AxiosInstance from "../config/AxiosInstance";
import DashboardHeader from "../Components/DashboardHeader";
import ClaraAgent from "../Components/ClaraAgent";

// --- Custom Countdown Component ---
const CountdownTimer = ({ targetTime }: { targetTime: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const diff = new Date(targetTime).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft("PROXY INITIATED");
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60))
        .toString()
        .padStart(2, "0");
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        .toString()
        .padStart(2, "0");
      const s = Math.floor((diff % (1000 * 60)) / 1000)
        .toString()
        .padStart(2, "0");
      setTimeLeft(`T-MINUS ${h}:${m}:${s}`);
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return (
    <span className="font-mono text-xs tracking-widest text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2 py-1 rounded flex items-center gap-1.5">
      <Terminal size={10} /> {timeLeft}
    </span>
  );
};

// --- Interfaces & Constants ---
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

interface ChatMessage {
  role: "user" | "clara";
  content: string;
}

const ROLES = [
  {
    id: "Founder / CEO",
    icon: <Briefcase size={24} />,
    desc: "Focus on strategy, pitches, and high-level syncs.",
  },
  {
    id: "Software Engineer",
    icon: <Code size={24} />,
    desc: "Protect deep work. Delegate standups and grooming.",
  },
  {
    id: "Product Manager",
    icon: <Target size={24} />,
    desc: "Align teams. Clara proxies routine updates.",
  },
  {
    id: "Marketing Director",
    icon: <Megaphone size={24} />,
    desc: "Campaign reviews and external agency syncs.",
  },
  {
    id: "Sales Executive",
    icon: <LineChart size={24} />,
    desc: "Client-facing priority. Clara handles internal CRM syncs.",
  },
  {
    id: "Design Lead",
    icon: <PenTool size={24} />,
    desc: "Creative sprints. Proxy timeline and resource checks.",
  },
  {
    id: "Data Scientist",
    icon: <Database size={24} />,
    desc: "Analysis blocks. Clara summarizes metric updates.",
  },
  {
    id: "Operations",
    icon: <Layers size={24} />,
    desc: "Process scaling. Proxy vendor and status calls.",
  },
  {
    id: "Customer Success",
    icon: <Headphones size={24} />,
    desc: "User retention. Proxy internal team syncs.",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [visibleHumanCount, setVisibleHumanCount] = useState(10);
  const [visibleBotCount, setVisibleBotCount] = useState(10);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "clara",
      content: "Clara network connected. How can I adjust your schedule today?",
    },
  ]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
        if (error.response?.status === 401) router.replace("/signup");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();

    // Setup an interval to hard-refresh the schedule data every 3 minutes
    // to catch DB changes made by the Cron job without needing SSE.
    const syncInterval = setInterval(fetchDashboardData, 180000);
    return () => clearInterval(syncInterval);
  }, [router]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isAgentTyping, isChatOpen]);

  const handleLogout = () => {
    localStorage.removeItem("clara_access_token");
    router.replace("/signup");
  };

  const handleRoleSelection = async (selectedRole: string) => {
    setIsSavingRole(true);
    try {
      await AxiosInstance.put("/users/role", { role: selectedRole });
      setUserProfile((prev) => (prev ? { ...prev, role: selectedRole } : null));
      setIsRoleModalOpen(false);
      const meetingsRes = await AxiosInstance.get("/calendar/all/meetings");
      setMeetings(meetingsRes.data.meetings || []);
    } catch (error) {
      console.error("Failed to save role:", error);
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setIsAgentTyping(true);

    try {
      const res = await AxiosInstance.post("/ai/clara", {
        prompt: userMessage,
      });
      const replyText =
        res.data.message || res.data.response || "Task executed successfully.";
      setChatMessages((prev) => [
        ...prev,
        { role: "clara", content: replyText },
      ]);

      const meetingsRes = await AxiosInstance.get("/calendar/all/meetings");
      setMeetings(meetingsRes.data.meetings || []);
    } catch (error) {
      console.error("Agent comm error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "clara",
          content: "Connection to core disrupted. Please try again.",
        },
      ]);
    } finally {
      setIsAgentTyping(false);
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
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const itemVars: any = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  if (!isLoading && userProfile && !userProfile.role) {
    return (
      <div className="min-h-screen bg-[#05000a] flex items-center justify-center p-6 relative overflow-y-auto">
        <div className="absolute inset-0 bg-purple-900/10 blur-[150px] pointer-events-none" />
        <div className="max-w-5xl w-full bg-black/60 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl relative z-10 text-center shadow-[0_0_50px_rgba(147,51,234,0.15)] my-12">
          <Bot size={48} className="text-purple-500 mx-auto mb-6" />
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Initialize Protocol
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-12">
            To perfectly triage your schedule, Clara needs to understand your
            operational priorities. Select your primary role below.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {ROLES.map((role) => (
              <button
                key={role.id}
                disabled={isSavingRole}
                onClick={() => handleRoleSelection(role.id)}
                className="group relative flex flex-col p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all cursor-pointer overflow-hidden disabled:opacity-50"
              >
                <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-purple-400 mb-4 border border-white/5 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(147,51,234,0.1)]">
                  {role.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{role.id}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
                  {role.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030008] text-zinc-100 font-sans relative overflow-hidden selection:bg-purple-500/30">
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-pink-900/5 rounded-full blur-[150px] pointer-events-none" />

      <DashboardHeader
        setIsDropdownOpen={setIsDropdownOpen}
        isDropdownOpen={isDropdownOpen}
        userProfile={userProfile}
        setIsRoleModalOpen={setIsRoleModalOpen}
        handleLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10 h-[calc(100vh-80px)] flex flex-col">
        <div className="mb-8 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Daily Triage
            </h2>
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4 shadow-[0_0_30px_rgba(147,51,234,0.3)]" />
            <p className="font-mono text-xs tracking-[0.2em] text-purple-400/70 animate-pulse">
              SYNCING DATABANKS...
            </p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center bg-[#05000a] border border-purple-500/20 rounded-3xl p-12 backdrop-blur-xl max-w-md shadow-[0_0_50px_rgba(147,51,234,0.1)]">
              <CalendarIcon
                size={48}
                className="mx-auto text-purple-500 mb-6"
              />
              <h3 className="text-2xl font-bold text-white mb-3">
                Clear Schedule
              </h3>
              <p className="text-zinc-400">
                No operations required today. Clara is standing by.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid lg:grid-cols-2 gap-8 overflow-hidden pb-4">
            {/* COLUMN 1: HUMAN MEETINGS */}
            <div className="flex flex-col h-full bg-[#050505]/60 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
              <div className="p-5 border-b border-white/5 bg-black/60 flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                    <User size={18} className="text-pink-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Your Agenda
                  </h3>
                </div>
                <span className="bg-white/10 text-zinc-300 text-xs font-bold px-3 py-1 rounded-full">
                  {humanMeetings.length}
                </span>
              </div>
              <div
                onScroll={(e) => {
                  if (
                    e.currentTarget.scrollHeight - e.currentTarget.scrollTop <=
                    e.currentTarget.clientHeight * 1.5
                  )
                    setVisibleHumanCount((p) => p + 10);
                }}
                className="flex-1 overflow-y-auto scrollbar-small p-5 space-y-4"
              >
                <motion.div
                  variants={containerVars}
                  initial="hidden"
                  animate="show"
                >
                  {humanMeetings.slice(0, visibleHumanCount).map((meeting) => (
                    <motion.div
                      variants={itemVars}
                      key={meeting.googleEventId}
                      className="bg-black/50 border border-white/10 rounded-2xl p-6 hover:border-pink-500/30 transition-all group mb-4 shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.1)]"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <h4 className="font-bold text-white text-lg leading-tight group-hover:text-pink-50 transition-colors">
                          {meeting.title}
                        </h4>
                        <span className="shrink-0 text-[10px] font-bold text-pink-400 bg-pink-400/10 border border-pink-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
                          Human
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-400 mb-5">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-pink-400" />{" "}
                          {formatTime(meeting.startTime)} -{" "}
                          {formatTime(meeting.endTime)}
                        </span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          <strong className="text-pink-300 uppercase tracking-wide flex items-center gap-1 mb-1">
                            <AlignLeft size={12} /> Reason
                          </strong>{" "}
                          {meeting.reason}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {humanMeetings.length === 0 && (
                    <p className="text-center text-zinc-600 text-sm mt-10">
                      No physical attendance required.
                    </p>
                  )}
                </motion.div>
              </div>
            </div>

            {/* COLUMN 2: CLARA DIRECTIVES (BOT MEETINGS) */}
            <div className="flex flex-col h-full bg-[#0a0314]/60 border border-purple-500/20 rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_0_50px_rgba(147,51,234,0.05)]">
              <div className="p-5 border-b border-purple-500/20 bg-black/60 flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/40 shadow-[0_0_10px_rgba(147,51,234,0.3)]">
                    <Bot size={18} className="text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Clara Directives
                  </h3>
                </div>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold px-3 py-1 rounded-full">
                  {botMeetings.length}
                </span>
              </div>
              <div
                onScroll={(e) => {
                  if (
                    e.currentTarget.scrollHeight - e.currentTarget.scrollTop <=
                    e.currentTarget.clientHeight * 1.5
                  )
                    setVisibleBotCount((p) => p + 10);
                }}
                className="flex-1 overflow-y-auto scrollbar-small p-5 space-y-4 relative"
              >
                <motion.div
                  variants={containerVars}
                  initial="hidden"
                  animate="show"
                >
                  {botMeetings.slice(0, visibleBotCount).map((meeting) => {
                    const isInfiltrating = meeting.status === "infiltrated";

                    return (
                      <motion.div
                        variants={itemVars}
                        key={meeting.googleEventId}
                        className={`relative rounded-2xl p-6 transition-all group mb-4 overflow-hidden shadow-lg ${
                          isInfiltrating
                            ? "bg-[#0a0514] border-2 border-cyan-500/80 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                            : "bg-[#05000a] border border-purple-500/30 hover:border-purple-500/60"
                        }`}
                      >
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1 ${isInfiltrating ? "bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,1)]" : "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]"}`}
                        />
                        {isInfiltrating && (
                          <div className="absolute inset-0 bg-cyan-500/5 animate-pulse pointer-events-none" />
                        )}

                        <div className="flex items-start justify-between gap-4 mb-4 pl-2 relative z-10">
                          <h4
                            className={`font-bold text-lg leading-tight transition-colors ${isInfiltrating ? "text-cyan-50" : "text-white group-hover:text-purple-50"}`}
                          >
                            {meeting.title}
                          </h4>

                          {/* Live Countdown Timer injects right here if it's scheduled for the future */}
                          {!isInfiltrating && (
                            <CountdownTimer targetTime={meeting.startTime} />
                          )}

                          {isInfiltrating && (
                            <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 border bg-cyan-900/40 text-cyan-300 border-cyan-500/50">
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />{" "}
                              INFILTRATING
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-500 mb-5 pl-2 relative z-10">
                          <span className="flex items-center gap-1.5">
                            <Clock
                              size={14}
                              className={
                                isInfiltrating
                                  ? "text-cyan-400"
                                  : "text-purple-400"
                              }
                            />
                            {formatTime(meeting.startTime)} -{" "}
                            {formatTime(meeting.endTime)}
                          </span>
                        </div>

                        <div
                          className={`rounded-xl p-3.5 pl-4 ml-2 border relative z-10 ${isInfiltrating ? "bg-cyan-950/30 border-cyan-500/20" : "bg-black/60 border-purple-500/20"}`}
                        >
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            <strong
                              className={`uppercase tracking-wide flex items-center gap-1 mb-1 ${isInfiltrating ? "text-cyan-400" : "text-purple-400"}`}
                            >
                              <AlignLeft size={12} /> Directive
                            </strong>
                            {meeting.reason}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  {botMeetings.length === 0 && (
                    <p className="text-center text-purple-900 text-sm mt-10">
                      Clara has no assigned proxies today.
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ClaraAgent
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatMessages={chatMessages}
        isAgentTyping={isAgentTyping}
        chatEndRef={chatEndRef}
        handleSendMessage={handleSendMessage}
      />

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_40px_rgba(147,51,234,0.6)] transition-shadow z-50 border border-white/10"
      >
        <MessageSquare size={24} />
      </motion.button>
    </div>
  );
}
