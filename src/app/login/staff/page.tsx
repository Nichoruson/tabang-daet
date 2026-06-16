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
  const themeColor = isDispatcher ? "blue" : "amber";
  const portalName = isDispatcher ? "MDRRMO Command Center" : "Field Emergency Unit";
  const portalIcon = isDispatcher ? "📡" : "🚑";
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
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#111827] border transition-all duration-500 text-3xl shadow-lg ${
              isDispatcher
                ? "border-blue-500/30 text-blue-400 shadow-blue-500/20"
                : "border-amber-500/30 text-amber-500 shadow-amber-500/20"
            }`}
          >
            {portalIcon}
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white transition-all duration-300">
            {portalName}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Secure tactical system access. Unauthorized access is audited.
          </p>
        </div>

        {/* Login Card with dynamic border color based on selected role */}
        <div
          className={`relative overflow-hidden rounded-2xl border bg-[#111827]/90 p-8 shadow-2xl backdrop-blur-md transition-all duration-500 ${
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
          <div className="relative flex rounded-xl bg-[#0a0f1a] p-1 border border-white/5">
            {/* Sliding Pill Indicator */}
            <div
              className={`absolute top-1 bottom-1 rounded-lg bg-gradient-to-r transition-all duration-300 ${
                isDispatcher
                  ? "left-1 w-[calc(50%-4px)] from-blue-700 to-blue-800 shadow-lg shadow-blue-900/30"
                  : "left-[calc(50%+2px)] w-[calc(50%-4px)] from-amber-600 to-amber-700 shadow-lg shadow-amber-900/30"
              }`}
            />

            <button
              type="button"
              onClick={() => {
                setRole("dispatcher");
                setError("");
                setUsername("");
                setPassword("");
              }}
              className={`z-10 flex-1 rounded-lg py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                isDispatcher ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              📡 Dispatcher
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("responder");
                setError("");
                setUsername("");
                setPassword("");
              }}
              className={`z-10 flex-1 rounded-lg py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                !isDispatcher ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              🚑 Responder
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Username Input */}
            <div
              className={`rounded-lg border bg-[#0a0f1a] px-3 py-2 transition-all duration-200 ${
                isDispatcher
                  ? "border-[#3d4f6f] glow-focus-blue"
                  : "border-[#3d4f6f] glow-focus-amber"
              }`}
            >
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
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

            {/* Password Input */}
            <div
              className={`rounded-lg border bg-[#0a0f1a] px-3 py-2 transition-all duration-200 ${
                isDispatcher
                  ? "border-[#3d4f6f] glow-focus-blue"
                  : "border-[#3d4f6f] glow-focus-amber"
              }`}
            >
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
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

            {/* Error Message */}
            {error && (
              <div
                className={`fade-transition rounded-lg border p-3 text-xs leading-relaxed ${
                  isDispatcher
                    ? "bg-red-950/40 border-red-500/30 text-red-300"
                    : "bg-red-950/40 border-red-500/30 text-red-300"
                }`}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Demo Credentials Alert Banner */}
            <div className="rounded-lg bg-[#0a0f1a] border border-white/5 p-3 text-center">
              <p className="text-[11px] text-slate-500">
                Local Environment Access Code:{" "}
                <code
                  className={`font-mono font-bold select-all ${
                    isDispatcher ? "text-blue-300" : "text-amber-300"
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
                  ? "bg-blue-700 hover:bg-blue-600 shadow-lg shadow-blue-950/50"
                  : "bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-950/50"
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
            <p className="text-slate-400">Loading auth client...</p>
          </div>
        }
      >
        <StaffLoginContent />
      </Suspense>
    </AppShell>
  );
}
