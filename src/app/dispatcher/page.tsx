"use client";

import { AppShell } from "@/components/AppShell";
import { StaffLogin } from "@/components/StaffLogin";
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
import { useEffect, useState } from "react";

const Map = dynamic(
  () => import("@/components/EmergencyMap").then((m) => m.EmergencyMap),
  { ssr: false, loading: () => (
    <div className="h-full min-h-[280px] animate-pulse rounded-xl bg-[#111827]" />
  )},
);

export default function DispatcherPage() {
  const [authed, setAuthed] = useState(false);
  const { incidents, loading, online, refresh } = useIncidents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const session = loadSession();
    setAuthed(requireRole(session, "dispatcher"));
  }, []);

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

  if (!authed) {
    return (
      <AppShell role="Command">
        <StaffLogin role="dispatcher" onSuccess={() => setAuthed(true)} />
      </AppShell>
    );
  }

  const active = countActiveIncidents(incidents);
  const critical = countCriticalIncidents(incidents);

  return (
    <AppShell role="Dispatcher" online={online}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Command dashboard</h1>
          <p className="text-sm text-slate-400">Live incident map & triage queue</p>
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
