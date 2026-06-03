import type { EmergencyCategory, Severity } from "./types";

export function inferSeverity(
  category: EmergencyCategory,
  description: string,
): Severity {
  const text = description.toLowerCase();

  if (
    category === "medical" &&
    /cardiac|unconscious|not breathing|stroke|severe bleeding/.test(text)
  ) {
    return "critical";
  }

  if (category === "fire" && /trapped|spread|explosion|multiple/.test(text)) {
    return "critical";
  }

  if (category === "police" && /armed|shooting|hostage/.test(text)) {
    return "critical";
  }

  if (category === "accident" && /major|fatal|overturned/.test(text)) {
    return "high";
  }

  if (category === "fire" || category === "medical") {
    return "high";
  }

  if (category === "police") {
    return "high";
  }

  return "moderate";
}

export function severityAccent(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-red-600/20 text-red-200 border-red-500/40";
    case "high":
      return "bg-orange-600/20 text-orange-200 border-orange-500/40";
    case "moderate":
      return "bg-amber-600/20 text-amber-200 border-amber-500/40";
    default:
      return "bg-slate-600/20 text-slate-200 border-slate-500/40";
  }
}

export function statusAccent(status: string): string {
  switch (status) {
    case "pending":
      return "bg-amber-500/20 text-amber-100";
    case "validated":
      return "bg-yellow-500/20 text-yellow-100";
    case "dispatched":
      return "bg-blue-500/20 text-blue-100";
    case "on_scene":
      return "bg-emerald-500/20 text-emerald-100";
    case "resolved":
      return "bg-slate-500/20 text-slate-200";
    default:
      return "bg-slate-500/20 text-slate-200";
  }
}
