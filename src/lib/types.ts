export type EmergencyCategory = "fire" | "medical" | "police" | "accident";

export type IncidentStatus =
  | "pending"
  | "validated"
  | "dispatched"
  | "on_scene"
  | "resolved";

export type Severity = "critical" | "high" | "moderate" | "low";

export type UserRole = "citizen" | "dispatcher" | "responder";

export type AuthMethod = "phone" | "google";

export interface UserSession {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  authMethod: AuthMethod;
}

export interface TimelineEvent {
  id: string;
  title: string;
  detail: string;
  at: string;
}

export interface IncidentReport {
  id: string;
  category: EmergencyCategory;
  severity: Severity;
  status: IncidentStatus;
  reporterId: string;
  reporterName: string;
  reporterPhone: string;
  description: string;
  landmark: string;
  latitude: number;
  longitude: number;
  photoDataUrl: string | null;
  createdAt: string;
  updatedAt: string;
  assignedUnit: string | null;
  etaMinutes: number | null;
  timeline: TimelineEvent[];
}

export interface CreateIncidentInput {
  category: EmergencyCategory;
  reporterId: string;
  reporterName: string;
  reporterPhone: string;
  description: string;
  landmark: string;
  latitude: number;
  longitude: number;
  photoDataUrl: string | null;
}

export interface FieldUnit {
  id: string;
  name: string;
  crew: string;
  category: EmergencyCategory | "general";
  status: "available" | "standby" | "deployed";
  distanceKm: number;
}

/** @deprecated Use IncidentReport — kept for legacy tests */
export type IncidentStatusLegacy = "Pending" | "Dispatched" | "Resolved";

export type Incident = {
  id: string;
  category: string;
  severity: string;
  location: string;
  caller: string;
  detail: string;
  status: IncidentStatusLegacy;
  badge: string;
};
