import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Bot, CircleAlert, RotateCcw, Timer } from "lucide-react";
import { BrandButton } from "#/components/features/settings/brand-button";
import { ManifestOverviewTiles } from "#/components/features/manifest/manifest-overview-tiles";
import { displaySuccessToast } from "#/utils/custom-toast-handlers";
import { extensionModuleEmptyStateClassName } from "#/utils/extension-module-card-classes";
import { cn } from "#/utils/utils";
import {
  DEMO_ISSUES,
  DEMO_REPOSITORY_COUNT,
  DEMO_SCAN_TOTAL,
  type IssueDecision,
  type IssueSeverity,
} from "#/components/features/issue-review/demo-issues";
import {
  ISSUE_REVIEW_COPY,
  SEVERITY_LABEL,
} from "#/components/features/issue-review/issue-review-copy";
import { IssueDetailPanel } from "#/components/features/issue-review/issue-detail-panel";
import { IssueListRow } from "#/components/features/issue-review/issue-list-row";
import {
  type DecisionMap,
  clearStoredDecisions,
  computeStats,
  decisionOf,
  matchesQuery,
  readStoredDecisions,
  writeStoredDecisions,
} from "#/components/features/issue-review/issue-review-state";

const COPY = ISSUE_REVIEW_COPY;

type StatusFilter = "all" | IssueDecision;

const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "pending",
  "approved",
  "rejected",
];

const SEVERITY_FILTERS: (IssueSeverity | "all")[] = [
  "all",
  "critical",
  "high",
  "medium",
  "low",
];

/**
 * Demo review queue: a seeded list of agent findings with a reader pane and an
 * approve/reject decision per finding. Deliberately backend-free — see
 * `demo-issues.ts` — so it renders identically on any machine.
 */
export default function IssuesReview() {
  const [decisions, setDecisions] = useState<DecisionMap>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | "all">(
    "all",
  );
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(
    DEMO_ISSUES[0]?.id ?? "",
  );

  // Read after mount: this route server-renders, and localStorage only exists
  // in the browser.
  useEffect(() => {
    setDecisions(readStoredDecisions());
  }, []);

  const stats = useMemo(() => computeStats(decisions), [decisions]);

  const visibleIssues = useMemo(
    () =>
      DEMO_ISSUES.filter((issue) => {
        const decision = decisionOf(decisions, issue.id);
        if (statusFilter !== "all" && decision !== statusFilter) return false;
        if (severityFilter !== "all" && issue.severity !== severityFilter) {
          return false;
        }
        return matchesQuery(issue, query);
      }),
    [decisions, statusFilter, severityFilter, query],
  );

  const selectedIssue =
    visibleIssues.find((issue) => issue.id === selectedId) ??
    visibleIssues[0] ??
    null;

  const commit = useCallback((issueId: string, decision: IssueDecision) => {
    setDecisions((previous) => {
      const next: DecisionMap = { ...previous, [issueId]: decision };
      writeStoredDecisions(next);
      return next;
    });
  }, []);

  /** After a decision, land on the next still-pending finding. */
  const advance = useCallback(
    (issueId: string) => {
      const index = DEMO_ISSUES.findIndex((issue) => issue.id === issueId);
      const nextPending = DEMO_ISSUES.slice(index + 1).find(
        (issue) => decisionOf(decisions, issue.id) === "pending",
      );
      if (nextPending) setSelectedId(nextPending.id);
    },
    [decisions],
  );

  const handleApprove = useCallback(
    (issueId: string) => {
      commit(issueId, "approved");
      displaySuccessToast(COPY.approveToast(issueId));
      advance(issueId);
    },
    [advance, commit],
  );

  const handleReject = useCallback(
    (issueId: string) => {
      commit(issueId, "rejected");
      displaySuccessToast(COPY.rejectToast(issueId));
      advance(issueId);
    },
    [advance, commit],
  );

  const handleUndo = useCallback(
    (issueId: string) => {
      commit(issueId, "pending");
      displaySuccessToast(COPY.undoToast(issueId));
    },
    [commit],
  );

  const handleReset = useCallback(() => {
    clearStoredDecisions();
    setDecisions({});
    setStatusFilter("all");
    setSeverityFilter("all");
    setQuery("");
    setSelectedId(DEMO_ISSUES[0]?.id ?? "");
    displaySuccessToast(COPY.resetToast);
  }, []);

  const tiles = useMemo(
    () => [
      {
        key: "issues",
        label: COPY.tiles.issues,
        value: String(stats.total),
        detail: stats.pending
          ? COPY.tiles.issuesDetail(stats.pending)
          : COPY.tiles.issuesDetailClear,
        Icon: Bot,
      },
      {
        key: "needs-attention",
        label: COPY.tiles.needsAttention,
        value: String(stats.needsAttention),
        detail: stats.needsAttention
          ? COPY.tiles.needsAttentionDetail
          : COPY.tiles.needsAttentionZeroDetail,
        Icon: CircleAlert,
      },
      {
        key: "total-scans",
        label: COPY.tiles.totalScans,
        value: String(DEMO_SCAN_TOTAL),
        detail: COPY.tiles.totalScansDetail(DEMO_REPOSITORY_COUNT),
        Icon: Activity,
      },
      {
        key: "average-duration",
        label: COPY.tiles.averageDuration,
        value: stats.averageDurationLabel,
        detail: COPY.tiles.averageDurationDetail,
        Icon: Timer,
      },
    ],
    [stats],
  );

  const countFor = (filter: StatusFilter) => {
    if (filter === "all") return stats.total;
    if (filter === "pending") return stats.pending;
    if (filter === "approved") return stats.approved;
    return stats.rejected;
  };

  return (
    <div className="min-h-full">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-content">
              {COPY.pageTitle}
            </h1>
            <p className="mt-1 text-sm text-muted">{COPY.pageSubtitle}</p>
          </div>
          <BrandButton
            type="button"
            variant="secondary"
            testId="issue-review-reset"
            className="whitespace-nowrap"
            onClick={handleReset}
            startContent={<RotateCcw className="size-4" aria-hidden />}
          >
            {COPY.resetButton}
          </BrandButton>
        </div>

        <ManifestOverviewTiles label={COPY.overviewLabel} tiles={tiles} />

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-base-secondary p-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                data-testid={`issue-filter-${filter}`}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  statusFilter === filter
                    ? "bg-[var(--oh-surface-raised)] text-content"
                    : "text-muted hover:text-content",
                )}
              >
                {COPY.filters[filter]}
                <span className="ml-1.5 text-xs text-muted">
                  {countFor(filter)}
                </span>
              </button>
            ))}
          </div>

          <select
            value={severityFilter}
            aria-label={COPY.severityFilterLabel}
            data-testid="issue-severity-filter"
            onChange={(event) =>
              setSeverityFilter(event.target.value as IssueSeverity | "all")
            }
            className="h-9 rounded-lg border border-[var(--oh-border)] bg-base-secondary px-3 text-sm text-content outline-none"
          >
            {SEVERITY_FILTERS.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? COPY.allSeverities : SEVERITY_LABEL[value]}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={COPY.searchPlaceholder}
            aria-label={COPY.searchPlaceholder}
            data-testid="issue-search"
            className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--oh-border)] bg-base-secondary px-3 text-sm text-content outline-none placeholder:text-tertiary-alt focus:border-white/40"
          />
        </div>

        {visibleIssues.length === 0 ? (
          <div className={extensionModuleEmptyStateClassName}>
            <p className="text-sm text-muted">{COPY.emptyFiltered}</p>
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
            <section
              aria-label={COPY.listLabel}
              className="flex max-h-[70vh] min-w-0 flex-col gap-2 overflow-y-auto pr-1"
            >
              {visibleIssues.map((issue) => (
                <IssueListRow
                  key={issue.id}
                  issue={issue}
                  decision={decisionOf(decisions, issue.id)}
                  isSelected={selectedIssue?.id === issue.id}
                  onSelect={setSelectedId}
                />
              ))}
            </section>

            {selectedIssue ? (
              <IssueDetailPanel
                issue={selectedIssue}
                decision={decisionOf(decisions, selectedIssue.id)}
                onApprove={handleApprove}
                onReject={handleReject}
                onUndo={handleUndo}
              />
            ) : (
              <div className={extensionModuleEmptyStateClassName}>
                <p className="text-sm text-muted">{COPY.detail.selectPrompt}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
