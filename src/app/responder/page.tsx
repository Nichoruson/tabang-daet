"use client";

import { AppShell } from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { updateIncidentStatus } from "@/lib/api-client";
import { clearSession, loadSession, requireRole } from "@/lib/auth";
import { CATEGORY_META } from "@/lib/constants";
import {
  getMilestoneDisplayStatus,
  getStageForFieldAction,
  getVisibleNotificationCount,
} from "@/lib/responder";
import { useIncidents } from "@/hooks/useIncidents";
import type { IncidentReport, IncidentStatus } from "@/lib/types";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
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
  CheckCircle,
  ShieldCheck,
  Power,
} from "lucide-react";

function playResponderChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Sound generation: alarm siren sound (two oscillating sweeps)
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.6);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.9);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch (e) {
    console.error("Audio Context error:", e);
  }
}

const Map = dynamic(
  () => import("@/components/EmergencyMap").then((m) => m.EmergencyMap),
  { ssr: false },
);

const FIELD_ACTIONS = [
  "Accept Assignment",
  "Start Navigation",
  "Mark On Scene",
  "Patient Secured",
  "Close Incident",
] as const;

const STAGE_STATUS: Record<number, IncidentStatus> = {
  0: "dispatched",
  1: "dispatched",
  2: "on_scene",
  3: "resolved",
};

function getActionIcon(action: string) {
  switch (action) {
    case "Accept Assignment":
      return <CheckCircle size={14} className="text-emerald-400" />;
    case "Start Navigation":
      return <Navigation size={14} className="text-blue-400 fill-blue-400/10" />;
    case "Mark On Scene":
      return <MapPin size={14} className="text-amber-400" />;
    case "Patient Secured":
      return <ShieldCheck size={14} className="text-purple-400" />;
    case "Close Incident":
      return <Power size={14} className="text-red-400" />;
    default:
      return <Activity size={14} />;
  }
}

export default function ResponderPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const { incidents, online, refresh } = useIncidents();
  const [currentStage, setCurrentStage] = useState(1);
  const [busy, setBusy] = useState(false);
  const lastAssignmentId = useRef<string | null>(null);
  const [toast, setToast] = useState<{ id: string; msg: string } | null>(null);

  // Request notifications permission when authed
  useEffect(() => {
    if (authed && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [authed]);

  useEffect(() => {
    const session = loadSession();
    if (!requireRole(session, "responder")) {
      router.replace("/login/staff?role=responder");
    } else {
      setAuthed(true);
      setLoadingSession(false);
    }
  }, [router]);

  const assignment = useMemo(
    () =>
      incidents.find(
        (i) => i.status === "dispatched" || i.status === "on_scene",
      ) ?? incidents.find((i) => i.status === "validated") ?? null,
    [incidents],
  );

  // Monitor assignments and trigger alerts on new ones
  useEffect(() => {
    if (!assignment) {
      lastAssignmentId.current = null;
      return;
    }

    // First load: just set the current ID so we don't alert old assignments
    if (lastAssignmentId.current === null) {
      lastAssignmentId.current = assignment.id;
      return;
    }

    // New assignment detected
    if (assignment.id !== lastAssignmentId.current) {
      lastAssignmentId.current = assignment.id;
      playResponderChime();

      const msg = `New Assignment: Dispatched to a ${assignment.category.toUpperCase()} emergency at ${assignment.landmark || "GPS location"}.`;
      setToast({ id: assignment.id, msg });

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("🚑 New Incident Assignment!", {
            body: `Description: ${assignment.description}`,
            tag: assignment.id,
          });
        } catch (err) {
          console.error("Failed to show desktop notification:", err);
        }
      }
    }
  }, [assignment]);

  const milestones = [
    "Assignment Accepted",
    "En Route",
    "On Scene",
    "Case Closed",
  ];

  async function handleFieldAction(action: string) {
    const stage = getStageForFieldAction(action);
    if (stage === null || !assignment) return;

    setCurrentStage(stage);
    const status = STAGE_STATUS[stage];
    if (!status) return;

    setBusy(true);
    try {
      await updateIncidentStatus(assignment.id, status);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const visibleTimeline = assignment?.timeline ?? [];
  const notificationCount = getVisibleNotificationCount(
    currentStage,
    visibleTimeline.length,
  );

  if (loadingSession || !authed) {
    return (
      <AppShell role="Field">
        <div className="flex h-64 items-center justify-center text-slate-400 font-heading">
          <Loader2 className="animate-spin text-amber-500 mr-2" size={18} />
          <span>Verifying credentials and authorizing access…</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="Field unit" online={online}>
      {toast ? (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-950/80 px-4 py-3 text-white shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldAlert size={16} className="animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide">{toast.msg}</p>
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

      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading tracking-tight">Tactical Field Response</h1>
          <p className="text-sm text-slate-400 mt-0.5">GPS routing & client status synchronizer</p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearSession();
            router.replace("/login/staff?role=responder");
          }}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-red-400 transition duration-200 cursor-pointer"
        >
          <LogOut size={12} />
          <span>Exit Portal</span>
        </button>
      </div>

      {!assignment ? (
        <div className="rounded-3xl border border-dashed border-white/5 p-16 text-center bg-[#0d1423]/20 shadow-md max-w-2xl mx-auto mt-8 flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-white/5 text-slate-500">
            <Radio size={24} className="animate-pulse" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-300 font-heading">No Active Assignment</p>
            <p className="mt-2 text-sm text-slate-500 leading-normal max-w-sm">
              Telemetry links are idle. Waiting for dispatcher to authorize and route an emergency signal.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-xl space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-amber-400 tracking-wider">Active Tactical Route</p>
                <p className="mt-1 font-mono text-xs text-red-300/80 bg-red-950/20 border border-red-500/10 px-2 py-0.5 rounded inline-block">{assignment.id}</p>
              </div>
              <h2 className="mt-2 text-xl font-bold text-white capitalize flex items-center gap-2 font-heading tracking-tight">
                <CategoryIcon category={assignment.category} size={20} />
                <span>{assignment.category} Incident</span>
              </h2>
              <p className="text-sm leading-relaxed text-slate-300">{assignment.description}</p>
              {assignment.etaMinutes ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <Clock size={16} />
                  <p className="text-base font-extrabold font-heading">
                    ETA: {assignment.etaMinutes} minutes
                  </p>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/5 overflow-hidden shadow-lg">
              <Map
                incidents={[assignment]}
                center={{ lat: assignment.latitude, lng: assignment.longitude }}
                zoom={16}
                height="240px"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FIELD_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={busy}
                  onClick={() => handleFieldAction(action)}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#0d1423] hover:border-amber-500/30 hover:bg-[#111a2e] px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-white transition duration-200 cursor-pointer disabled:opacity-50"
                >
                  {getActionIcon(action)}
                  <span>{action}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-white/5 bg-[#0d1423] p-6 shadow-xl">
              <h3 className="font-bold text-white font-heading tracking-tight text-sm uppercase text-slate-400">Route Milestones</h3>
              
              <div className="mt-4 relative border-l border-slate-800 ml-2.5 pl-5 space-y-4">
                {milestones.map((title, index) => {
                  const isCurrent = index === currentStage;
                  const isPast = index < currentStage;
                  return (
                    <div key={title} className="relative">
                      {/* Milestone Dot */}
                      <span className={`absolute -left-[27px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-900 border-2 ${
                        isCurrent
                          ? "border-amber-500 animate-pulse"
                          : isPast
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-slate-800"
                      }`} />
                      
                      <div
                        className={`rounded-xl border px-4 py-2.5 text-xs transition duration-200 ${
                          isCurrent
                            ? "border-amber-500/30 bg-amber-950/10 text-amber-200 shadow-md shadow-amber-950/10"
                            : isPast
                              ? "border-emerald-500/20 bg-emerald-950/5 text-emerald-300/90"
                              : "border-white/5 bg-[#070a13] text-slate-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold tracking-wide">{title}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-80 font-mono">
                            {getMilestoneDisplayStatus(index, currentStage, "Upcoming")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#0d1423] p-6 shadow-xl">
              <h3 className="font-bold text-white font-heading tracking-tight text-sm uppercase text-slate-400">Citizen Broadcast Logs</h3>
              <div className="mt-4 relative border-l border-slate-800 ml-2 pl-4 space-y-3 max-h-64 overflow-y-auto pr-1">
                {visibleTimeline.slice(0, notificationCount).map((n) => (
                  <div key={n.id} className="relative">
                    <span className="absolute -left-[23px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-slate-900 border border-red-500" />
                    <div className="rounded-xl bg-[#070a13] border border-white/5 p-3.5 hover:border-slate-800 transition duration-200">
                      <p className="text-xs font-bold text-red-300 tracking-wide">{n.title}</p>
                      <p className="mt-1 text-xs text-slate-400 leading-normal">{n.detail}</p>
                    </div>
                  </div>
                ))}
                {!visibleTimeline.length ? (
                  <p className="text-xs text-slate-500 font-medium py-4">No broadcasts triggered yet.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
