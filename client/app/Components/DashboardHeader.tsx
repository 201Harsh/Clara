import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronDown, LogOut, ShieldAlert } from "lucide-react";

const DashboardHeader = ({
  setIsDropdownOpen,
  isDropdownOpen,
  userProfile,
  setIsRoleModalOpen,
  handleLogout,
  isRoleModalOpen
}: any) => {
  return (
    <>
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-purple-500/20 shadow-[0_0_30px_rgba(147,51,234,0.05)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
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

          {userProfile && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all px-2 py-2 pr-4 rounded-full cursor-pointer"
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
                        <ShieldAlert size={12} /> {userProfile.role}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsRoleModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:bg-white/5 hover:text-white transition-colors text-sm font-bold cursor-pointer mb-1"
                    >
                      <ShieldAlert size={16} className="text-purple-400" />{" "}
                      Change Protocol Role
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-bold cursor-pointer"
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
    </>
  );
};

export default DashboardHeader;
