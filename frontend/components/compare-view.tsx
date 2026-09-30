"use client";

import { EvidenceCard } from "@/components/evidence-card";
import type { AssetEvidence } from "@/lib/evidence";

interface CompareAsset {
  id: string;
  symbol: string;
  name: string;
  evidence: AssetEvidence;
  capturedAt: string;
}

interface CompareViewProps {
  assetA: CompareAsset;
  assetB: CompareAsset;
}

// Highlights the "more notable" side of a metric WITHOUT implying good/bad.
// Higher dispersion = bold (more disagreement). Higher concentration = bold
// (less spread). Higher issuer exposure = bold (more systemic weight).
// Higher metadata completeness = bold (more complete). Higher coverage = bold
// (more discoverable). Bold states a fact — not a verdict.
function dominant(a: number | null, b: number | null): "a" | "b" | "none" {
  if (a === null || b === null) return "none";
  if (a > b) return "a";
  if (b > a) return "b";
  return "none";
}

function fmtNum(n: number | null, decimals = 2): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface CardPairProps {
  label: string;
  valueA: string | undefined;
  valueB: string | undefined;
  explanationA?: string;
  explanationB?: string;
  nullReasonA?: string;
  nullReasonB?: string;
  boldSide?: "a" | "b" | "none";
}

function CardPair({
  label,
  valueA,
  valueB,
  explanationA,
  explanationB,
  nullReasonA,
  nullReasonB,
  boldSide = "none",
}: CardPairProps) {
  return (
    <div>
      <p
        className="text-[11px] font-mono font-medium tracking-widest uppercase mb-2"
        style={{ color: "var(--ink-tertiary)", letterSpacing: "0.1em" }}
      >
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <EvidenceCard
          label=""
          value={valueA}
          explanation={explanationA}
          nullReason={nullReasonA}
          size="md"
          bold={boldSide === "a"}
        />
        <EvidenceCard
          label=""
          value={valueB}
          explanation={explanationB}
          nullReason={nullReasonB}
          size="md"
          bold={boldSide === "b"}
        />
      </div>
      {boldSide !== "none" && (
        <p
          className="text-xs font-mono mt-1 text-right"
          style={{ color: "var(--ink-tertiary)" }}
        >
          {boldSide === "a" ? "← higher" : "higher →"}
        </p>
      )}
    </div>
  );
}

export function CompareView({ assetA, assetB }: CompareViewProps) {
  const evA = assetA.evidence;
  const evB = assetB.evidence;

  const dispA = evA.dispersion.computable ? evA.dispersion.value : null;
  const dispB = evB.dispersion.computable ? evB.dispersion.value : null;

  const conA = evA.concentration.computable ? evA.concentration.value : null;
  const conB = evB.concentration.computable ? evB.concentration.value : null;

  const issA = evA.issuerExposure.computable
    ? evA.issuerExposure.value.shareOfUniversePct
    : null;
  const issB = evB.issuerExposure.computable
    ? evB.issuerExposure.value.shareOfUniversePct
    : null;

  const metA = evA.metadataCompleteness.computable
    ? evA.metadataCompleteness.value
    : null;
  const metB = evB.metadataCompleteness.computable
    ? evB.metadataCompleteness.value
    : null;

  const excA = evA.exchangeCoverage.computable
    ? evA.exchangeCoverage.value.count
    : null;
  const excB = evB.exchangeCoverage.computable
    ? evB.exchangeCoverage.value.count
    : null;

  return (
    <div>
      {/* Asset headers */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {[assetA, assetB].map((asset) => (
          <div key={asset.id} className="panel p-4">
            <p
              className="font-mono font-medium text-lg"
              style={{ color: "var(--ink-primary)" }}
            >
              {asset.symbol}
            </p>
            <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
              {asset.name}
            </p>
          </div>
        ))}
      </div>

      {/* Evidence card pairs */}
      <div className="flex flex-col gap-6">
        <CardPair
          label="Token Price Dispersion"
          valueA={dispA !== null ? `${fmtNum(dispA)}%` : undefined}
          valueB={dispB !== null ? `${fmtNum(dispB)}%` : undefined}
          explanationA={evA.dispersion.computable ? evA.dispersion.explanation : undefined}
          explanationB={evB.dispersion.computable ? evB.dispersion.explanation : undefined}
          nullReasonA={!evA.dispersion.computable ? evA.dispersion.reason : undefined}
          nullReasonB={!evB.dispersion.computable ? evB.dispersion.reason : undefined}
          boldSide={dominant(dispA, dispB)}
        />
        <CardPair
          label="Liquidity Concentration (HHI)"
          valueA={conA !== null ? `${conA.toLocaleString("en-US")}` : undefined}
          valueB={conB !== null ? `${conB.toLocaleString("en-US")}` : undefined}
          explanationA={evA.concentration.computable ? evA.concentration.explanation : undefined}
          explanationB={evB.concentration.computable ? evB.concentration.explanation : undefined}
          nullReasonA={!evA.concentration.computable ? evA.concentration.reason : undefined}
          nullReasonB={!evB.concentration.computable ? evB.concentration.reason : undefined}
          boldSide={dominant(conA, conB)}
        />
        <CardPair
          label="Issuer Exposure (% of universe)"
          valueA={issA !== null ? `${fmtNum(issA)}%` : undefined}
          valueB={issB !== null ? `${fmtNum(issB)}%` : undefined}
          explanationA={evA.issuerExposure.computable ? evA.issuerExposure.explanation : undefined}
          explanationB={evB.issuerExposure.computable ? evB.issuerExposure.explanation : undefined}
          nullReasonA={!evA.issuerExposure.computable ? evA.issuerExposure.reason : undefined}
          nullReasonB={!evB.issuerExposure.computable ? evB.issuerExposure.reason : undefined}
          boldSide={dominant(issA, issB)}
        />
        <CardPair
          label="Metadata Completeness"
          valueA={metA !== null ? `${metA}%` : undefined}
          valueB={metB !== null ? `${metB}%` : undefined}
          explanationA={evA.metadataCompleteness.computable ? evA.metadataCompleteness.explanation : undefined}
          explanationB={evB.metadataCompleteness.computable ? evB.metadataCompleteness.explanation : undefined}
          nullReasonA={!evA.metadataCompleteness.computable ? evA.metadataCompleteness.reason : undefined}
          nullReasonB={!evB.metadataCompleteness.computable ? evB.metadataCompleteness.reason : undefined}
          boldSide={dominant(metA, metB)}
        />
        <CardPair
          label="Exchange Coverage"
          valueA={excA !== null ? `${excA} exchange${excA !== 1 ? "s" : ""}` : undefined}
          valueB={excB !== null ? `${excB} exchange${excB !== 1 ? "s" : ""}` : undefined}
          explanationA={evA.exchangeCoverage.computable ? evA.exchangeCoverage.explanation : undefined}
          explanationB={evB.exchangeCoverage.computable ? evB.exchangeCoverage.explanation : undefined}
          boldSide={dominant(excA, excB)}
        />
      </div>

      {/* No verdict */}
      <p
        className="mt-8 text-xs font-mono text-center"
        style={{ color: "var(--ink-tertiary)" }}
      >
        Higher values are highlighted. No recommendation is implied.
        See{" "}
        <a
          href="/methodology"
          className="underline"
          style={{ color: "var(--accent)" }}
        >
          methodology
        </a>{" "}
        for what each metric measures.
      </p>
    </div>
  );
}
