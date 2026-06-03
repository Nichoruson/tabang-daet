import type { EmergencyCategory, FieldUnit } from "./types";

export const FIELD_UNITS: FieldUnit[] = [
  {
    id: "amb-03",
    name: "Ambulance Unit 03",
    crew: "C-HEMS Team",
    category: "medical",
    status: "available",
    distanceKm: 2.1,
  },
  {
    id: "fire-01",
    name: "Fire Truck 01",
    crew: "MDRRMO Fire Support",
    category: "fire",
    status: "standby",
    distanceKm: 3.8,
  },
  {
    id: "pol-12",
    name: "Police Mobile 12",
    crew: "Daet Police Patrol",
    category: "police",
    status: "available",
    distanceKm: 1.5,
  },
  {
    id: "rescue-02",
    name: "Rescue Van 02",
    crew: "MDRRMO Rescue",
    category: "general",
    status: "available",
    distanceKm: 4.2,
  },
];

export function pickUnitForCategory(category: EmergencyCategory): FieldUnit {
  const match = FIELD_UNITS.find(
    (u) => u.category === category && u.status !== "deployed",
  );
  if (match) {
    return match;
  }

  return FIELD_UNITS.find((u) => u.status === "available") ?? FIELD_UNITS[0];
}

export function estimateEtaMinutes(distanceKm: number): number {
  return Math.max(4, Math.round(distanceKm * 2.5));
}
