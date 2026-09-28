import { RawResponseDrawer } from "@/components/raw-response-drawer";
import { Skeleton } from "@/components/ui/skeleton";

interface EvidenceCardProps {
  label: string;
  /** The formatted value string (e.g. "0.38%", "HHI 7,240", "100%") */
  value?: string;
  /** Text shown below the value — what it means in plain language */
  explanation?: string;
  /** Only when value is undefined — why it's not computable */
  nullReason?: string;
  /** Optional chart rendered inside the card body */
  chartSlot?: React.ReactNode;
  /** Raw response drawer props — undefined = no drawer shown */
  raw?: {
    endpoint: string;
    params?: Record<string, string>;
    capturedAt: string;
    data: unknown;
  };
  /** Card visual size: "lg" (6-col) | "md" (4-col) */
  size?: "lg" | "md";
  /** Bold the value — used ONLY by Compare to mark the higher side of a
      metric. Never a color, never a verdict (FRONTEND.md rule 2). */
  bold?: boolean;
}

export function EvidenceCard({
  label,
  value,
  explanation,
  nullReason,
  chartSlot,
  raw,
  size = "md",
  bold = false,
}: EvidenceCardProps) {
  const isComputable = value !== undefined;

  return (
    <div
      className="flex flex-col gap-3 p-5 panel"
      style={{ minHeight: size === "lg" ? "220px" : "180px" }}
    >
      {/* Label */}
      <p
        className="text-[11px] font-sans font-medium tracking-widest uppercase"
        style={{ color: "var(--ink-tertiary)", letterSpacing: "0.1em" }}
      >
        {label}
      </p>

      {/* Value or Not Computable */}
      {isComputable ? (
        <p
          className={`display-number text-5xl${bold ? " font-bold" : ""}`}
          style={{
            color: "var(--ink-primary)",
            fontSize: size === "lg" ? "3rem" : "2.25rem",
          }}
        >
          {value}
        </p>
      ) : (
        <div>
          <p
            className="font-sans text-sm font-medium"
            style={{ color: "var(--flag)" }}
          >
            Not computable
          </p>
          {nullReason && (
            <p
              className="font-sans text-xs mt-1 leading-relaxed"
              style={{ color: "var(--ink-tertiary)" }}
            >
              {nullReason}
            </p>
          )}
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <p
          className="font-sans text-xs leading-relaxed"
          style={{ color: "var(--ink-secondary)" }}
        >
          {explanation}
        </p>
      )}

      {/* Chart slot */}
      {chartSlot && <div className="mt-1">{chartSlot}</div>}

      {/* Raw response drawer — pushed to bottom */}
      {raw && (
        <div className="mt-auto pt-2" style={{ borderTop: "1px solid var(--surface-3)" }}>
          <RawResponseDrawer
            endpoint={raw.endpoint}
            params={raw.params}
            capturedAt={raw.capturedAt}
            raw={raw.data}
          />
        </div>
      )}
    </div>
  );
}

export function EvidenceCardSkeleton({ size = "md" }: { size?: "lg" | "md" }) {
  return (
    <div
      className="flex flex-col gap-3 p-5 panel"
      style={{ minHeight: size === "lg" ? "220px" : "180px" }}
    >
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-12 w-40" />
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-4 w-44" />
    </div>
  );
}
