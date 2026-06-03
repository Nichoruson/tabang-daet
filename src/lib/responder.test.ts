import { describe, expect, it } from "vitest";
import {
  getMilestoneDisplayStatus,
  getStageForFieldAction,
  getVisibleNotificationCount,
} from "./responder";

describe("responder", () => {
  it("maps field actions to route stages", () => {
    expect(getStageForFieldAction("Accept Assignment")).toBe(0);
    expect(getStageForFieldAction("Start Navigation")).toBe(1);
    expect(getStageForFieldAction("Mark On Scene")).toBe(2);
    expect(getStageForFieldAction("Patient Secured")).toBe(3);
    expect(getStageForFieldAction("Close Incident")).toBe(3);
    expect(getStageForFieldAction("Request Backup")).toBeNull();
  });

  it("reveals citizen notifications as the stage advances", () => {
    expect(getVisibleNotificationCount(0, 4)).toBe(2);
    expect(getVisibleNotificationCount(1, 4)).toBe(3);
    expect(getVisibleNotificationCount(3, 4)).toBe(4);
    expect(getVisibleNotificationCount(5, 4)).toBe(4);
  });

  it("labels milestone cards based on current stage", () => {
    expect(getMilestoneDisplayStatus(0, 2, "Upcoming")).toBe("Completed");
    expect(getMilestoneDisplayStatus(2, 2, "Upcoming")).toBe("Active");
    expect(getMilestoneDisplayStatus(3, 2, "Upcoming")).toBe("Upcoming");
  });
});
