import { Check, RotateCcw, X } from "lucide-react";
import { BrandButton } from "#/components/features/settings/brand-button";
import { extensionModuleCardSurfaceClassName } from "#/utils/extension-module-card-classes";
import { cn } from "#/utils/utils";
import type { DemoIssue, IssueDecision } from "./demo-issues";
import { DecisionBadge, SeverityBadge } from "./issue-badges";
import { ISSUE_REVIEW_COPY } from "./issue-review-copy";

const COPY = ISSUE_REVIEW_COPY.detail;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
      {children}
    </h3>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm text-content">{value}</div>
    </div>
  );
}

/** Renders a unified-diff string with add/remove lines tinted. */
function DiffBlock({ patch }: { patch: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-[rgba(0,0,0,0.35)] p-3 text-xs leading-5">
      <code>
        {patch.split("\n").map((line, index) => (
          <div
            // Diff lines have no stable identity beyond their position.
            key={`${String(index)}-${line}`}
            className={cn(
              "whitespace-pre",
              line.startsWith("+") && "text-[#86efac]",
              line.startsWith("-") && "text-[#fca5a5]",
              !line.startsWith("+") &&
                !line.startsWith("-") &&
                "text-[var(--oh-muted)]",
            )}
          >
            {line === "" ? " " : line}
          </div>
        ))}
      </code>
    </pre>
  );
}

interface IssueDetailPanelProps {
  issue: DemoIssue;
  decision: IssueDecision;
  onApprove: (issueId: string) => void;
  onReject: (issueId: string) => void;
  onUndo: (issueId: string) => void;
}

export function IssueDetailPanel({
  issue,
  decision,
  onApprove,
  onReject,
  onUndo,
}: IssueDetailPanelProps) {
  const isDecided = decision !== "pending";

  return (
    <article
      data-testid="issue-detail"
      className={cn(
        extensionModuleCardSurfaceClassName,
        "flex min-w-0 flex-col gap-5 p-5",
      )}
    >
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={issue.severity} />
          <DecisionBadge decision={decision} />
          <span className="font-mono text-xs text-muted">{issue.id}</span>
        </div>
        <h2 className="text-lg font-semibold leading-6 text-content">
          {issue.title}
        </h2>
        <p className="break-all font-mono text-xs text-muted">
          {issue.repository} · {issue.filePath}:{issue.line}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-[var(--oh-border)] p-3 sm:grid-cols-4">
        <MetaItem label={COPY.metaCategory} value={issue.category} />
        <MetaItem
          label={COPY.metaConfidence}
          value={`${String(Math.round(issue.confidence * 100))}%`}
        />
        <MetaItem label={COPY.metaDetected} value={issue.detectedLabel} />
        <MetaItem label={COPY.metaSource} value={issue.detectedBy} />
      </div>

      <section className="flex flex-col gap-2">
        <SectionHeading>{COPY.impactLabel}</SectionHeading>
        <p className="rounded-lg border-l-2 border-[var(--oh-border)] pl-3 text-sm leading-6 text-content">
          {issue.impact}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        {issue.details.map((paragraph) => (
          <p
            key={paragraph.slice(0, 40)}
            className="text-sm leading-6 text-muted"
          >
            {paragraph}
          </p>
        ))}
      </section>

      <section className="flex min-w-0 flex-col gap-2">
        <SectionHeading>{COPY.evidenceLabel}</SectionHeading>
        <pre className="overflow-x-auto rounded-lg bg-[rgba(0,0,0,0.35)] p-3 text-xs leading-5 text-content">
          <code>{issue.snippet}</code>
        </pre>
      </section>

      <section className="flex min-w-0 flex-col gap-2">
        <SectionHeading>{COPY.fixLabel}</SectionHeading>
        <DiffBlock patch={issue.suggestedFix} />
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeading>{COPY.verificationLabel}</SectionHeading>
        <p className="text-sm leading-6 text-muted">{issue.verification}</p>
      </section>

      <footer className="flex flex-wrap items-center gap-3 border-t border-[var(--oh-border)] pt-4">
        {isDecided ? (
          <>
            <p className="min-w-0 flex-1 text-sm text-muted">
              {decision === "approved"
                ? COPY.approvedBanner
                : COPY.rejectedBanner}
            </p>
            <BrandButton
              type="button"
              variant="secondary"
              testId="issue-undo"
              onClick={() => onUndo(issue.id)}
              startContent={<RotateCcw className="size-4" aria-hidden />}
            >
              {COPY.undo}
            </BrandButton>
          </>
        ) : (
          <>
            <BrandButton
              type="button"
              variant="primary"
              testId="issue-approve"
              onClick={() => onApprove(issue.id)}
              startContent={<Check className="size-4" aria-hidden />}
            >
              {COPY.approve}
            </BrandButton>
            <BrandButton
              type="button"
              variant="danger"
              testId="issue-reject"
              onClick={() => onReject(issue.id)}
              startContent={<X className="size-4" aria-hidden />}
            >
              {COPY.reject}
            </BrandButton>
          </>
        )}
      </footer>
    </article>
  );
}
