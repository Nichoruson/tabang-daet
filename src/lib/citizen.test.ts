import { describe, expect, it } from "vitest";
import {
  buildReportSubmissionMessage,
  getCitizenDemoStateLabel,
  isStatusTimelineStepHighlighted,
} from "./citizen";

describe("citizen", () => {
  it("builds submission message with reporter name and auth method", () => {
    const message = buildReportSubmissionMessage({
      reporterName: "Juan Dela Cruz",
      selectedCategory: "Medical",
      authMethod: "phone",
    });

    expect(message).toBe(
      "Juan Dela Cruz submitted a medical report through phone verification.",
    );
  });

  it("uses fallback reporter label when name is empty", () => {
    const message = buildReportSubmissionMessage({
      reporterName: "   ",
      selectedCategory: "Fire",
      authMethod: "google",
    });

    expect(message).toBe(
      "Verified user submitted a fire report through Google sign-in.",
    );
  });

  it("highlights timeline steps after submission", () => {
    expect(isStatusTimelineStepHighlighted(0, false)).toBe(true);
    expect(isStatusTimelineStepHighlighted(1, false)).toBe(false);
    expect(isStatusTimelineStepHighlighted(2, true)).toBe(true);
  });

  it("returns demo state label for submission status", () => {
    expect(getCitizenDemoStateLabel(false)).toBe(
      "Waiting for report submission",
    );
    expect(getCitizenDemoStateLabel(true)).toBe(
      "Report submitted to dispatcher queue",
    );
  });
});
