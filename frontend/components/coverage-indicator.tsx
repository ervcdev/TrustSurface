import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CARD_LABELS = [
  "Price Dispersion",
  "Concentration",
  "Issuer Exposure",
  "Metadata",
  "Exchange Coverage",
] as const;

interface CoverageIndicatorProps {
  /** Array of 5 booleans — true = computable */
  coverage: [boolean, boolean, boolean, boolean, boolean];
  /** Optional tooltips — e.g. "0.38%" or "Not computable — fewer than 2 tokens" */
  tooltips?: [string, string, string, string, string];
}

export function CoverageIndicator({ coverage, tooltips }: CoverageIndicatorProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1">
        {coverage.map((isComputable, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span
                className="inline-block h-2 w-2 rounded-full cursor-default"
                style={{
                  backgroundColor: isComputable
                    ? "var(--accent)"
                    : "var(--surface-3)",
                  border: isComputable
                    ? "none"
                    : "1px solid var(--ink-tertiary)",
                }}
                aria-label={`${CARD_LABELS[i]}: ${isComputable ? "computable" : "not computable"}`}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-mono">
              <p className="font-medium">{CARD_LABELS[i]}</p>
              <p style={{ color: isComputable ? "var(--accent)" : "var(--flag)" }}>
                {tooltips?.[i] ?? (isComputable ? "Computable" : "Not computable")}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
