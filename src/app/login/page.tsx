"use client";

import { AppShell } from "@/components/AppShell";
import {
  createCitizenSession,
  loadSession,
  saveSession,
} from "@/lib/auth";
import { DEMO_OTP } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthMethod = "phone" | "google";

export default function CitizenLoginPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const s = loadSession();
    if (s && s.role === "citizen") {
      router.replace("/citizen");
    } else {
      setSession(s);
    }
  }, [router]);

  async function handleVerify() {
    setError(null);
    setIsLoading(true);

    if (authMethod === "google") {
      const s = createCitizenSession({
        name: name || "Google User",
        phone: phone || "+639000000000",
        authMethod: "google",
      });
      saveSession(s);
      router.replace("/citizen");
      return;
    }

    if (!otpSent) {
      if (!phone.trim()) {
        setError("Enter your phone number first.");
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, purpose: "login" }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to send OTP.");
          setIsLoading(false);
          return;
        }
        setOtpSent(true);
        if (data.code) {
          setDevOtp(data.code);
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Verify OTP
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid OTP.");
        setIsLoading(false);
        return;
      }
      saveSession(data.session);
      router.replace("/citizen");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell role="Citizen Login">
      <div className="relative flex min-h-[70vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* SOS Pulse Beacon Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-80 h-80 border border-red-500/10 rounded-full sos-beacon-1" />
          <div className="absolute w-80 h-80 border border-red-500/8 rounded-full sos-beacon-2" />
          <div className="absolute w-80 h-80 border border-red-500/5 rounded-full sos-beacon-3" />
        </div>

        <div className="relative w-full max-w-md space-y-8 fade-transition scale-100">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-700/10 border border-red-500/30 text-3xl text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
              🆘
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
              Daet Citizen Sign-In
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Verified accounts reduce response dispatch times during crises.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-red-900/30 bg-[#111827]/90 p-8 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:border-red-950/60">
            {/* Custom Tab Selector */}
            <div className="flex rounded-xl bg-[#0a0f1a] p-1 border border-white/5">
              {(["phone", "google"] as AuthMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setAuthMethod(method);
                    setError(null);
                  }}
                  className={`relative flex-1 rounded-lg py-2.5 text-sm font-semibold tracking-wide transition-all duration-300 ${
                    authMethod === method
                      ? "bg-red-700 text-white shadow-lg shadow-red-900/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {method === "phone" ? "📱 Phone OTP" : "🌐 Google Sign-In"}
                </button>
              ))}
            </div>

            <div className="mt-6 relative min-h-[180px]">
              {/* Form container with sliding animations */}
              <div className="space-y-4">
                <div className="glow-focus-red rounded-lg border border-[#3d4f6f] bg-[#0a0f1a] px-3 py-2 transition-all duration-200">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600 mt-0.5"
                    required
                  />
                </div>

                {authMethod === "phone" ? (
                  <div className="relative overflow-hidden min-h-[80px]">
                    {/* Slide 1: Phone input */}
                    <div
                      className={`fade-transition space-y-4 ${
                        otpSent
                          ? "opacity-0 -translate-x-12 pointer-events-none absolute inset-x-0"
                          : "opacity-100 translate-x-0"
                      }`}
                    >
                      <div className="glow-focus-red rounded-lg border border-[#3d4f6f] bg-[#0a0f1a] px-3 py-2 transition-all duration-200">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+63 9XX XXX XXXX"
                          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600 mt-0.5"
                          required
                        />
                      </div>
                    </div>

                    {/* Slide 2: OTP input */}
                    <div
                      className={`fade-transition space-y-2 ${
                        !otpSent
                          ? "opacity-0 translate-x-12 pointer-events-none absolute inset-x-0"
                          : "opacity-100 translate-x-0"
                      }`}
                    >
                      <div className="glow-focus-red rounded-lg border border-[#3d4f6f] bg-[#0a0f1a] px-3 py-2 transition-all duration-200">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          One-Time PIN
                        </label>
                        <input
                          type="text"
                          value={otp}
                          maxLength={6}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="******"
                          className="w-full bg-transparent text-center text-lg font-mono tracking-[0.3em] text-white outline-none placeholder:text-slate-700 mt-0.5"
                          required
                        />
                      </div>
                      {devOtp && (
                        <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/20 px-3 py-2 text-center">
                          <p className="text-xs text-emerald-400">
                            Demo Mode Code: <strong className="font-mono text-sm underline select-all">{devOtp}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-red-500/20 bg-red-950/10 p-5 text-center fade-transition">
                    <p className="text-sm text-slate-300">
                      You can click below to simulate a Google Identity sign-in instantly for local testing.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-950/60 border border-red-500/30 px-4 py-2.5 text-sm text-red-200">
                ⚠️ {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleVerify}
              disabled={isLoading}
              className="mt-6 w-full rounded-xl bg-red-700 hover:bg-red-600 py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-red-900/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
            >
              {isLoading
                ? "Connecting..."
                : authMethod === "phone" && !otpSent
                ? "Send Verification PIN"
                : "Verify & Enter Portal"}
            </button>

            {authMethod === "phone" && otpSent && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setError(null);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 hover:underline"
                >
                  ← Change phone number
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
