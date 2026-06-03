import type { AuthMethod } from "./types";

export function buildReportSubmissionMessage({
  reporterName,
  selectedCategory,
  authMethod,
}: {
  reporterName: string;
  selectedCategory: string;
  authMethod: AuthMethod;
}): string {
  const reporter = reporterName.trim() || "Verified user";
  const authLabel =
    authMethod === "phone" ? "phone verification" : "Google sign-in";

  return `${reporter} submitted a ${selectedCategory.toLowerCase()} report through ${authLabel}.`;
}

export function isStatusTimelineStepHighlighted(
  stepIndex: number,
  reportSubmitted: boolean,
): boolean {
  return reportSubmitted || stepIndex === 0;
}

export function getCitizenDemoStateLabel(reportSubmitted: boolean): string {
  return reportSubmitted
    ? "Report submitted to dispatcher queue"
    : "Waiting for report submission";
}
