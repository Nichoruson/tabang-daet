/** Legacy dispatcher mock data and helpers — used by unit tests. */
import type { Incident, IncidentStatusLegacy } from "./types";

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "INC-001",
    category: "Medical",
    severity: "Critical",
    location: "Bagasbas Road, Daet",
    caller: "Maria A.",
    detail: "Unconscious patient with possible cardiac arrest.",
    status: "Pending",
    badge: "border-red-500/30 bg-red-500/10 text-red-100",
  },
  {
    id: "INC-002",
    category: "Fire",
    severity: "High",
    location: "Barangay Alawihao",
    caller: "Joel T.",
    detail: "Residential kitchen fire with smoke spreading.",
    status: "Dispatched",
    badge: "border-orange-500/30 bg-orange-500/10 text-orange-100",
  },
];

export function countActiveIncidents(incidents: Incident[]): number {
  return incidents.filter((i) => i.status !== "Resolved").length;
}

export function countCriticalIncidents(incidents: Incident[]): number {
  return incidents.filter((i) => i.severity === "Critical").length;
}

export function buildIncidentSummary(incidents: Incident[]) {
  return [
    {
      label: "Active Incidents",
      value: String(countActiveIncidents(incidents)),
      accent: "text-rose-300",
    },
    {
      label: "Critical Alerts",
      value: String(countCriticalIncidents(incidents)),
      accent: "text-red-300",
    },
    { label: "Units Available", value: "7", accent: "text-emerald-300" },
    { label: "Avg. ETA", value: "8 mins", accent: "text-cyan-300" },
  ];
}

export function buildActivityFeed(selected: Incident): string[] {
  return [
    `${selected.id} is selected in the dispatcher console.`,
    `${selected.category} at ${selected.location} is ${selected.status}.`,
  ];
}

export function updateIncidentInList(
  incidents: Incident[],
  incidentId: string,
  nextStatus: IncidentStatusLegacy,
): Incident[] {
  return incidents.map((i) =>
    i.id === incidentId ? { ...i, status: nextStatus } : i,
  );
}

export function cycleIncidentStatus(status: IncidentStatusLegacy): IncidentStatusLegacy {
  if (status === "Pending") return "Dispatched";
  if (status === "Dispatched") return "Resolved";
  return "Pending";
}

export function findIncidentById(incidents: Incident[], id: string) {
  return incidents.find((i) => i.id === id);
}

export function resolveSelectedIncident(incidents: Incident[], selectedId: string) {
  return findIncidentById(incidents, selectedId) ?? incidents[0];
}
