export const FIELD_ACTIONS = [
  "Accept Assignment",
  "Start Navigation",
  "Mark On Scene",
  "Patient Secured",
  "Request Backup",
  "Close Incident",
] as const;

export type FieldAction = (typeof FIELD_ACTIONS)[number];

/** Maps a field action to the route milestone index (0–3). */
export function getStageForFieldAction(action: string): number | null {
  switch (action) {
    case "Accept Assignment":
      return 0;
    case "Start Navigation":
      return 1;
    case "Mark On Scene":
      return 2;
    case "Patient Secured":
    case "Close Incident":
      return 3;
    default:
      return null;
  }
}

export function getVisibleNotificationCount(
  currentStage: number,
  totalNotifications: number,
): number {
  return Math.min(currentStage + 2, totalNotifications);
}

export function getMilestoneDisplayStatus(
  milestoneIndex: number,
  currentStage: number,
  defaultStatus: string,
): "Completed" | "Active" | string {
  if (milestoneIndex < currentStage) {
    return "Completed";
  }

  if (milestoneIndex === currentStage) {
    return "Active";
  }

  return defaultStatus;
}
