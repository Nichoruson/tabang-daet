import { describe, expect, it } from "vitest";
import { inferSeverity } from "./triage";

describe("triage", () => {
  it("flags cardiac medical reports as critical", () => {
    expect(
      inferSeverity("medical", "Possible cardiac arrest, patient unconscious"),
    ).toBe("critical");
  });

  it("defaults high for police category", () => {
    expect(inferSeverity("police", "Noise complaint")).toBe("high");
  });
});
