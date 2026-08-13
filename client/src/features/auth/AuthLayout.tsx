import React from "react";
import { motion } from "motion/react";
import { LumaLogo } from "../../components/LumaLogo";

interface AuthLayoutProps {
  children: React.ReactNode;
  taglineHeader?: string;
  taglineTitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  taglineHeader = "You can easily",
  taglineTitle = "Get access to your personal hub for clarity and productivity",
}) => {
  return (
    <div className="min-h-screen w-full bg-black text-zinc-100 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Subtle ambient outer dark background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-900/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-900/20 rounded-full blur-[128px] pointer-events-none" />

      {/* Main Authentication Card Frame */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl bg-zinc-900/90 border border-zinc-800/80 rounded-3xl shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px] my-auto"
      >
        {/* Left Visual Panel - Mesh Gradient Artwork matching reference */}
        <div className="lg:col-span-5 hidden lg:flex flex-col justify-between p-4 relative overflow-hidden">
          <div className="w-full h-full rounded-2xl relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-800 p-8 flex flex-col justify-between border border-white/10 shadow-inner">
            {/* Dynamic Mesh Animated Lighting Effects */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-cyan-400/30 blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-purple-500/40 blur-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />

            {/* Top Left Branding Star Icon */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="2" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
                Luma
              </span>
            </div>

            {/* Bottom Hero Tagline matching reference layout */}
            <div className="relative z-10 space-y-2 mt-auto pt-12">
              <p className="text-xs uppercase tracking-wider text-indigo-200 font-medium">
                {taglineHeader}
              </p>
              <h2 className="text-2xl xl:text-3xl font-semibold tracking-tight text-white leading-tight">
                {taglineTitle}
              </h2>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center relative bg-zinc-900/60">
          {/* Mobile Top Brand Header */}
          <div className="flex lg:hidden mb-8 items-center justify-between">
            <LumaLogo size="md" />
          </div>

          <div className="w-full max-w-md mx-auto">{children}</div>
        </div>
      </motion.div>
    </div>
  );
};
