/**
 * Seeded review queue for the Issue Review demo page.
 *
 * The dashboard is a *demo surface*: it renders this fixed list rather than
 * calling the agent server, so the page looks the same on every machine and
 * needs no backend, no automations, and no prior runs. Timestamps are stored
 * as display strings (not dates) on purpose — a demo recorded today should
 * still read "12 minutes ago" tomorrow, and a computed relative time would
 * also drift between the server render and the client hydration.
 */

export type IssueSeverity = "critical" | "high" | "medium" | "low";

export type IssueDecision = "pending" | "approved" | "rejected";

export interface DemoIssue {
  id: string;
  title: string;
  /** One-line gist shown in the list row. */
  summary: string;
  repository: string;
  filePath: string;
  line: number;
  severity: IssueSeverity;
  category: string;
  /** Pre-rendered relative time, e.g. "12 minutes ago". */
  detectedLabel: string;
  /** The automation that surfaced the finding. */
  detectedBy: string;
  /** 0–1; rendered as a percentage. */
  confidence: number;
  /** Feeds the "Average duration" tile. */
  scanDurationSeconds: number;
  impact: string;
  /** Body paragraphs shown in the reader pane. */
  details: string[];
  snippetLanguage: string;
  snippet: string;
  suggestedFix: string;
  verification: string;
}

/** Scans behind the queue — the "Total scans" tile. */
export const DEMO_SCAN_TOTAL = 147;

/** Repositories those scans covered — the "Total scans" tile detail. */
export const DEMO_REPOSITORY_COUNT = 6;

export const DEMO_ISSUES: DemoIssue[] = [
  {
    id: "AM-1042",
    title: "Session API key is logged in plaintext on websocket reconnect",
    summary:
      "The reconnect handler writes the full connection URL — including the session key — to the browser console.",
    repository: "acme/agent-canvas",
    filePath: "src/api/event-service/event-service.api.ts",
    line: 212,
    severity: "critical",
    category: "Security",
    detectedLabel: "12 minutes ago",
    detectedBy: "Nightly security sweep",
    confidence: 0.94,
    scanDurationSeconds: 214,
    impact:
      "Anyone with access to a user's console output or an exported HAR file can replay the session key and act as that user against the agent server.",
    details: [
      "`buildWebsocketUrl` appends `session_api_key` as a query parameter so the socket can authenticate on connect. The reconnect path then logs the resulting URL verbatim to help debug dropped connections, which puts a live credential into the console and into any log forwarder attached to it.",
      "The value is long-lived: it is minted per session and stays valid until the conversation ends, so a leaked key is usable for the rest of the session rather than for a few seconds.",
    ],
    snippetLanguage: "ts",
    snippet: `const url = buildWebsocketUrl(host, conversationId, sessionApiKey);

socket.addEventListener("close", () => {
  console.warn("Socket dropped, reconnecting to", url);
  scheduleReconnect(url);
});`,
    suggestedFix: `-  console.warn("Socket dropped, reconnecting to", url);
+  console.warn("Socket dropped, reconnecting to", redactSessionKey(url));`,
    verification:
      "Adds a unit test asserting the logged string contains `session_api_key=***` and never the raw key.",
  },
  {
    id: "AM-1039",
    title: "Conversation list refetch loop when the backend returns 304",
    summary:
      "A missing `staleTime` turns every focus event into a refetch storm against `/api/conversations`.",
    repository: "acme/agent-canvas",
    filePath: "src/hooks/query/use-user-conversations.ts",
    line: 48,
    severity: "high",
    category: "Performance",
    detectedLabel: "38 minutes ago",
    detectedBy: "Nightly performance sweep",
    confidence: 0.88,
    scanDurationSeconds: 168,
    impact:
      "On a workspace with 200 conversations the sidebar issues ~40 requests per minute while the tab is focused, which is enough to trip the agent server's rate limiter.",
    details: [
      "The query sets `refetchOnWindowFocus: true` but leaves `staleTime` at the default of 0, so every focus — including the focus regained after closing a modal — marks the cache stale and refires.",
      "The server answers most of these with a 304, so the bug is invisible in the UI and only shows up as request volume.",
    ],
    snippetLanguage: "ts",
    snippet: `useQuery({
  queryKey: ["conversations", backendId],
  queryFn: fetchConversations,
  refetchOnWindowFocus: true,
});`,
    suggestedFix: ` useQuery({
   queryKey: ["conversations", backendId],
   queryFn: fetchConversations,
   refetchOnWindowFocus: true,
+  staleTime: 30_000,
 });`,
    verification:
      "Adds a test that focuses the window twice inside the stale window and asserts a single fetch.",
  },
  {
    id: "AM-1036",
    title: "Workspace path join allows traversal above the workspace root",
    summary:
      "`resolveWorkspacePath` concatenates user input without normalising `..` segments.",
    repository: "acme/agent-server",
    filePath: "server/workspace/paths.py",
    line: 76,
    severity: "critical",
    category: "Security",
    detectedLabel: "1 hour ago",
    detectedBy: "Nightly security sweep",
    confidence: 0.91,
    scanDurationSeconds: 302,
    impact:
      "A crafted file path in a tool call can read or overwrite files outside the sandboxed workspace, including the server's own configuration.",
    details: [
      "The helper builds the absolute path with string concatenation and only checks that the result starts with the workspace root *before* normalising, so `workspace/../../etc/hosts` passes the prefix check and then resolves outside the root.",
      "Every file tool (read, write, edit, upload) funnels through this helper, so the fix is a single choke point.",
    ],
    snippetLanguage: "python",
    snippet: `def resolve_workspace_path(root: str, requested: str) -> str:
    candidate = f"{root}/{requested}"
    if not candidate.startswith(root):
        raise ValueError("path escapes workspace")
    return candidate`,
    suggestedFix: ` def resolve_workspace_path(root: str, requested: str) -> str:
-    candidate = f"{root}/{requested}"
-    if not candidate.startswith(root):
+    candidate = os.path.realpath(os.path.join(root, requested))
+    if os.path.commonpath([candidate, os.path.realpath(root)]) != os.path.realpath(root):
         raise ValueError("path escapes workspace")
     return candidate`,
    verification:
      "Adds parametrised tests for `..`, absolute paths, and symlinked directories.",
  },
  {
    id: "AM-1031",
    title: "Retry budget is shared across tenants in the automation dispatcher",
    summary:
      "One noisy tenant can exhaust the global retry allowance and stall every other tenant's runs.",
    repository: "acme/automation",
    filePath: "automation/dispatch/retry.py",
    line: 134,
    severity: "high",
    category: "Correctness",
    detectedLabel: "2 hours ago",
    detectedBy: "Reliability review",
    confidence: 0.79,
    scanDurationSeconds: 256,
    impact:
      "A single tenant with a failing webhook can delay unrelated scheduled automations by minutes during peak hours.",
    details: [
      "The token bucket is instantiated at module scope, so it is process-global rather than per tenant. Under the current single-process deployment this is the whole fleet's budget.",
      "The dispatcher already carries `tenant_id` on the run context, so keying the bucket is a small change — but it changes the shape of the metrics emitted alongside it.",
    ],
    snippetLanguage: "python",
    snippet: `RETRY_BUCKET = TokenBucket(capacity=200, refill_per_second=5)

def should_retry(run: Run) -> bool:
    return RETRY_BUCKET.take()`,
    suggestedFix: `-RETRY_BUCKET = TokenBucket(capacity=200, refill_per_second=5)
+RETRY_BUCKETS: dict[str, TokenBucket] = defaultdict(
+    lambda: TokenBucket(capacity=40, refill_per_second=2)
+)

 def should_retry(run: Run) -> bool:
-    return RETRY_BUCKET.take()
+    return RETRY_BUCKETS[run.tenant_id].take()`,
    verification:
      "Adds a test where tenant A drains its bucket and tenant B still retries.",
  },
  {
    id: "AM-1028",
    title: "Approve button stays enabled while the mutation is in flight",
    summary:
      "Double-clicking submits the review twice; the second call 409s and surfaces a scary error toast.",
    repository: "acme/agent-canvas",
    filePath: "src/components/features/review/review-actions.tsx",
    line: 61,
    severity: "medium",
    category: "Correctness",
    detectedLabel: "3 hours ago",
    detectedBy: "UI regression sweep",
    confidence: 0.83,
    scanDurationSeconds: 121,
    impact:
      "Users see a red 'Conflict' toast after a successful approval, which reads as data loss even though the first call landed.",
    details: [
      "The button's `isDisabled` only reflects the empty-comment case; it ignores `mutation.isPending`, so a fast second click fires before the first response settles.",
      "The server is already idempotent on the row, so the second call is harmless — it just reports the conflict.",
    ],
    snippetLanguage: "tsx",
    snippet: `<BrandButton
  type="button"
  variant="primary"
  isDisabled={comment.trim().length === 0}
  onClick={() => approve(issueId)}
>`,
    suggestedFix: ` <BrandButton
   type="button"
   variant="primary"
-  isDisabled={comment.trim().length === 0}
+  isDisabled={comment.trim().length === 0 || mutation.isPending}
   onClick={() => approve(issueId)}
 >`,
    verification:
      "Adds a test that clicks twice in the same tick and asserts one mutation call.",
  },
  {
    id: "AM-1024",
    title: "Secrets are echoed into the run transcript on validation failure",
    summary:
      "The validation error interpolates the submitted payload, including secret values.",
    repository: "acme/automation",
    filePath: "automation/api/secrets.py",
    line: 92,
    severity: "critical",
    category: "Security",
    detectedLabel: "5 hours ago",
    detectedBy: "Nightly security sweep",
    confidence: 0.96,
    scanDurationSeconds: 288,
    impact:
      "A mistyped secret name writes the secret's value into the run transcript, which is retained for 30 days and readable by every workspace member.",
    details: [
      "The handler builds its 422 body with an f-string over the raw request payload so the operator can see what was rejected. For the secrets endpoint that payload is the secret itself.",
      "Transcripts are exportable, so the value also escapes into any downloaded archive.",
    ],
    snippetLanguage: "python",
    snippet: `raise HTTPException(
    status_code=422,
    detail=f"Invalid secret payload: {payload}",
)`,
    suggestedFix: ` raise HTTPException(
     status_code=422,
-    detail=f"Invalid secret payload: {payload}",
+    detail=f"Invalid secret payload: missing keys {sorted(missing)}",
 )`,
    verification:
      "Adds a test asserting the 422 body contains the key names and never the values.",
  },
  {
    id: "AM-1019",
    title: "Diff viewer renders untrusted patch content as HTML",
    summary:
      "Patch hunks reach `dangerouslySetInnerHTML` without sanitisation when syntax highlighting is off.",
    repository: "acme/agent-canvas",
    filePath: "src/components/features/diff-viewer/file-diff-viewer.tsx",
    line: 188,
    severity: "high",
    category: "Security",
    detectedLabel: "8 hours ago",
    detectedBy: "Nightly security sweep",
    confidence: 0.72,
    scanDurationSeconds: 197,
    impact:
      "A repository containing a crafted file name or hunk header can execute script in the reviewer's session.",
    details: [
      "The highlighted path runs content through the syntax highlighter, which escapes it. The fallback path — used when the language is unknown — passes the raw string straight to `dangerouslySetInnerHTML` to preserve the highlighter's markup shape.",
      "Confidence is lower here because the fallback also strips tags upstream in `parseHunk`; the finding needs a reviewer to confirm whether that strip covers attribute-level injection.",
    ],
    snippetLanguage: "tsx",
    snippet: `<pre
  className={lineClassName}
  dangerouslySetInnerHTML={{ __html: highlighted ?? rawLine }}
/>`,
    suggestedFix: `-<pre
-  className={lineClassName}
-  dangerouslySetInnerHTML={{ __html: highlighted ?? rawLine }}
-/>
+{highlighted ? (
+  <pre className={lineClassName} dangerouslySetInnerHTML={{ __html: highlighted }} />
+) : (
+  <pre className={lineClassName}>{rawLine}</pre>
+)}`,
    verification:
      "Adds a test rendering a hunk containing `<img onerror=...>` and asserting it renders as text.",
  },
  {
    id: "AM-1015",
    title: "Migration drops the `runs.duration_ms` index without recreating it",
    summary:
      "The down-migration is missing the index, so a rollback leaves the dashboard query unindexed.",
    repository: "acme/automation",
    filePath: "automation/migrations/0031_run_stats.py",
    line: 40,
    severity: "medium",
    category: "Data",
    detectedLabel: "11 hours ago",
    detectedBy: "Schema review",
    confidence: 0.86,
    scanDurationSeconds: 143,
    impact:
      "After a rollback the average-duration tile takes a full table scan; at 2M rows that is a multi-second dashboard load.",
    details: [
      "`upgrade()` creates `ix_runs_duration_ms` and `downgrade()` drops the column but never the index, so re-running the migration pair fails on a duplicate index name.",
      "This only bites during an incident rollback, which is exactly when the slow path hurts most.",
    ],
    snippetLanguage: "python",
    snippet: `def downgrade():
    op.drop_column("runs", "duration_ms")`,
    suggestedFix: ` def downgrade():
+    op.drop_index("ix_runs_duration_ms", table_name="runs")
     op.drop_column("runs", "duration_ms")`,
    verification:
      "Adds an up/down/up round-trip test against a scratch database.",
  },
  {
    id: "AM-1011",
    title: "Sidebar keyboard focus escapes the collapsed rail",
    summary:
      "Collapsed nav items stay in the tab order with no visible focus ring.",
    repository: "acme/agent-canvas",
    filePath: "src/components/features/sidebar/sidebar-rail-body.tsx",
    line: 184,
    severity: "medium",
    category: "Accessibility",
    detectedLabel: "1 day ago",
    detectedBy: "Accessibility sweep",
    confidence: 0.81,
    scanDurationSeconds: 132,
    impact:
      "Keyboard users tab into invisible controls and cannot tell where focus is, which fails WCAG 2.4.7.",
    details: [
      "Collapsing the rail hides the labels with `sr-only` but keeps each link focusable, and the focus ring is drawn on the label rather than the row.",
      "Moving the ring to the row fixes both the visibility and the hit target.",
    ],
    snippetLanguage: "tsx",
    snippet: `<span className={collapsed ? "sr-only" : "truncate"}>
  {item.label}
</span>`,
    suggestedFix: `-<span className={collapsed ? "sr-only" : "truncate"}>
+<span className={cn(collapsed ? "sr-only" : "truncate", "focus-visible:outline-none")}>
   {item.label}
 </span>`,
    verification:
      "Adds a test asserting the focused row carries the ring class when collapsed.",
  },
  {
    id: "AM-1008",
    title: "Unbounded transcript export builds the whole archive in memory",
    summary:
      "`exportTranscript` concatenates every event into one string before writing the blob.",
    repository: "acme/agent-canvas",
    filePath: "src/utils/transcript-export/index.ts",
    line: 57,
    severity: "high",
    category: "Performance",
    detectedLabel: "1 day ago",
    detectedBy: "Nightly performance sweep",
    confidence: 0.77,
    scanDurationSeconds: 176,
    impact:
      "Exporting a long-running conversation (30k+ events) freezes the tab for several seconds and can hit the string length limit.",
    details: [
      "The exporter accumulates markdown into a single string, then constructs a Blob from it. Peak memory is roughly twice the transcript size.",
      "Streaming the parts into the Blob constructor avoids the intermediate copy without changing the output bytes.",
    ],
    snippetLanguage: "ts",
    snippet: `let out = "";
for (const event of events) {
  out += renderEvent(event);
}
return new Blob([out], { type: "text/markdown" });`,
    suggestedFix: `-let out = "";
-for (const event of events) {
-  out += renderEvent(event);
-}
-return new Blob([out], { type: "text/markdown" });
+const parts = events.map(renderEvent);
+return new Blob(parts, { type: "text/markdown" });`,
    verification:
      "Adds a benchmark-style test asserting output equality against the old implementation.",
  },
  {
    id: "AM-1004",
    title: "Stale `agent_kind` in cached profile survives a backend switch",
    summary:
      "Switching backends reuses the cached profile, so an ACP-only backend can be handed a built-in profile.",
    repository: "acme/agent-canvas",
    filePath: "src/hooks/mutation/use-create-conversation.ts",
    line: 140,
    severity: "medium",
    category: "Correctness",
    detectedLabel: "2 days ago",
    detectedBy: "Regression sweep",
    confidence: 0.69,
    scanDurationSeconds: 158,
    impact:
      "The first conversation started after a backend switch can fail to launch with an opaque 'unsupported agent kind' error.",
    details: [
      "The profile query is keyed by profile id only, not by backend id, so the cache carries across the switch.",
      "Reviewer input needed: the team may prefer invalidating on switch rather than widening the key, since the key change touches six call sites.",
    ],
    snippetLanguage: "ts",
    snippet: `queryKey: ["agent-profile", profileId],`,
    suggestedFix: `-queryKey: ["agent-profile", profileId],
+queryKey: ["agent-profile", backendId, profileId],`,
    verification:
      "Adds a test switching backends and asserting a refetch before conversation creation.",
  },
  {
    id: "AM-0998",
    title: "Docs promise a `--port` flag the CLI no longer accepts",
    summary:
      "The self-hosting guide documents a flag that was replaced by `PORT` in 1.14.",
    repository: "acme/docs",
    filePath: "docs/SELF_HOSTING.md",
    line: 212,
    severity: "low",
    category: "Documentation",
    detectedLabel: "3 days ago",
    detectedBy: "Docs drift check",
    confidence: 0.98,
    scanDurationSeconds: 64,
    impact:
      "New self-hosters hit an 'unknown option' error on their first run and file a support ticket.",
    details: [
      "The flag was removed when the launcher moved to the shared defaults file; the environment variable is the supported knob now.",
      "Two other pages already use the new form, so this is the last stale reference.",
    ],
    snippetLanguage: "bash",
    snippet: `agent-canvas --port 9000`,
    suggestedFix: `-agent-canvas --port 9000
+PORT=9000 agent-canvas`,
    verification:
      "Docs-only change; the link checker covers the surrounding section.",
  },
];
