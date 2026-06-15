"use client";

import { AppShell } from "@/components/AppShell";
import { createIncident } from "@/lib/api-client";
import {
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

const Map = dynamic(
  () => import("@/components/EmergencyMap").then((m) => m.EmergencyMap),
  { ssr: false, loading: () => (
    <div className="flex h-64 items-center justify-center rounded-xl border border-[#3d4f6f] bg-[#111827] text-slate-400">
      Loading map…
    </div>
  )},
);

export default function CitizenPage() {
  const [session, setSession] = useState(loadSession());
  const [authMethod, setAuthMethod] = useState<AuthMethod>("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
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

  if (!session || session.role !== "citizen") {
    return (
      <AppShell role="Citizen" online={online}>
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-white">Citizen sign-in</h1>
          <p className="mt-2 text-slate-400 text-sm">
            Verified accounts reduce false reports. Demo OTP: <strong className="text-red-300">{DEMO_OTP}</strong>
          </p>

          <div className="mt-6 flex gap-2">
            {(["phone", "google"] as AuthMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setAuthMethod(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                  authMethod === m
                    ? "bg-red-700 text-white"
                    : "bg-[#1a2332] text-slate-400"
                }`}
              >
                {m === "phone" ? "Phone OTP" : "Google"}
              </button>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="text-xs text-slate-400 uppercase">Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#3d4f6f] bg-[#0a0f1a] px-3 py-2 text-white"
            />
          </label>

          {authMethod === "phone" ? (
            <>
              <label className="mt-3 block">
                <span className="text-xs text-slate-400 uppercase">Phone</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className="mt-1 w-full rounded-lg border border-[#3d4f6f] bg-[#0a0f1a] px-3 py-2 text-white"
                />
              </label>
              {otpSent ? (
                <div className="mt-3">
                  <label className="block">
                    <span className="text-xs text-slate-400 uppercase">OTP</span>
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#3d4f6f] bg-[#0a0f1a] px-3 py-2 text-white"
                    />
                  </label>
                  {devOtp ? (
                    <p className="mt-1.5 text-xs text-emerald-400">
                      Demo Mode OTP: <strong className="font-mono text-sm underline">{devOtp}</strong>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

          <button
            type="button"
            onClick={handleVerify}
            className="mt-5 w-full rounded-lg bg-red-700 py-3 font-bold text-white"
          >
            {authMethod === "phone" && !otpSent ? "Send OTP" : "Continue"}
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="Citizen" badge={session.name} online={online}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Emergency report</h1>
          <p className="mt-1 text-sm text-slate-400">
            {getCitizenDemoStateLabel(!!activeReport)}
            {queueCount > 0 ? ` · ${queueCount} queued offline` : ""}
          </p>

          {!activeReport ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(CATEGORY_META) as EmergencyCategory[]).map((key) => {
                  const meta = CATEGORY_META[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`rounded-xl border-2 p-4 text-left transition ${
                        category === key
                          ? `${meta.color} border-white/30 ring-2 ${meta.ring}`
                          : "border-[#3d4f6f] bg-[#111827] opacity-80"
                      }`}
                    >
                      <span className="text-2xl">{meta.icon}</span>
                      <p className="mt-2 font-bold text-white">{meta.label}</p>
                    </button>
                  );
                })}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-400">
                    GPS location
                  </span>
                  <button
                    type="button"
                    onClick={captureGps}
                    disabled={gpsLoading}
                    className="rounded-lg bg-[#1a2332] px-3 py-1 text-xs font-semibold text-red-300"
                  >
                    {gpsLoading ? "Locating…" : "Use my GPS"}
                  </button>
                </div>
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
                <p className="mt-2 text-xs text-slate-500">
                  {lat.toFixed(5)}, {lng.toFixed(5)} — drag pin if needed
                </p>
              </div>

              <label className="block">
                <span className="text-xs uppercase text-slate-400">Landmark</span>
                <input
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Near barangay hall, market entrance…"
                  className="mt-1 w-full rounded-lg border border-[#3d4f6f] bg-[#0a0f1a] px-3 py-2 text-white"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase text-slate-400">
                  What happened?
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Describe injuries, hazards, people involved…"
                  className="mt-1 w-full rounded-lg border border-[#3d4f6f] bg-[#0a0f1a] px-3 py-2 text-white"
                />
              </label>

              <div className="rounded-xl border border-dashed border-red-500/40 bg-red-950/20 p-4">
                <p className="font-semibold text-white">Live photo required</p>
                <p className="mt-1 text-xs text-slate-400">
                  Camera only — gallery uploads disabled for validation.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhoto}
                  className="mt-3 block w-full text-sm text-slate-300"
                />
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt="Incident"
                    className="mt-3 max-h-40 rounded-lg border border-white/10 object-cover"
                  />
                ) : null}
              </div>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-red-600 py-4 text-lg font-extrabold uppercase tracking-wide text-white shadow-lg shadow-red-900/50 hover:bg-red-500 disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send emergency report"}
              </button>
            </form>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4">
                <p className="text-xs font-bold uppercase text-emerald-400">
                  Report active — {activeReport.id}
                </p>
                <p className="mt-2 text-white capitalize">
                  {activeReport.category} · {activeReport.status.replace("_", " ")}
                </p>
                {activeReport.assignedUnit ? (
                  <p className="mt-1 text-sm text-slate-300">
                    {activeReport.assignedUnit}
                    {activeReport.etaMinutes
                      ? ` · ETA ${activeReport.etaMinutes} min`
                      : ""}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setActiveReport(null)}
                className="text-sm text-red-300 underline"
              >
                Report another emergency
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#3d4f6f] bg-[#111827] p-5">
          <h2 className="font-bold text-white">Status updates</h2>
          <p className="text-xs text-slate-500 mt-1">Live from command center</p>
          <ul className="mt-4 space-y-3 max-h-[520px] overflow-y-auto">
            {(activeReport?.timeline ?? []).map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-white/5 bg-[#0a0f1a] p-3"
              >
                <p className="text-sm font-semibold text-red-200">{event.title}</p>
                <p className="mt-1 text-sm text-slate-400">{event.detail}</p>
                <p className="mt-2 text-xs text-slate-600">
                  {new Date(event.at).toLocaleString()}
                </p>
              </li>
            ))}
            {!activeReport?.timeline.length ? (
              <li className="text-sm text-slate-500">
                Submit a report to receive step-by-step notifications.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
