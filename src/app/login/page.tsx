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
import { AlertOctagon, Phone, Globe, AlertTriangle, ArrowLeft, Sparkles, User, ShieldCheck } from "lucide-react";

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
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
              <AlertOctagon size={32} />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white font-heading">
              Daet Citizen Sign-In
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Verified accounts reduce response dispatch times during crises.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#0d1423]/90 p-8 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-red-500/20">
            {/* Custom Tab Selector */}
            <div className="flex rounded-xl bg-[#070a13] p-1 border border-white/5">
              {(["phone", "google"] as AuthMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setAuthMethod(method);
                    setError(null);
                  }}
                  className={`relative flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    authMethod === method
                      ? "bg-red-600 text-white shadow-lg shadow-red-950/40"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {method === "phone" ? (
                    <>
                      <Phone size={14} />
                      <span>Phone OTP</span>
                    </>
                  ) : (
                    <>
                      <Globe size={14} />
                      <span>Google Login</span>
                    </>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 relative min-h-[180px]">
              {/* Form container with sliding animations */}
              <div className="space-y-4">
                <div className="glow-focus-red rounded-xl border border-white/10 bg-[#070a13] px-3.5 py-2.5 transition-all duration-200 flex items-center gap-3">
                  <User size={16} className="text-slate-500" />
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
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
                      <div className="glow-focus-red rounded-xl border border-white/10 bg-[#070a13] px-3.5 py-2.5 transition-all duration-200 flex items-center gap-3">
                        <Phone size={16} className="text-slate-500" />
                        <div className="flex-1">
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
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
                    </div>

                    {/* Slide 2: OTP input */}
                    <div
                      className={`fade-transition space-y-3 ${
                        !otpSent
                          ? "opacity-0 translate-x-12 pointer-events-none absolute inset-x-0"
                          : "opacity-100 translate-x-0"
                      }`}
                    >
                      <div className="glow-focus-red rounded-xl border border-white/10 bg-[#070a13] px-3.5 py-2.5 transition-all duration-200">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 text-center mb-1">
                          One-Time PIN
                        </label>
                        <input
                          type="text"
                          value={otp}
                          maxLength={6}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="••••••"
                          className="w-full bg-transparent text-center text-lg font-mono tracking-[0.3em] text-white outline-none placeholder:text-slate-800"
                          required
                        />
                      </div>
                      {devOtp && (
                        <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/10 px-4 py-2.5 text-center flex items-center justify-center gap-2">
                          <ShieldCheck size={14} className="text-emerald-400" />
                          <p className="text-xs text-emerald-400/90 font-medium">
                            Demo Code: <strong className="font-mono text-sm underline select-all">{devOtp}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-red-500/20 bg-red-950/5 p-5 text-center fade-transition flex flex-col items-center gap-2">
                    <Sparkles size={20} className="text-red-400/70" />
                    <p className="text-xs text-slate-400 leading-normal max-w-[280px]">
                      Simulates instant Google ID authentication for validation testing.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-950/30 border border-red-500/20 px-4 py-3 text-xs text-red-300 flex items-start gap-2 leading-relaxed">
                <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleVerify}
              disabled={isLoading}
              className="mt-6 w-full rounded-xl bg-red-600 hover:bg-red-500 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-red-900/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 cursor-pointer"
            >
              {isLoading
                ? "Tactical Connection..."
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
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 hover:underline transition font-semibold"
                >
                  <ArrowLeft size={12} />
                  <span>Change phone number</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
