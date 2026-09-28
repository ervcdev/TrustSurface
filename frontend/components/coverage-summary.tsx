// Universe-level coverage strip for Explore. Purely presentational (no
// hooks, no data fetching) — receives counts computed from REAL ingested
// rows in app/page.tsx.
//
// Why it exists: in the first seconds of a demo, a judge should see (a)
// that the numbers come from a real run, and (b) all five axes at once,
// including how often each one is NOT computable. Most tools in this track
// only show what worked; this shows the gaps at universe scale.
//
// Design rules honored: borders not shadows; --flag is used only as a dot
// (icon/background usage), never as label text (FRONTEND.md rule 4).

export interface CardCoverage {
  label: string;
  computable: number;
}

interface CoverageSummaryProps {
  total: number;
  cards: CardCoverage[];
}

export function CoverageSummary({ total, cards }: CoverageSummaryProps) {
  if (total === 0) return null;

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-5 mb-8 overflow-hidden rounded"
      style={{ border: "1px solid var(--surface-3)", background: "var(--surface-1)" }}
      aria-label="Signal coverage across all tracked assets"
    >
      {cards.map((c, i) => {
        const missing = total - c.computable;
        const pct = Math.round((c.computable / total) * 100);
        return (
          <div
            key={c.label}
            className="p-4"
            style={{
              borderLeft: i === 0 ? "none" : "1px solid var(--surface-3)",
            }}
          >
            <p
              className="text-[11px] font-medium uppercase"
              style={{ color: "var(--ink-tertiary)", letterSpacing: "0.1em" }}
            >
              {c.label}
            </p>
            <p
              className="display-number mt-2"
              style={{ color: "var(--ink-primary)", fontSize: "1.75rem" }}
            >
              {c.computable}
              <span
                className="font-mono"
                style={{ color: "var(--ink-tertiary)", fontSize: "0.8rem", letterSpacing: 0 }}
              >
                {" "}/ {total}
              </span>
            </p>
            {/* Thin bar: computable share. Accent = confirmed data. */}
            <div
              className="mt-3 h-1 w-full rounded-full"
              style={{ background: "var(--surface-3)" }}
              role="presentation"
            >
              <div
                className="h-1 rounded-full"
                style={{ width: `${pct}%`, background: "var(--accent)" }}
              />
            </div>
            <p
              className="mt-2 flex items-center gap-1.5 text-xs font-mono"
              style={{ color: "var(--ink-secondary)" }}
            >
              {missing > 0 && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--flag)" }}
                  aria-hidden
                />
              )}
              {missing > 0 ? `${missing} not computable` : "all computable"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
