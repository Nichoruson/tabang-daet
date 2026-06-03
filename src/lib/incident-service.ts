import { pickUnitForCategory, estimateEtaMinutes } from "./units";
import { inferSeverity } from "./triage";
import type {
  CreateIncidentInput,
  IncidentReport,
  IncidentStatus,
  TimelineEvent,
} from "./types";

export function createIncidentId(): string {
  return `INC-${Date.now().toString(36).toUpperCase()}`;
}

export function createTimelineEvent(
  title: string,
  detail: string,
): TimelineEvent {
  return {
    id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    detail,
    at: new Date().toISOString(),
  };
}

export function buildNewIncident(input: CreateIncidentInput): IncidentReport {
  const now = new Date().toISOString();
  const severity = inferSeverity(input.category, input.description);

  return {
    id: createIncidentId(),
    category: input.category,
    severity,
    status: "pending",
    reporterId: input.reporterId,
    reporterName: input.reporterName,
    reporterPhone: input.reporterPhone,
    description: input.description,
    landmark: input.landmark,
    latitude: input.latitude,
    longitude: input.longitude,
    photoDataUrl: input.photoDataUrl,
    createdAt: now,
    updatedAt: now,
    assignedUnit: null,
    etaMinutes: null,
    timeline: [
      createTimelineEvent(
        "Report Received",
        "Your emergency report reached the MDRRMO command center.",
      ),
    ],
  };
}

export function appendTimeline(
  incident: IncidentReport,
  title: string,
  detail: string,
): IncidentReport {
  return {
    ...incident,
    updatedAt: new Date().toISOString(),
    timeline: [...incident.timeline, createTimelineEvent(title, detail)],
  };
}

export function transitionIncident(
  incident: IncidentReport,
  nextStatus: IncidentStatus,
  options?: { assignedUnit?: string; etaMinutes?: number },
): IncidentReport {
  let updated = { ...incident, status: nextStatus, updatedAt: new Date().toISOString() };

  switch (nextStatus) {
    case "validated":
      updated = appendTimeline(
        updated,
        "Report Validated",
        "Dispatcher confirmed your photo and GPS location.",
      );
      break;
    case "dispatched": {
      const unit = options?.assignedUnit ?? pickUnitForCategory(incident.category).name;
      const eta =
        options?.etaMinutes ??
        estimateEtaMinutes(pickUnitForCategory(incident.category).distanceKm);
      updated = {
        ...updated,
        assignedUnit: unit,
        etaMinutes: eta,
      };
      updated = appendTimeline(
        updated,
        "Unit Dispatched",
        `${unit} is en route. Estimated arrival: ${eta} minutes.`,
      );
      break;
    }
    case "on_scene":
      updated = appendTimeline(
        updated,
        "Responders On Scene",
        "Emergency personnel have arrived at your pinned location.",
      );
      break;
    case "resolved":
      updated = appendTimeline(
        updated,
        "Incident Resolved",
        "The case has been closed. Thank you for reporting through Tabang Daet.",
      );
      break;
    default:
      break;
  }

  return updated;
}

export function countActiveIncidents(incidents: IncidentReport[]): number {
  return incidents.filter((i) => i.status !== "resolved").length;
}

export function countCriticalIncidents(incidents: IncidentReport[]): number {
  return incidents.filter((i) => i.severity === "critical" && i.status !== "resolved")
    .length;
}

export function sortIncidentsByPriority(
  incidents: IncidentReport[],
): IncidentReport[] {
  const severityRank = { critical: 0, high: 1, moderate: 2, low: 3 };
  const statusRank = {
    pending: 0,
    validated: 1,
    dispatched: 2,
    on_scene: 3,
    resolved: 4,
  };

  return [...incidents].sort((a, b) => {
    if (statusRank[a.status] !== statusRank[b.status]) {
      return statusRank[a.status] - statusRank[b.status];
    }
    return severityRank[a.severity] - severityRank[b.severity];
  });
}
