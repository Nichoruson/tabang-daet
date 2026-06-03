import { describe, expect, it } from "vitest";
import {
  MOCK_INCIDENTS,
  buildActivityFeed,
  buildIncidentSummary,
  countActiveIncidents,
  countCriticalIncidents,
  cycleIncidentStatus,
  resolveSelectedIncident,
  updateIncidentInList,
} from "./incidents";

describe("incidents (legacy mock)", () => {
  it("counts active incidents excluding resolved cases", () => {
    expect(countActiveIncidents(MOCK_INCIDENTS)).toBe(2);
  });

  it("counts critical severity incidents", () => {
    expect(countCriticalIncidents(MOCK_INCIDENTS)).toBe(1);
  });

  it("builds dashboard summary from incident list", () => {
    const summary = buildIncidentSummary(MOCK_INCIDENTS);
    expect(summary[0]).toMatchObject({ label: "Active Incidents", value: "2" });
    expect(summary[1]).toMatchObject({ label: "Critical Alerts", value: "1" });
  });

  it("updates status for a single incident", () => {
    const updated = updateIncidentInList(MOCK_INCIDENTS, "INC-001", "Dispatched");
    expect(updated.find((i) => i.id === "INC-001")?.status).toBe("Dispatched");
  });

  it("cycles incident status through the workflow", () => {
    expect(cycleIncidentStatus("Pending")).toBe("Dispatched");
    expect(cycleIncidentStatus("Dispatched")).toBe("Resolved");
    expect(cycleIncidentStatus("Resolved")).toBe("Pending");
  });

  it("builds activity feed for the selected incident", () => {
    const selected = resolveSelectedIncident(MOCK_INCIDENTS, "INC-002");
    const feed = buildActivityFeed(selected);
    expect(feed[0]).toContain("INC-002");
  });

  it("falls back to the first incident when selection is missing", () => {
    expect(resolveSelectedIncident(MOCK_INCIDENTS, "INC-999").id).toBe(
      MOCK_INCIDENTS[0].id,
    );
  });
});
