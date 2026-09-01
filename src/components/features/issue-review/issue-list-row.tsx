import { cn } from "#/utils/utils";
import type { DemoIssue, IssueDecision } from "./demo-issues";
import { DecisionBadge, SeverityBadge } from "./issue-badges";

interface IssueListRowProps {
  issue: DemoIssue;
  decision: IssueDecision;
  isSelected: boolean;
  onSelect: (issueId: string) => void;
}

export function IssueListRow({
  issue,
  decision,
  isSelected,
  onSelect,
}: IssueListRowProps) {
  return (
    <button
      type="button"
      data-testid={`issue-row-${issue.id}`}
      aria-current={isSelected}
      onClick={() => onSelect(issue.id)}
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
        isSelected
          ? "border-white/30 bg-[var(--oh-surface-raised)]"
          : "border-transparent bg-base-secondary hover:bg-[var(--oh-interactive-hover)]",
        decision !== "pending" && !isSelected && "opacity-70",
      )}
    >
      <div className="flex items-center gap-2">
        <SeverityBadge severity={issue.severity} />
        <span className="truncate font-mono text-[11px] text-muted">
          {issue.id}
        </span>
        <DecisionBadge decision={decision} className="ml-auto" />
      </div>
      <span className="line-clamp-2 text-sm leading-5 text-content">
        {issue.title}
      </span>
      <span className="truncate text-xs text-muted">
        {issue.repository} · {issue.filePath}
      </span>
    </button>
  );
}
