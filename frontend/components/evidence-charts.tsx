"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Fixed assignment order — matches --chart-* tokens in globals.css.
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

const tickStyle = {
  fill: "var(--ink-tertiary)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
};

const tooltipStyle = {
  backgroundColor: "var(--surface-1)",
  border: "1px solid var(--surface-3)",
  borderRadius: "var(--radius)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--ink-primary)",
};

export function DispersionChart({ data }: { data: { symbol: string; price: number }[] }) {
  if (data.length === 0) return null;
  return (
    <div style={{ height: 140 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
          <XAxis type="number" hide domain={["auto", "auto"]} />
          <YAxis type="category" dataKey="symbol" tick={tickStyle} width={64} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-2)" }} />
          <Bar dataKey="price" fill="var(--chart-1)" radius={[0, 3, 3, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConcentrationChart({ data }: { data: { symbol: string; marketCap: number }[] }) {
  if (data.length === 0) return null;
  return (
    <div style={{ height: 140 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="marketCap"
            nameKey="symbol"
            innerRadius="62%"
            outerRadius="92%"
            strokeWidth={0}
            paddingAngle={data.length > 1 ? 2 : 0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
