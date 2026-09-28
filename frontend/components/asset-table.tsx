"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverageIndicator } from "@/components/coverage-indicator";
import Link from "next/link";

export interface AssetRow {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  priceUsd: string | null;
  marketCapUsd: string | null;
  tokenCount: number;
  coverage: [boolean, boolean, boolean, boolean, boolean];
  coverageTooltips?: [string, string, string, string, string];
}

const TYPE_LABELS: Record<string, string> = {
  stock: "Equity",
  commodity: "Commodity",
  currency: "Currency",
  government_security: "Treasury",
  etf: "ETF",
  real_estate: "Real Estate",
};

const ALL_TYPES = ["all", "stock", "commodity", "currency", "government_security", "etf", "real_estate"];

const columns: ColumnDef<AssetRow>[] = [
  {
    accessorKey: "symbol",
    header: "Symbol",
    cell: ({ row }) => (
      <Link
        href={`/asset/${row.original.id}`}
        className="font-mono font-medium hover:underline"
        style={{ color: "var(--accent)" }}
      >
        {row.original.symbol}
      </Link>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span style={{ color: "var(--ink-secondary)" }}>{row.original.name}</span>
    ),
  },
  {
    accessorKey: "assetType",
    header: "Type",
    cell: ({ row }) => (
      <span className="text-xs font-mono" style={{ color: "var(--ink-tertiary)" }}>
        {TYPE_LABELS[row.original.assetType] ?? row.original.assetType}
      </span>
    ),
  },
  {
    accessorKey: "priceUsd",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 gap-1 font-mono text-xs"
        style={{ color: "var(--ink-tertiary)" }}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Price (USD) <ArrowUpDown className="h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const v = row.original.priceUsd;
      return (
        <span className="font-mono tabular-nums" style={{ color: "var(--ink-primary)" }}>
          {v ? `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
        </span>
      );
    },
    sortingFn: (a, b) => Number(a.original.priceUsd ?? 0) - Number(b.original.priceUsd ?? 0),
  },
  {
    accessorKey: "tokenCount",
    header: "Tokens",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums" style={{ color: "var(--ink-secondary)" }}>
        {row.original.tokenCount}
      </span>
    ),
  },
  {
    id: "coverage",
    header: () => (
      <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--ink-tertiary)", letterSpacing: "0.1em" }}>
        ◆ ◈ ◉ ▣ ◎
      </span>
    ),
    cell: ({ row }) => (
      <CoverageIndicator
        coverage={row.original.coverage}
        tooltips={row.original.coverageTooltips}
      />
    ),
  },
];

interface AssetTableProps {
  data: AssetRow[];
}

export function AssetTable({ data }: AssetTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [typeFilter, setTypeFilter] = React.useState("all");

  const filtered = React.useMemo(
    () => (typeFilter === "all" ? data : data.filter((r) => r.assetType === typeFilter)),
    [data, typeFilter]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center justify-between mb-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger
            className="w-48 font-mono text-sm h-8"
            style={{ background: "var(--surface-1)", borderColor: "var(--surface-3)" }}
          >
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent style={{ background: "var(--surface-1)", borderColor: "var(--surface-3)" }}>
            {ALL_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="font-mono text-sm">
                {t === "all" ? "All types" : (TYPE_LABELS[t] ?? t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs font-mono" style={{ color: "var(--ink-tertiary)" }}>
          {filtered.length} assets
        </span>
      </div>

      {/* Ledger */}
      <div className="rounded border overflow-hidden" style={{ borderColor: "var(--surface-3)" }}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                style={{ borderBottomColor: "var(--surface-3)", background: "var(--surface-1)" }}
              >
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className="font-mono text-xs"
                    style={{ color: "var(--ink-tertiary)" }}
                  >
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="transition-colors duration-75"
                  style={{
                    borderBottomColor: "var(--surface-2)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "";
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center font-mono text-sm"
                  style={{ color: "var(--ink-tertiary)" }}
                >
                  No assets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
