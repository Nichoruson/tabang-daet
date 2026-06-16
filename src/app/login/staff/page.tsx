"use client";

import { AppShell } from "@/components/AppShell";
import {
  createStaffSession,
  loadSession,
  saveSession,
  verifyStaffLogin,
} from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Radio, Shield, AlertTriangle, User, Lock, Terminal } from "lucide-react";

type StaffRole = "dispatcher" | "responder";

function StaffLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine initial role from URL query param, default to "dispatcher"
  const urlRole = searchParams.get("role");
  const initialRole: StaffRole = urlRole === "responder" ? "responder" : "dispatcher";

  const [role, setRole] = useState<StaffRole>(initialRole);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If a parameter changes the role, update state
    if (urlRole === "dispatcher" || urlRole === "responder") {
      setRole(urlRole);
    }
  }, [urlRole]);

  useEffect(() => {
    const s = loadSession();
    if (s) {
      if (s.role === "dispatcher") {
        router.replace("/dispatcher");
      } else if (s.role === "responder") {
        router.replace("/responder");
      }
    }
  }, [router]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    // Artificial tiny delay for premium login loading feel
    setTimeout(() => {
      if (!verifyStaffLogin(role, username, password)) {
        setError("Access Denied: Invalid credentials for this tactical unit.");
        setIsLoading(false);
        return;
      }

      const label = role === "dispatcher" ? "Command Dispatcher" : "Field Responder";
      saveSession(createStaffSession(role, label));

      if (role === "dispatcher") {
        router.replace("/dispatcher");
      } else {
        router.replace("/responder");
      }
    }, 800);
  }

  // Dynamic values depending on selected role
  const isDispatcher = role === "dispatcher";
  const portalName = isDispatcher ? "MDRRMO Command Center" : "Field Emergency Unit";
  const credentialsHint = isDispatcher
    ? "mdrrmo / tabang2026"
    : "responder / field2026";

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden cyber-grid rounded-3xl">
      {/* Cyber Grid Radar Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
        <div
          className={`radar-sweep-bg transition-all duration-700 ${
            !isDispatcher ? "radar-sweep-bg-amber" : ""
          }`}
        />
      </div>

      <div className="relative w-full max-w-md space-y-8">
        <div className="text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0d1423] border transition-all duration-500 shadow-lg ${
              isDispatcher
                ? "border-blue-500/30 text-blue-400 shadow-blue-500/20"
                : "border-amber-500/30 text-amber-500 shadow-amber-500/20"
            }`}
          >
            {isDispatcher ? <Radio size={28} /> : <Shield size={28} />}
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white transition-all duration-300 font-heading">
            {portalName}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Secure tactical system access. Unauthorized access is audited.
          </p>
        </div>

        {/* Login Card with dynamic border color based on selected role */}
        <div
          className={`relative overflow-hidden rounded-3xl border bg-[#0d1423]/90 p-8 shadow-2xl backdrop-blur-md transition-all duration-500 ${
            isDispatcher
              ? "border-blue-900/40 shadow-blue-950/20"
              : "border-amber-900/40 shadow-amber-950/20"
          }`}
        >
          {/* Cyber Scanning Line */}
          <div
            className={`transition-all duration-500 ${
              isDispatcher ? "cyber-scanner" : "cyber-scanner-amber"
            }`}
          />

          {/* Slide toggle selection for Dispatcher vs Responder */}
          <div className="relative flex rounded-xl bg-[#070a13] p-1 border border-white/5">
            {/* Sliding Pill Indicator */}
            <div
              className={`absolute top-1 bottom-1 rounded-lg bg-gradient-to-r transition-all duration-300 ${
                isDispatcher
                  ? "left-1 w-[calc(50%-4px)] from-blue-600 to-blue-700 shadow-lg shadow-blue-900/30"
                  : "left-[calc(50%+2px)] w-[calc(50%-4px)] from-amber-500 to-amber-600 shadow-lg shadow-amber-900/30"
              }`}
            />

            <button
              key="dispatcher-btn"
              type="button"
              onClick={() => {
                setRole("dispatcher");
                setError("");
                setUsername("");
                setPassword("");
              }}
              className={`z-10 flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                isDispatcher ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Radio size={14} />
              <span>Dispatcher</span>
            </button>
            <button
              key="responder-btn"
              type="button"
              onClick={() => {
                setRole("responder");
                setError("");
                setUsername("");
                setPassword("");
              }}
              className={`z-10 flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                !isDispatcher ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Shield size={14} />
              <span>Responder</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Username Input */}
            <div
              className={`rounded-xl border bg-[#070a13] px-3.5 py-2.5 transition-all duration-200 flex items-center gap-3 ${
                isDispatcher
                  ? "border-[#3d4f6f] glow-focus-blue"
                  : "border-[#3d4f6f] glow-focus-amber"
              }`}
            >
              <User size={16} className="text-slate-500" />
              <div className="flex-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Operator ID / Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isDispatcher ? "e.g., mdrrmo" : "e.g., responder"}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-700 mt-0.5"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div
              className={`rounded-xl border bg-[#070a13] px-3.5 py-2.5 transition-all duration-200 flex items-center gap-3 ${
                isDispatcher
                  ? "border-[#3d4f6f] glow-focus-blue"
                  : "border-[#3d4f6f] glow-focus-amber"
              }`}
            >
              <Lock size={16} className="text-slate-500" />
              <div className="flex-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Secure Key / Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-700 mt-0.5"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="fade-transition rounded-xl border p-3 text-xs leading-relaxed bg-red-950/20 border-red-500/20 text-red-300 flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Demo Credentials Alert Banner */}
            <div className="rounded-xl bg-[#070a13] border border-white/5 p-3 text-center flex items-center justify-center gap-2">
              <Terminal size={12} className="text-slate-500" />
              <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                Access Code:{" "}
                <code
                  className={`font-mono font-bold select-all ${
                    isDispatcher ? "text-blue-400" : "text-amber-400"
                  }`}
                >
                  {credentialsHint}
                </code>
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 cursor-pointer ${
                isDispatcher
                  ? "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-950/40"
                  : "bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-950/40"
              }`}
            >
              {isLoading ? "Tactical Authorization..." : "Establish Secure Link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <AppShell role="Staff Portal">
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <p className="text-slate-400 font-heading">Loading auth client...</p>
          </div>
        }
      >
        <StaffLoginContent />
      </Suspense>
    </AppShell>
  );
}
