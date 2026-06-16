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
    <div className="h-full min-h-[280px] animate-pulse rounded-xl bg-[#111827]" />
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
        <div className="flex h-64 items-center justify-center text-slate-400">
          Verifying credentials and authorizing access…
        </div>
      </AppShell>
    );
  }

  const active = countActiveIncidents(incidents);
  const critical = countCriticalIncidents(incidents);

  return (
    <AppShell role="Dispatcher" online={online}>
      {toast ? (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500 bg-red-950/80 px-4 py-3 text-white animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚨</span>
            <div>
              <p className="text-sm font-bold">{toast.msg}</p>
              <button 
                type="button" 
                onClick={() => {
                  setSelectedId(toast.id);
                  setToast(null);
                }}
                className="text-xs text-red-300 underline font-semibold mt-0.5"
              >
                View Incident Details
              </button>
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Command dashboard</h1>
          <p className="text-sm text-slate-400">Live incident map & triage queue</p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearSession();
            router.replace("/login/staff?role=dispatcher");
          }}
          className="text-xs text-slate-500 hover:text-red-300"
        >
          Sign out
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Active", value: active, color: "text-red-400" },
          { label: "Critical", value: critical, color: "text-orange-400" },
          { label: "Total today", value: incidents.length, color: "text-blue-300" },
          {
            label: "Avg ETA",
            value: selected?.etaMinutes ? `${selected.etaMinutes}m` : "—",
            color: "text-emerald-300",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[#3d4f6f] bg-[#111827] px-4 py-3"
          >
            <p className="text-xs uppercase text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#3d4f6f] bg-[#111827] p-3">
            <Map
              incidents={incidents.filter((i) => i.status !== "resolved")}
              selectedId={selectedId}
              onSelect={setSelectedId}
              height="300px"
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
              Incident queue
            </h2>
            {loading && !incidents.length ? (
              <p className="text-slate-500">Loading…</p>
            ) : null}
            {!loading && !incidents.length ? (
              <p className="rounded-xl border border-dashed border-[#3d4f6f] p-8 text-center text-slate-500">
                No reports yet. Citizen submissions appear here in real time.
              </p>
            ) : null}
            {incidents.map((incident) => (
              <button
                key={incident.id}
                type="button"
                onClick={() => setSelectedId(incident.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selected?.id === incident.id
                    ? "border-red-500/50 bg-red-950/30"
                    : "border-[#3d4f6f] bg-[#111827] hover:border-red-500/30"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-white">{incident.id}</span>
                  <span className="rounded px-2 py-0.5 text-xs font-bold uppercase bg-[#1a2332] text-slate-200">
                    {CATEGORY_META[incident.category].icon}{" "}
                    {incident.category}
                  </span>
                  <span
                    className={`rounded border px-2 py-0.5 text-xs ${severityAccent(incident.severity)}`}
                  >
                    {incident.severity}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${statusAccent(incident.status)}`}
                  >
                    {incident.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{incident.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {incident.reporterName} · {incident.landmark || "GPS pin only"}
                </p>
              </button>
            ))}
          </div>
        </div>

        {selected ? (
          <aside className="rounded-2xl border border-red-900/30 bg-[#111827] p-5 lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-red-300">{selected.id}</p>
            <h2 className="mt-2 text-xl font-bold capitalize text-white">
              {selected.category} emergency
            </h2>

            {selected.photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.photoDataUrl}
                alt="Evidence"
                className="mt-4 w-full rounded-lg border border-white/10 object-cover max-h-48"
              />
            ) : null}

            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Reporter</dt>
                <dd className="text-white">{selected.reporterName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-white">{selected.reporterPhone}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Coordinates</dt>
                <dd className="font-mono text-xs text-slate-300">
                  {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 grid gap-2">
              {selected.status === "pending" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => patchStatus(selected, "validated")}
                  className="rounded-lg bg-amber-700 py-2 text-sm font-bold text-white"
                >
                  Validate report
                </button>
              ) : null}
              {selected.status === "validated" || selected.status === "pending" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => patchStatus(selected, "dispatched", true)}
                  className="rounded-lg bg-red-700 py-2 text-sm font-bold text-white"
                >
                  Dispatch nearest unit
                </button>
              ) : null}
              {selected.status === "dispatched" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => patchStatus(selected, "on_scene")}
                  className="rounded-lg bg-blue-800 py-2 text-sm font-bold text-white"
                >
                  Mark on scene
                </button>
              ) : null}
              {selected.status !== "resolved" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => patchStatus(selected, "resolved")}
                  className="rounded-lg border border-[#3d4f6f] py-2 text-sm text-slate-300"
                >
                  Close incident
                </button>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </AppShell>
  );
}
