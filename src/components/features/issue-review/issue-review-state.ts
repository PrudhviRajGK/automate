import {
  DEMO_ISSUES,
  type DemoIssue,
  type IssueDecision,
  type IssueSeverity,
} from "./demo-issues";

export type DecisionMap = Record<string, IssueDecision>;

const STORAGE_KEY = "auto-mate-issue-review-demo";

/**
 * Decisions survive a reload so a demo can be paused mid-queue. Read lazily
 * from an effect rather than during render: the app server-renders this route,
 * and a value that only exists in the browser would desync hydration.
 */
export function readStoredDecisions(): DecisionMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: DecisionMap = {};
    for (const [id, value] of Object.entries(parsed as DecisionMap)) {
      if (value === "approved" || value === "rejected" || value === "pending") {
        out[id] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function writeStoredDecisions(decisions: DecisionMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
  } catch {
    // A demo is not worth failing over a full/blocked storage quota.
  }
}

export function clearStoredDecisions(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // See above.
  }
}

export function decisionOf(
  decisions: DecisionMap,
  issueId: string,
): IssueDecision {
  return decisions[issueId] ?? "pending";
}

const SEVERITY_ORDER: Record<IssueSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** Most severe first; ties keep the seeded (newest-first) order. */
export function bySeverity(a: DemoIssue, b: DemoIssue): number {
  return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
}

export function isHighSeverity(severity: IssueSeverity): boolean {
  return severity === "critical" || severity === "high";
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  needsAttention: number;
  averageDurationLabel: string;
}

export function computeStats(decisions: DecisionMap): ReviewStats {
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  let needsAttention = 0;
  let durationTotal = 0;

  for (const issue of DEMO_ISSUES) {
    const decision = decisionOf(decisions, issue.id);
    if (decision === "approved") approved += 1;
    else if (decision === "rejected") rejected += 1;
    else {
      pending += 1;
      if (isHighSeverity(issue.severity)) needsAttention += 1;
    }
    durationTotal += issue.scanDurationSeconds;
  }

  const averageSeconds = DEMO_ISSUES.length
    ? Math.round(durationTotal / DEMO_ISSUES.length)
    : 0;

  return {
    total: DEMO_ISSUES.length,
    pending,
    approved,
    rejected,
    needsAttention,
    averageDurationLabel: formatDuration(averageSeconds),
  };
}

/** `194` → `3m 14s`; under a minute stays in seconds. */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${String(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0
    ? `${String(minutes)}m`
    : `${String(minutes)}m ${String(rest)}s`;
}

export function matchesQuery(issue: DemoIssue, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    issue.id,
    issue.title,
    issue.summary,
    issue.repository,
    issue.filePath,
    issue.category,
    issue.detectedBy,
  ].some((field) => field.toLowerCase().includes(needle));
}
