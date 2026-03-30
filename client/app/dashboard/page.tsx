"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Clock,
  User,
  Bot,
  MessageSquare,
  Terminal,
  ExternalLink,
  FileText,
  CheckCircle2,
} from "lucide-react";
import AxiosInstance from "../config/AxiosInstance";
import DashboardHeader from "../Components/DashboardHeader";
import ClaraAgent from "../Components/ClaraAgent";

const CountdownTimer = ({ targetTime }: { targetTime: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const diff = new Date(targetTime).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft("DEPLOYMENT IMMINENT");
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
      setTimeLeft(`-${h}:${m}:${s}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] text-cyan-500/70 font-bold uppercase tracking-widest mb-0.5">
        Time to Infiltration
      </span>
      <span className="font-mono text-xs tracking-widest text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2.5 py-1 rounded flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
        <Terminal size={12} /> {timeLeft}
      </span>
    </div>
  );
};

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

export default function DashboardPage() {
  const router = useRouter();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "clara",
      content: "Clara network connected. How can I adjust your schedule today?",
    },
  ]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [isFetchingReport, setIsFetchingReport] = useState(false); // 🌟 New State
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [meetingsRes, profileRes] = await Promise.all([
          AxiosInstance.get("/calendar/all/meetings"),
          AxiosInstance.get("/users/profile"),
        ]);
        setMeetings(meetingsRes.data.meetings || []);
        setUserProfile(profileRes.data.user || null);
      } catch (error: any) {
        if (error.response?.status === 401) router.replace("/signup");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();

    const syncInterval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(syncInterval);
  }, [router]);

  useEffect(() => {
    if (chatEndRef.current)
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAgentTyping, isChatOpen]);

  const handleLogout = () => {
    localStorage.removeItem("clara_access_token");
    router.replace("/signup");
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
      setChatMessages((prev) => [
        ...prev,
        { role: "clara", content: res.data.message || res.data.response },
      ]);

      const meetingsRes = await AxiosInstance.get("/calendar/all/meetings");
      setMeetings(meetingsRes.data.meetings || []);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        { role: "clara", content: "Connection disrupted." },
      ]);
    } finally {
      setIsAgentTyping(false);
    }
  };

  // 🌟 FULLY WIRED MISSION REPORT FUNCTION
  const handleFetchReport = async (googleEventId: string) => {
    if (isFetchingReport) return;

    setIsFetchingReport(true);
    setIsChatOpen(true); // Pop open the chat window
    setIsAgentTyping(true);

    setChatMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: "Clara, fetch the mission report for this meeting.",
      },
    ]);

    try {
      const res = await AxiosInstance.get(`/ai/report/${googleEventId}`);

      setChatMessages((prev) => [
        ...prev,
        // Using res.data.report assuming your backend returns { success: true, report: "..." }
        { role: "clara", content: res.data.report.response || res.data.report },
      ]);
    } catch (error) {
      console.error(error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "clara",
          content:
            "Error: I was unable to decrypt the databanks for that meeting. The transcript might not be ready yet.",
        },
      ]);
    } finally {
      setIsAgentTyping(false);
      setIsFetchingReport(false);
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

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#030008] flex items-center justify-center text-purple-500">
        Decrypting Databanks...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#030008] text-zinc-100 font-sans relative overflow-hidden selection:bg-purple-500/30">
      <div className="fixed top-[-20%] right-[-10%] w-200 h-200 bg-purple-900/10 rounded-full blur-[180px] pointer-events-none" />

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
            <div className="flex-1 overflow-y-auto scrollbar-small p-5 space-y-4">
              {humanMeetings.map((meeting) => (
                <div
                  key={meeting.googleEventId}
                  className="bg-black/50 border border-white/10 rounded-2xl p-6 hover:border-pink-500/30 transition-all group mb-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h4 className="font-bold text-white text-lg">
                      {meeting.title}
                    </h4>
                    <span className="shrink-0 text-[10px] font-bold text-pink-400 bg-pink-400/10 border border-pink-500/20 px-2.5 py-1 rounded-md uppercase">
                      Human
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-400 mb-5">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-pink-400" />{" "}
                      {formatTime(meeting.startTime)} -{" "}
                      {formatTime(meeting.endTime)}
                    </div>
                  </div>

                  {meeting.meetLink && (
                    <a
                      href={meeting.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-950/30 px-3 py-1.5 rounded-lg border border-blue-900/50 transition-colors"
                    >
                      <ExternalLink size={14} /> Jump to Room
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col h-full bg-[#0a0314]/60 border border-purple-500/20 rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_0_50px_rgba(147,51,234,0.05)]">
            <div className="p-5 border-b border-purple-500/20 bg-black/60 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
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

            <div className="flex-1 overflow-y-auto scrollbar-small p-5 space-y-4 relative">
              {botMeetings.map((meeting) => {
                const isInfiltrating = meeting.status === "infiltrated";
                const isCompleted = meeting.status === "completed"; // Webhook will set this!

                return (
                  <div
                    key={meeting.googleEventId}
                    className={`relative rounded-2xl p-6 transition-all group mb-4 overflow-hidden shadow-lg 
                      ${
                        isInfiltrating
                          ? "bg-[#0a0514] border-2 border-cyan-500/80 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                          : isCompleted
                            ? "bg-[#05140a] border border-emerald-500/30"
                            : "bg-[#05000a] border border-purple-500/30"
                      }`}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 
                        ${
                          isInfiltrating
                            ? "bg-cyan-400"
                            : isCompleted
                              ? "bg-emerald-500"
                              : "bg-purple-500"
                        }`}
                    />

                    {isInfiltrating && (
                      <div className="absolute inset-0 bg-cyan-500/5 animate-pulse pointer-events-none" />
                    )}

                    <div className="flex items-start justify-between gap-4 mb-4 pl-2 relative z-10">
                      <h4
                        className={`font-bold text-lg leading-tight 
                          ${
                            isInfiltrating
                              ? "text-cyan-50"
                              : isCompleted
                                ? "text-emerald-50"
                                : "text-white"
                          }`}
                      >
                        {meeting.title}
                      </h4>

                      {isInfiltrating ? (
                        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase flex items-center gap-1.5 border bg-cyan-900/40 text-cyan-300 border-cyan-500/50">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />{" "}
                          INFILTRATING
                        </span>
                      ) : isCompleted ? (
                        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase flex items-center gap-1.5 border bg-emerald-900/40 text-emerald-400 border-emerald-500/50">
                          <CheckCircle2 size={12} /> COMPLETED
                        </span>
                      ) : (
                        <CountdownTimer targetTime={meeting.startTime} />
                      )}
                    </div>

                    <div className="pl-2 relative z-10 space-y-4">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-zinc-500">
                        <span className="flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-lg border border-white/5">
                          <Clock
                            size={14}
                            className={
                              isInfiltrating
                                ? "text-cyan-400"
                                : isCompleted
                                  ? "text-emerald-400"
                                  : "text-purple-400"
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
                            className="flex items-center gap-1.5 text-blue-400 bg-blue-950/30 px-3 py-1.5 rounded-lg border border-blue-900/50 hover:bg-blue-900/40 transition-colors truncate max-w-50"
                          >
                            <ExternalLink size={12} />{" "}
                            {meeting.meetLink.replace("https://", "")}
                          </a>
                        )}
                      </div>

                      <div className="bg-black/60 border border-white/5 rounded-xl p-3 shadow-inner">
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <Terminal size={10} /> Agent Reasoning
                        </span>
                        <p className="text-sm text-zinc-300 italic font-medium">
                          "{meeting.reason}"
                        </p>
                      </div>

                      {/* 🌟 FETCH BUTTON UI UPDATED WITH LOADING STATE */}
                      {isCompleted && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            handleFetchReport(meeting.googleEventId)
                          }
                          disabled={isFetchingReport}
                          className={`w-full mt-2 border py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] ${
                            isFetchingReport
                              ? "bg-zinc-800/50 border-zinc-700 text-zinc-500 cursor-not-allowed"
                              : "bg-linear-to-r from-emerald-600/20 to-teal-600/20 border-emerald-500/40 text-emerald-300 hover:from-emerald-600/30 hover:to-teal-600/30"
                          }`}
                        >
                          <FileText size={16} />
                          {isFetchingReport
                            ? "Decrypting Audio Logs..."
                            : "Fetch Mission Report"}
                        </motion.button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-linear-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.4)] z-50"
      >
        <MessageSquare size={24} />
      </motion.button>
    </div>
  );
}
