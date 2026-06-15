"use client";

import { AppShell } from "@/components/AppShell";
import { StaffLogin } from "@/components/StaffLogin";
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

export default function ResponderPage() {
  const [authed, setAuthed] = useState(false);
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
    setAuthed(requireRole(loadSession(), "responder"));
  }, []);

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

  if (!authed) {
    return (
      <AppShell role="Field">
        <StaffLogin role="responder" onSuccess={() => setAuthed(true)} />
      </AppShell>
    );
  }

  return (
    <AppShell role="Field unit" online={online}>
      {toast ? (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-500 bg-amber-950/80 px-4 py-3 text-white animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚑</span>
            <div>
              <p className="text-sm font-bold">{toast.msg}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white text-lg font-bold ml-4"
          >
            &times;
          </button>
        </div>
      ) : null}
      <div className="mb-6 flex justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Field response</h1>
          <p className="text-sm text-slate-400">GPS routing & status sync</p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearSession();
            setAuthed(false);
          }}
          className="text-xs text-slate-500 hover:text-red-300"
        >
          Sign out
        </button>
      </div>

      {!assignment ? (
        <div className="rounded-2xl border border-dashed border-[#3d4f6f] p-12 text-center">
          <p className="text-lg text-slate-400">No active assignment</p>
          <p className="mt-2 text-sm text-slate-500">
            Waiting for dispatcher to validate and dispatch a unit.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-700/40 bg-amber-950/20 p-5">
              <p className="text-xs font-bold uppercase text-amber-400">
                Active assignment
              </p>
              <p className="mt-1 font-mono text-red-300">{assignment.id}</p>
              <h2 className="mt-2 text-xl font-bold text-white capitalize">
                {CATEGORY_META[assignment.category].icon}{" "}
                {assignment.category}
              </h2>
              <p className="mt-2 text-sm text-slate-300">{assignment.description}</p>
              {assignment.etaMinutes ? (
                <p className="mt-3 text-lg font-bold text-emerald-400">
                  ETA {assignment.etaMinutes} minutes
                </p>
              ) : null}
            </div>

            <Map
              incidents={[assignment]}
              center={{ lat: assignment.latitude, lng: assignment.longitude }}
              zoom={16}
              height="240px"
            />

            <div className="grid grid-cols-2 gap-2">
              {FIELD_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={busy}
                  onClick={() => handleFieldAction(action)}
                  className="rounded-xl border border-[#3d4f6f] bg-[#111827] px-3 py-4 text-left text-sm font-semibold text-white hover:border-amber-500/50 hover:bg-amber-950/30 disabled:opacity-50"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#3d4f6f] bg-[#111827] p-5">
              <h3 className="font-bold text-white">Route progress</h3>
              <ul className="mt-4 space-y-2">
                {milestones.map((title, index) => (
                  <li
                    key={title}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      index === currentStage
                        ? "border-amber-500/50 bg-amber-950/40 text-amber-100"
                        : index < currentStage
                          ? "border-emerald-500/30 text-emerald-200"
                          : "border-white/5 text-slate-500"
                    }`}
                  >
                    <span className="font-semibold">{title}</span>
                    <span className="ml-2 text-xs uppercase opacity-70">
                      {getMilestoneDisplayStatus(index, currentStage, "Upcoming")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#3d4f6f] bg-[#111827] p-5">
              <h3 className="font-bold text-white">Citizen notifications</h3>
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {visibleTimeline.slice(0, notificationCount).map((n) => (
                  <li
                    key={n.id}
                    className="rounded-lg bg-[#0a0f1a] p-3 text-sm"
                  >
                    <p className="font-semibold text-red-200">{n.title}</p>
                    <p className="text-slate-400">{n.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
