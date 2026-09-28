"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface RawResponseDrawerProps {
  endpoint: string;
  params?: Record<string, string>;
  capturedAt: string;   // ISO string from ingestion_runs
  raw: unknown;         // The raw jsonb stored in the DB
}

/** Minimal syntax highlighting — keys, strings, numbers only. */
function colorize(json: string): string {
  return json
    .replace(/"([^"]+)":/g, '<span style="color:var(--ink-secondary)">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span style="color:var(--accent)">"$1"</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span style="color:var(--ink-primary)">$1</span>');
}

export function RawResponseDrawer({
  endpoint,
  params,
  capturedAt,
  raw,
}: RawResponseDrawerProps) {
  const [copied, setCopied] = useState(false);
  const formatted = JSON.stringify(raw, null, 2);
  const colored = colorize(
    formatted
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs font-mono"
          style={{ color: "var(--ink-tertiary)" }}
        >
          <ChevronDown className="h-3 w-3" />
          Raw response
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col"
        style={{ background: "var(--surface-1)", borderLeft: "1px solid var(--surface-3)" }}
      >
        <SheetHeader className="shrink-0 border-b pb-3" style={{ borderColor: "var(--surface-3)" }}>
          <SheetTitle className="font-mono text-sm" style={{ color: "var(--ink-secondary)" }}>
            {endpoint}
          </SheetTitle>
          {params && (
            <p className="font-mono text-xs" style={{ color: "var(--ink-tertiary)" }}>
              {Object.entries(params)
                .map(([k, v]) => `${k}=${v}`)
                .join("  ·  ")}
            </p>
          )}
          <p className="font-mono text-xs" style={{ color: "var(--ink-tertiary)" }}>
            Captured{" "}
            {new Date(capturedAt).toUTCString().replace("GMT", "UTC")}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-auto pt-4">
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs font-mono"
              style={{ color: "var(--ink-tertiary)" }}
              onClick={handleCopy}
            >
              {copied ? "Copied" : "Copy JSON"}
            </Button>
          </div>
          <pre
            className="font-mono text-xs leading-relaxed whitespace-pre overflow-x-auto"
            style={{ color: "var(--ink-primary)" }}
            dangerouslySetInnerHTML={{ __html: colored }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
