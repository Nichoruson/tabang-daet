"use client";

import { AppShell } from "@/components/AppShell";
import { createIncident } from "@/lib/api-client";
import {
  clearSession,
  createCitizenSession,
  loadSession,
  saveSession,
  verifyOtp,
} from "@/lib/auth";
import { CATEGORY_META, DAET_CENTER, DEMO_OTP } from "@/lib/constants";
import {
  enqueueOfflineReport,
  flushOfflineQueue,
  loadOfflineQueue,
} from "@/lib/offline-queue";
import { getCitizenDemoStateLabel } from "@/lib/citizen";
import type { AuthMethod, EmergencyCategory, IncidentReport } from "@/lib/types";
import dynamic from "next/dynamic";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  MapPin,
  Camera,
  AlertOctagon,
  RefreshCw,
  Send,
  CheckCircle2,
  LogOut,
  Loader2,
  Navigation,
  Clock,
  Activity,
  MessageSquare,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

const Map = dynamic(
  () => import("@/components/EmergencyMap").then((m) => m.EmergencyMap),
  { ssr: false, loading: () => (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-white/5 bg-[#0d1423] text-slate-400 font-heading">
      <Loader2 className="animate-spin text-red-500 mr-2" size={18} />
      <span>Loading Tactical Map…</span>
    </div>
  )},
);

export default function CitizenPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const s = loadSession();
    if (!s || s.role !== "citizen") {
      router.replace("/login");
    } else {
      setSession(s);
      setLoadingSession(false);
    }
  }, [router]);
  const [category, setCategory] = useState<EmergencyCategory>("medical");
  const [description, setDescription] = useState("");
  const [landmark, setLandmark] = useState("");
  const [lat, setLat] = useState<number>(DAET_CENTER.lat);
  const [lng, setLng] = useState<number>(DAET_CENTER.lng);
  const [photo, setPhoto] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<IncidentReport | null>(null);
  const [online, setOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);

  const refreshQueue = () => setQueueCount(loadOfflineQueue().length);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    refreshQueue();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const syncOffline = useCallback(async () => {
    if (!session || session.role !== "citizen") return;
    const sent = await flushOfflineQueue(async (report) => {
      await createIncident(report);
    });
    if (sent > 0) refreshQueue();
  }, [session]);

  useEffect(() => {
    if (online) syncOffline();
  }, [online, syncOffline]);

  useEffect(() => {
    if (!activeReport?.id) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/incidents/${activeReport.id}`, {
          cache: "no-store",
        });
        if (res.ok) setActiveReport(await res.json());
      } catch {
        /* ignore poll errors */
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [activeReport?.id]);

  async function handleVerify() {
    if (authMethod === "google") {
      const s = createCitizenSession({
        name: name || "Google User",
        phone: phone || "+639000000000",
        authMethod: "google",
      });
      saveSession(s);
      setSession(s);
      return;
    }
    if (!otpSent) {
      if (!phone.trim()) {
        setError("Enter your phone number first.");
        return;
      }
      setError(null);
      setDevOtp(null);
      try {
        const res = await fetch("/api/auth/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, purpose: "login" }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to send OTP.");
          return;
        }
        setOtpSent(true);
        if (data.code) {
          setDevOtp(data.code);
        }
      } catch (err) {
        setError("Network error. Please try again.");
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
        return;
      }
      saveSession(data.session);
      setSession(data.session);
      setError(null);
      setDevOtp(null);
    } catch (err) {
      setError("Network error. Please try again.");
    }
  }

  function captureGps() {
    if (!navigator.geolocation) {
      setError("GPS not available on this device.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGpsLoading(false);
      },
      () => {
        setError("Could not get GPS. Adjust the pin on the map.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      setError("Verify your account before reporting.");
      return;
    }
    if (!photo) {
      setError("Capture a live photo of the incident (gallery disabled).");
      return;
    }

    const payload = {
      category,
      reporterId: session.id,
      reporterName: session.name,
      reporterPhone: session.phone,
      description,
      landmark,
      latitude: lat,
      longitude: lng,
      photoDataUrl: photo,
    };

    setSubmitting(true);
    setError(null);

    try {
      if (!navigator.onLine) {
        enqueueOfflineReport(payload);
        refreshQueue();
        setError(null);
        alert("You are offline. Report queued and will send when connection returns.");
        setSubmitting(false);
        return;
      }

      const incident = await createIncident(payload);
      setActiveReport(incident);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingSession || !session || session.role !== "citizen") {
    return (
      <AppShell role="Citizen" online={online}>
        <div className="flex h-64 items-center justify-center text-slate-400 font-heading">
          <Loader2 className="animate-spin text-red-500 mr-2" size={18} />
          <span>Authenticating and establishing secure reporter link…</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="Citizen" badge={session.name} online={online}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading tracking-tight">Emergency Operations Portal</h1>
          <p className="mt-1 text-sm text-slate-400">
            {getCitizenDemoStateLabel(!!activeReport)}
            {queueCount > 0 ? ` · ${queueCount} queued offline` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearSession();
            router.replace("/login");
          }}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-red-400 transition duration-200 cursor-pointer"
        >
          <LogOut size={12} />
          <span>Change Account</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          {!activeReport ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Emergency Category
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(CATEGORY_META) as EmergencyCategory[]).map((key) => {
                    const meta = CATEGORY_META[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCategory(key)}
                        className={`rounded-2xl border-2 p-4 text-left transition-all duration-300 flex flex-col justify-between min-h-[100px] cursor-pointer ${
                          category === key
                            ? `${meta.color} border-white/30 ring-2 ${meta.ring} scale-[1.02]`
                            : "border-white/5 bg-[#0d1423] opacity-85 hover:opacity-100 hover:border-white/10"
                        }`}
                      >
                        <CategoryIcon category={key} size={28} />
                        <p className="mt-2 font-bold text-white font-heading text-sm uppercase tracking-wider">{meta.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    GPS Coordinates
                  </span>
                  <button
                    type="button"
                    onClick={captureGps}
                    disabled={gpsLoading}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition duration-200 cursor-pointer"
                  >
                    {gpsLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Navigation size={12} />
                    )}
                    <span>{gpsLoading ? "Locating…" : "Calibrate GPS"}</span>
                  </button>
                </div>
                <div className="rounded-2xl border border-white/5 overflow-hidden shadow-lg">
                  <Map
                    center={{ lat, lng }}
                    zoom={15}
                    height="220px"
                    draggablePin
                    onPinMove={(la, ln) => {
                      setLat(la);
                      setLng(ln);
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 font-mono flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  <span>Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)} — (Drag red pin to refine location)</span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Visual Landmark / Location Details
                </label>
                <div className="rounded-xl border border-white/10 bg-[#070a13] px-3.5 py-2.5 transition-all duration-200 focus-within:border-red-500/50">
                  <input
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Barangay Hall, front of market entrance..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Describe what happened
                </label>
                <div className="rounded-xl border border-white/10 bg-[#070a13] px-3.5 py-2.5 transition-all duration-200 focus-within:border-red-500/50">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                    placeholder="Detail the hazard, injuries, and number of people involved..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600 resize-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-red-500/20 bg-red-500/5 p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-red-400">
                  <Camera size={18} />
                  <p className="font-bold text-xs uppercase tracking-wider font-heading">Camera Capture Verification</p>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Tactical direct camera upload is enforced. Photo file selection is disabled to ensure report credibility.
                </p>
                
                <label className="flex flex-col items-center justify-center border border-white/5 bg-[#070a13] rounded-xl py-6 cursor-pointer hover:border-red-500/30 transition duration-200">
                  <Camera size={24} className="text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-300">Tap to Capture Incident Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhoto}
                    className="hidden"
                  />
                </label>

                {photo ? (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt="Incident Evidence"
                      className="max-h-48 w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>

              {error ? (
                <div className="rounded-xl bg-red-950/20 border border-red-500/20 p-4 text-xs text-red-300 flex items-start gap-2">
                  <AlertOctagon size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 py-4 text-sm font-extrabold uppercase tracking-widest text-white shadow-lg shadow-red-950/40 hover:shadow-red-500/20 hover:shadow-2xl transition duration-200 cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Broadcasting Signal...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Broadcast Emergency Signal</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-xl">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={18} />
                  <p className="text-xs font-bold uppercase tracking-wider font-heading">
                    Active Signal Broadcasting — {activeReport.id}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <CategoryIcon category={activeReport.category} size={24} />
                  <div>
                    <p className="text-lg font-bold text-white capitalize">
                      {activeReport.category} Emergency
                    </p>
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mt-0.5">
                      Status: {activeReport.status.replace("_", " ")}
                    </p>
                  </div>
                </div>
                {activeReport.assignedUnit ? (
                  <div className="mt-4 border-t border-emerald-500/10 pt-4 flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <p className="text-sm text-slate-300">
                      Dispatched Unit: <strong className="text-white">{activeReport.assignedUnit}</strong>
                      {activeReport.etaMinutes
                        ? ` (Estimated ETA: ${activeReport.etaMinutes} min)`
                        : ""}
                    </p>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setActiveReport(null)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 hover:underline transition duration-200 cursor-pointer"
              >
                <ArrowLeft size={12} />
                <span>Create New Incident Report</span>
              </button>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#0d1423] p-6 shadow-xl">
          <div className="flex items-center gap-2 text-white mb-1">
            <Activity size={18} className="text-red-500" />
            <h2 className="font-bold text-lg font-heading tracking-tight">Tactical Timeline Logs</h2>
          </div>
          <p className="text-xs text-slate-500">Telemetry feed from MDRRMO dispatchers</p>
          
          <div className="mt-6 relative border-l-2 border-slate-800 ml-3 pl-6 space-y-6 max-h-[520px] overflow-y-auto pr-2">
            {(activeReport?.timeline ?? []).map((event) => (
              <div key={event.id} className="relative">
                {/* Timeline dot */}
                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 border-2 border-red-500" />
                
                <div className="rounded-xl border border-white/5 bg-[#070a13] p-4 hover:border-slate-800 transition duration-200">
                  <p className="text-sm font-bold text-white tracking-wide">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-400 leading-normal">{event.detail}</p>
                  <p className="mt-3 text-[10px] font-semibold text-slate-600 font-mono">
                    {new Date(event.at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {!activeReport?.timeline.length ? (
              <div className="text-center py-12 flex flex-col items-center gap-3 border border-dashed border-white/5 rounded-2xl bg-[#070a13]/50 -ml-4">
                <MessageSquare size={32} className="text-slate-600" />
                <p className="text-xs text-slate-500 max-w-[200px] leading-normal font-medium text-center">
                  Submit a live signal to initialize telemetry feed.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
