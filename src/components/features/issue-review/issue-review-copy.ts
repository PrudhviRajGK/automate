/**
 * Copy for the Issue Review demo page.
 *
 * Kept as constants rather than i18n keys: the page is a demo surface whose
 * content (the findings themselves) is English-only seeded data, so adding
 * ~40 keys across every shipped locale would be noise in the catalogue.
 * Promoting these to `I18nKey` later is mechanical — every string is already
 * referenced through this one object.
 */
export const ISSUE_REVIEW_COPY = {
  pageTitle: "Issue Review",
  pageSubtitle:
    "Findings the agent raised across your repositories. Read one, then approve the fix or send it back.",
  resetButton: "Reset demo",
  resetToast: "Review queue reset — every finding is pending again.",

  overviewLabel: "Review overview",
  tiles: {
    issues: "Issues",
    issuesDetail: (pending: number) => `${String(pending)} awaiting review`,
    issuesDetailClear: "Queue clear",
    needsAttention: "Needs attention",
    needsAttentionDetail: "Critical or high severity",
    needsAttentionZeroDetail: "No unreviewed high-severity findings",
    totalScans: "Total scans",
    totalScansDetail: (repositories: number) =>
      `Across ${String(repositories)} repositories`,
    averageDuration: "Average duration",
    averageDurationDetail: "Recent completed runs",
  },

  searchPlaceholder: "Search findings, repositories, or files",
  severityFilterLabel: "Filter by severity",
  allSeverities: "All severities",

  filters: {
    all: "All",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  },

  listLabel: "Findings",
  emptyFiltered: "No findings match this filter.",
  clearFilters: "Clear filters",

  decision: {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  },

  detail: {
    selectPrompt: "Select a finding to read it.",
    metaSeverity: "Severity",
    metaCategory: "Category",
    metaConfidence: "Confidence",
    metaDetected: "Detected",
    metaSource: "Found by",
    impactLabel: "Why it matters",
    evidenceLabel: "Evidence",
    fixLabel: "Proposed fix",
    verificationLabel: "Verification",
    approve: "Approve fix",
    reject: "Reject",
    undo: "Undo decision",
    approvedBanner:
      "You approved this fix. The agent will open a pull request.",
    rejectedBanner:
      "You rejected this finding. It stays on the record as won't-fix.",
  },

  approveToast: (id: string) => `${id} approved — queued for a pull request.`,
  rejectToast: (id: string) => `${id} rejected — marked won't-fix.`,
  undoToast: (id: string) => `${id} moved back to pending.`,
} as const;

export const SEVERITY_LABEL: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};
