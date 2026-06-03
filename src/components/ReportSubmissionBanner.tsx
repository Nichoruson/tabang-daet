import { buildReportSubmissionMessage } from "@/lib/citizen";
import type { AuthMethod } from "@/lib/types";

type ReportSubmissionBannerProps = {
  reporterName: string;
  selectedCategory: string;
  authMethod: AuthMethod;
};

export function ReportSubmissionBanner({
  reporterName,
  selectedCategory,
  authMethod,
}: ReportSubmissionBannerProps) {
  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
        Mock Submission Complete
      </p>
      <p className="mt-2 leading-7 text-slate-200">
        {buildReportSubmissionMessage({
          reporterName,
          selectedCategory,
          authMethod,
        })}
      </p>
    </div>
  );
}
