import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X } from "lucide-react";

const ClaraAgent = ({
  isChatOpen,
  setIsChatOpen,
  chatInput,
  setChatInput,
  chatMessages,
  isAgentTyping,
  chatEndRef,
  handleSendMessage,
}: any) => {
  return (
    <>
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
              {chatMessages.map((msg : any, idx : number) => (
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
    </>
  );
};

export default ClaraAgent;
