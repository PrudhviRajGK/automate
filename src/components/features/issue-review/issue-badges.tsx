import { cn } from "#/utils/utils";
import type { IssueDecision, IssueSeverity } from "./demo-issues";
import { ISSUE_REVIEW_COPY, SEVERITY_LABEL } from "./issue-review-copy";

const BADGE_BASE =
  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4";

const SEVERITY_CLASS: Record<IssueSeverity, string> = {
  critical: "bg-[rgba(248,113,113,0.16)] text-[#fca5a5]",
  high: "bg-[rgba(251,146,60,0.16)] text-[#fdba74]",
  medium: "bg-[rgba(250,204,21,0.14)] text-[#fde047]",
  low: "bg-[rgba(125,211,252,0.14)] text-[#7dd3fc]",
};

const DECISION_CLASS: Record<IssueDecision, string> = {
  pending: "bg-[rgba(255,255,255,0.06)] text-[var(--oh-muted)]",
  approved: "bg-[rgba(74,222,128,0.16)] text-[#86efac]",
  rejected: "bg-[rgba(248,113,113,0.16)] text-[#fca5a5]",
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: IssueSeverity;
  className?: string;
}) {
  return (
    <span className={cn(BADGE_BASE, SEVERITY_CLASS[severity], className)}>
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

export function DecisionBadge({
  decision,
  className,
}: {
  decision: IssueDecision;
  className?: string;
}) {
  return (
    <span className={cn(BADGE_BASE, DECISION_CLASS[decision], className)}>
      {ISSUE_REVIEW_COPY.decision[decision]}
    </span>
  );
}
