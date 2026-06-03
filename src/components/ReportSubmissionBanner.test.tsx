import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReportSubmissionBanner } from "./ReportSubmissionBanner";

describe("ReportSubmissionBanner", () => {
  it("renders the formatted submission message", () => {
    render(
      <ReportSubmissionBanner
        reporterName="Maria A."
        selectedCategory="Medical"
        authMethod="phone"
      />,
    );

    expect(
      screen.getByText(
        "Maria A. submitted a medical report through phone verification.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Mock Submission Complete")).toBeInTheDocument();
  });
});
