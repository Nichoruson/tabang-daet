import type { CreateIncidentInput, IncidentReport, IncidentStatus } from "./types";

export async function fetchIncidents(): Promise<IncidentReport[]> {
  const response = await fetch("/api/incidents", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load incidents");
  }
  return response.json();
}

export async function fetchIncident(id: string): Promise<IncidentReport> {
  const response = await fetch(`/api/incidents/${id}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Incident not found");
  }
  return response.json();
}

export async function createIncident(
  input: CreateIncidentInput,
): Promise<IncidentReport> {
  const response = await fetch("/api/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to submit report");
  }

  return response.json();
}

export async function updateIncidentStatus(
  id: string,
  status: IncidentStatus,
  options?: { assignedUnit?: string; etaMinutes?: number },
): Promise<IncidentReport> {
  const response = await fetch(`/api/incidents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, ...options }),
  });

  if (!response.ok) {
    throw new Error("Failed to update incident");
  }

  return response.json();
}
