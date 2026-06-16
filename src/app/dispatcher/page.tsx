"use client";

import { AppShell } from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { updateIncidentStatus } from "@/lib/api-client";
import { clearSession, loadSession, requireRole } from "@/lib/auth";
import { CATEGORY_META } from "@/lib/constants";
import {
  countActiveIncidents,
  countCriticalIncidents,
} from "@/lib/incident-service";
import { pickUnitForCategory, estimateEtaMinutes } from "@/lib/units";
import { severityAccent, statusAccent } from "@/lib/triage";
import { useIncidents } from "@/hooks/useIncidents";
import type { IncidentReport, IncidentStatus } from "@/lib/types";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  Radio,
  AlertOctagon,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MapPin,
  Check,
  Send,
  LogOut,
  Loader2,
  Navigation,
  Flame,
  X,
  ShieldAlert,
  Activity,
  Briefcase,
} from "lucide-react";

function playEmergencyChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Sound generation: dual frequency alarm sweep
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.setValueAtTime(1200, ctx.currentTime);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 1.2);
    osc2.stop(ctx.currentTime + 1.2);
  } catch (e) {
    console.error("Audio Context error:", e);
  }
}

const Map = dynamic(
  () => import("@/components/EmergencyMap").then((m) => m.EmergencyMap),
  { ssr: false, loading: () => (
    <div className="h-full min-h-[280px] animate-pulse rounded-2xl border border-white/5 bg-[#0d1423]" />
  )},
);

export default function DispatcherPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const { incidents, loading, online, refresh } = useIncidents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());
  const [toast, setToast] = useState<{ id: string; msg: string } | null>(null);

  // Request notifications permission when authed
  useEffect(() => {
    if (authed && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [authed]);

  // Track incidents and detect new pending ones
  useEffect(() => {
    if (loading) return;
    if (!incidents.length) {
      seenIds.current.clear();
      return;
    }

    // First load: populate seenIds so we don't alert old incidents
    if (seenIds.current.size === 0) {
      incidents.forEach((i) => seenIds.current.add(i.id));
      return;
    }

    // Find new pending incidents
    let hasNewPending = false;
    let newIncident: IncidentReport | null = null;

    for (const i of incidents) {
      if (!seenIds.current.has(i.id)) {
        seenIds.current.add(i.id);
        if (i.status === "pending") {
          hasNewPending = true;
          newIncident = i;
        }
      }
    }

    if (hasNewPending && newIncident) {
      playEmergencyChime();
      const msg = `New ${newIncident!.category.toUpperCase()} emergency report received from ${newIncident!.reporterName}!`;
      setToast({ id: newIncident!.id, msg });

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("🚨 Emergency Report!", {
            body: msg,
            tag: newIncident!.id,
          });
        } catch (err) {
          console.error("Failed to show desktop notification:", err);
        }
      }
    }
  }, [incidents, loading]);

  useEffect(() => {
    const session = loadSession();
    if (!requireRole(session, "dispatcher")) {
      router.replace("/login/staff?role=dispatcher");
    } else {
      setAuthed(true);
      setLoadingSession(false);
    }
  }, [router]);

  const selected =
    incidents.find((i) => i.id === selectedId) ?? incidents[0] ?? null;

  useEffect(() => {
    if (incidents.length && !selectedId) {
      setSelectedId(incidents[0].id);
    }
  }, [incidents, selectedId]);

  async function patchStatus(
    incident: IncidentReport,
    status: IncidentStatus,
    assign = false,
  ) {
    setBusy(true);
    try {
      const unit = assign ? pickUnitForCategory(incident.category) : null;
      await updateIncidentStatus(incident.id, status, assign && unit ? {
        assignedUnit: unit.name,
        etaMinutes: estimateEtaMinutes(unit.distanceKm),
      } : undefined);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (loadingSession || !authed) {
    return (
      <AppShell role="Command">
        <div className="flex h-64 items-center justify-center text-slate-400 font-heading">
          <Loader2 className="animate-spin text-blue-500 mr-2" size={18} />
          <span>Verifying credentials and authorizing access…</span>
        </div>
      </AppShell>
    );
  }

  const active = countActiveIncidents(incidents);
  const critical = countCriticalIncidents(incidents);

  return (
    <AppShell role="Dispatcher" online={online}>
      {toast ? (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-950/80 px-4 py-3 text-white shadow-lg shadow-red-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <ShieldAlert size={16} className="animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide">{toast.msg}</p>
              <button 
                type="button" 
                onClick={() => {
                  setSelectedId(toast.id);
                  setToast(null);
                }}
                className="text-xs text-red-400 hover:text-red-300 underline font-bold mt-0.5 cursor-pointer"
              >
                Inspect Incident Telemetry
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white hover:bg-white/5 rounded-lg p-1.5 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading tracking-tight">MDRRMO Command Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">Tactical real-time emergency dispatcher console</p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearSession();
            router.replace("/login/staff?role=dispatcher");
          }}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-red-400 transition duration-200 cursor-pointer"
        >
          <LogOut size={12} />
          <span>Exit Console</span>
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Active Operations", value: active, color: "text-red-400" },
          { label: "Critical Priority", value: critical, color: "text-orange-400" },
          { label: "Total Logged Today", value: incidents.length, color: "text-blue-400" },
          {
            label: "Average Dispatch ETA",
            value: selected?.etaMinutes ? `${selected.etaMinutes}m` : "—",
            color: "text-emerald-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/5 bg-[#0d1423]/50 px-4 py-3.5 shadow-md"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold tracking-tight font-heading mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-white/5 bg-[#0d1423] p-3 shadow-xl overflow-hidden">
            <Map
              incidents={incidents.filter((i) => i.status !== "resolved")}
              selectedId={selectedId}
              onSelect={setSelectedId}
              height="300px"
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 font-heading">
              Incident Response Queue
            </h2>
            {loading && !incidents.length ? (
              <p className="text-slate-500 text-xs font-medium">Synchronizing reports feed…</p>
            ) : null}
            {!loading && !incidents.length ? (
              <div className="rounded-2xl border border-dashed border-white/5 p-12 text-center bg-[#0d1423]/30">
                <p className="text-sm font-medium text-slate-500">
                  No active incident signals detected. Citizen logs will appear here instantly.
                </p>
              </div>
            ) : null}
            <div className="space-y-2.5">
              {incidents.map((incident) => (
                <button
                  key={incident.id}
                  type="button"
                  onClick={() => setSelectedId(incident.id)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 cursor-pointer ${
                    selected?.id === incident.id
                      ? "border-red-500/40 bg-red-950/10 shadow-lg"
                      : "border-white/5 bg-[#0d1423] hover:border-white/10 hover:bg-[#111a2e]/60"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-900 border border-white/5 px-2 py-0.5 rounded-md">{incident.id}</span>
                    <span className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold uppercase bg-[#070a13] text-slate-300 border border-white/5">
                      <CategoryIcon category={incident.category} size={12} />
                      <span>{incident.category}</span>
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${severityAccent(incident.severity)}`}
                    >
                      {incident.severity}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusAccent(incident.status)}`}
                    >
                      {incident.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-200 leading-snug">{incident.description}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <User size={12} className="text-slate-600" />
                    <span>{incident.reporterName}</span>
                    <span className="text-slate-800">·</span>
                    <MapPin size={12} className="text-slate-600" />
                    <span className="truncate max-w-[200px]">{incident.landmark || "GPS Telemetry"}</span>
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selected ? (
          <aside className="rounded-3xl border border-white/5 bg-[#0d1423] p-6 shadow-2xl lg:sticky lg:top-24 lg:self-start space-y-5">
            <div>
              <p className="font-mono text-xs font-bold text-red-400 bg-red-950/20 border border-red-500/10 px-2.5 py-1 rounded-md inline-block">{selected.id}</p>
              <h2 className="mt-3 text-xl font-bold capitalize text-white font-heading tracking-tight flex items-center gap-2">
                <CategoryIcon category={selected.category} size={20} />
                <span>{selected.category} Incident</span>
              </h2>
            </div>

            {selected.photoDataUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/5 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.photoDataUrl}
                  alt="Evidence Logs"
                  className="w-full object-cover max-h-48"
                />
              </div>
            ) : null}

            <div className="border-t border-b border-white/5 py-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold uppercase tracking-wider">Reporter Name</span>
                <span className="text-white font-bold flex items-center gap-1">
                  <User size={12} className="text-slate-400" />
                  {selected.reporterName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold uppercase tracking-wider">Contact Phone</span>
                <span className="text-white font-bold flex items-center gap-1">
                  <Phone size={12} className="text-slate-400" />
                  {selected.reporterPhone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold uppercase tracking-wider">GPS Marker</span>
                <span className="font-mono text-slate-300 font-medium flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              {selected.status === "pending" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => patchStatus(selected, "validated")}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-amber-950/20 hover:shadow-lg transition duration-200 cursor-pointer disabled:opacity-50"
                >
                  Validate Incident Signal
                </button>
              ) : null}
              {selected.status === "validated" || selected.status === "pending" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => patchStatus(selected, "dispatched", true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-red-950/20 hover:shadow-lg transition duration-200 cursor-pointer disabled:opacity-50"
                >
                  Dispatch Field Unit
                </button>
              ) : null}
              {selected.status === "dispatched" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => patchStatus(selected, "on_scene")}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-950/20 hover:shadow-lg transition duration-200 cursor-pointer disabled:opacity-50"
                >
                  Mark Team On Scene
                </button>
              ) : null}
              {selected.status !== "resolved" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => patchStatus(selected, "resolved")}
                  className="w-full py-3 rounded-xl border border-white/10 bg-[#070a13] hover:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition duration-200 cursor-pointer disabled:opacity-50"
                >
                  Close & Resolve Case
                </button>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </AppShell>
  );
}
