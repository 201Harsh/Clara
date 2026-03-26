"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send } from "lucide-react";
import AxiosInstance from "../config/AxiosInstance";

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string | null;
}

export default function ClaraAgent({
  isOpen,
  onClose,
  userRole,
}: ChatbotProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<
    { role: "user" | "bot"; text: string }[]
  >([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleSend = async () => {
    if (!prompt.trim() || !userRole) return;

    const userMessage = prompt;
    setResponses((prev) => [...prev, { role: "user", text: userMessage }]);
    setPrompt("");
    setIsLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const response = await AxiosInstance.post("/ai/clara/triage", {
        prompt: userMessage,
        role: userRole,
      });

      const data = response.data;
      console.log(data)

      setResponses((prev) => [
        ...prev,
        { role: "bot", text: data.message || "Protocol updated successfully." },
      ]);
    } catch (error) {
      setResponses((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Connection to AI core failed. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-112.5 bg-[#0a0514] border-l border-purple-500/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 flex flex-col"
          >
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  <Bot size={18} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-md font-bold text-white leading-tight">
                    Clara Command
                  </h2>
                  <p className="text-xs text-purple-400">Agent Online</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-small">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-sm text-purple-200">
                Connection established. I am monitoring your schedule context.
                How would you like me to adjust the protocol?
              </div>

              {responses.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-purple-600 text-white rounded-br-none" : "bg-white/10 text-zinc-200 rounded-bl-none border border-white/5"}`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1.5 items-center">
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
            </div>

            <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md">
              <div className="relative flex items-end gap-2 bg-black/50 border border-white/10 rounded-2xl p-2 focus-within:border-purple-500/50 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={handleInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Message Clara..."
                  className="w-full scrollbar-small bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none resize-none max-h-37.5 min-h-6 py-2 pl-3"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!prompt.trim() || isLoading}
                  className="shrink-0 p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:bg-zinc-800"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
