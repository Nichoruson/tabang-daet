import { describe, expect, it } from "vitest";
import {
  buildNewIncident,
  countActiveIncidents,
  transitionIncident,
} from "./incident-service";
import type { CreateIncidentInput } from "./types";

const baseInput: CreateIncidentInput = {
  category: "medical",
  reporterId: "c-1",
  reporterName: "Juan",
  reporterPhone: "+639171234567",
  description: "Cardiac arrest reported near market",
  landmark: "Daet market",
  latitude: 14.1122,
  longitude: 122.9556,
  photoDataUrl: "data:image/png;base64,abc",
};

describe("incident-service", () => {
  it("creates incident with inferred critical severity", () => {
    const incident = buildNewIncident(baseInput);
    expect(incident.severity).toBe("critical");
    expect(incident.status).toBe("pending");
    expect(incident.timeline).toHaveLength(1);
  });

  it("transitions to dispatched with unit and eta", () => {
    const incident = buildNewIncident(baseInput);
    const dispatched = transitionIncident(incident, "dispatched");
    expect(dispatched.status).toBe("dispatched");
    expect(dispatched.assignedUnit).toBeTruthy();
    expect(dispatched.etaMinutes).toBeGreaterThan(0);
    expect(dispatched.timeline.length).toBeGreaterThan(1);
  });

  it("counts active incidents", () => {
    const a = buildNewIncident(baseInput);
    const b = transitionIncident(a, "resolved");
    expect(countActiveIncidents([a])).toBe(1);
    expect(countActiveIncidents([b])).toBe(0);
  });
});
