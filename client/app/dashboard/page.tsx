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
  ChevronDown,
  LogOut,
  Activity,
  ShieldAlert,
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
  Send,
} from "lucide-react";
import AxiosInstance from "../config/AxiosInstance";
import DashboardHeader from "../Components/DashboardHeader";

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

  const handleHumanScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      setVisibleHumanCount((prev) => prev + 10);
    }
  };

  const handleBotScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      setVisibleBotCount((prev) => prev + 10);
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

          {isSavingRole && (
            <div className="mt-8 flex items-center justify-center gap-3 text-purple-400 font-mono text-sm animate-pulse">
              <Activity size={16} /> CONFIGURING AGENT NEURAL NET...
            </div>
          )}
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

      <AnimatePresence>
        {isRoleModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRoleModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-100"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-5xl bg-[#0a0314] border border-purple-500/30 rounded-3xl p-8 md:p-10 z-[101] shadow-[0_0_50px_rgba(147,51,234,0.15)] max-h-[90vh] overflow-y-auto scrollbar-small"
            >
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <div className="text-center mb-10">
                <Bot size={40} className="text-purple-500 mx-auto mb-4" />
                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                  Reconfigure Protocol
                </h2>
                <p className="text-zinc-400">
                  Update your operational role to adjust how Clara triages your
                  schedule.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    disabled={isSavingRole}
                    onClick={() => handleRoleSelection(role.id)}
                    className={`group relative flex flex-col p-6 rounded-2xl border transition-all cursor-pointer overflow-hidden disabled:opacity-50 ${userProfile?.role === role.id ? "bg-purple-500/20 border-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.3)]" : "bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10"}`}
                  >
                    <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 border transition-transform shadow-[0_0_15px_rgba(147,51,234,0.1)] ${userProfile?.role === role.id ? "bg-purple-600 border-purple-400 text-white" : "bg-black text-purple-400 border-white/5 group-hover:scale-110"}`}
                    >
                      {role.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {role.id}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
                      {role.desc}
                    </p>
                  </button>
                ))}
              </div>
              {isSavingRole && (
                <div className="mt-8 flex items-center justify-center gap-3 text-purple-400 font-mono text-sm animate-pulse">
                  <Activity size={16} /> RECALIBRATING NEURAL NET...
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Main Dashboard View --- */}
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
                onScroll={handleHumanScroll}
                className="flex-1 overflow-y-auto scrollbar-small p-5 space-y-4"
              >
                <Suspense
                  fallback={
                    <div className="text-zinc-500 text-sm text-center py-10">
                      Decrypting...
                    </div>
                  }
                >
                  <motion.div
                    variants={containerVars}
                    initial="hidden"
                    animate="show"
                  >
                    {humanMeetings
                      .slice(0, visibleHumanCount)
                      .map((meeting) => (
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
                            {meeting.meetLink && (
                              <a
                                href={meeting.meetLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <Video size={14} /> Join Meet
                              </a>
                            )}
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
                </Suspense>
              </div>
            </div>

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
                onScroll={handleBotScroll}
                className="flex-1 overflow-y-auto scrollbar-small p-5 space-y-4 relative"
              >
                <Suspense
                  fallback={
                    <div className="text-purple-500 text-sm text-center py-10">
                      Decrypting...
                    </div>
                  }
                >
                  <motion.div
                    variants={containerVars}
                    initial="hidden"
                    animate="show"
                  >
                    {botMeetings.slice(0, visibleBotCount).map((meeting) => (
                      <motion.div
                        variants={itemVars}
                        key={meeting.googleEventId}
                        className="relative bg-[#05000a] border border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/60 hover:bg-[#0a0514] transition-all group mb-4 overflow-hidden shadow-[0_5px_20px_rgba(0,0,0,0.5)]"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]" />

                        <div className="flex items-start justify-between gap-4 mb-4 pl-2">
                          <h4 className="font-bold text-white text-lg leading-tight group-hover:text-purple-50 transition-colors">
                            {meeting.title}
                          </h4>
                          <span className="shrink-0 text-[10px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5">
                            <Activity size={12} /> Proxy Active
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-500 mb-5 pl-2">
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} className="text-purple-400" />{" "}
                            {formatTime(meeting.startTime)} -{" "}
                            {formatTime(meeting.endTime)}
                          </span>
                        </div>
                        <div className="bg-black/60 rounded-xl p-3.5 border border-purple-500/20 pl-4 ml-2">
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            <strong className="text-purple-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                              <AlignLeft size={12} /> Directive
                            </strong>{" "}
                            {meeting.reason}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {botMeetings.length === 0 && (
                      <p className="text-center text-purple-900 text-sm mt-10">
                        Clara has no assigned proxies today.
                      </p>
                    )}
                  </motion.div>
                </Suspense>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- CLARA FLOATING AGENT INTERFACE --- */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 w-[380px] h-[500px] max-h-[80vh] bg-[#0a0314]/90 backdrop-blur-2xl border border-purple-500/40 rounded-3xl shadow-[0_10px_50px_rgba(147,51,234,0.2)] flex flex-col z-50 overflow-hidden"
          >
            {/* Chat Header */}
            <div className="px-5 py-4 border-b border-purple-500/20 bg-black/40 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center relative">
                  <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-black" />
                  <Bot size={16} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">
                    Clara Link
                  </h3>
                  <p className="text-[10px] text-purple-400 mt-1 uppercase tracking-wider">
                    Agent Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-small">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none"
                        : "bg-white/5 border border-purple-500/20 text-zinc-300 rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isAgentTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-purple-500/20 text-zinc-300 p-3 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                    <span
                      className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-purple-500/20 bg-black/40 shrink-0">
              <div className="relative flex items-center bg-[#05000a] border border-purple-500/30 rounded-full focus-within:border-purple-400/60 transition-colors pr-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Message Clara..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-white px-4 py-3 placeholder:text-zinc-600"
                  disabled={isAgentTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isAgentTyping}
                  className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
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
