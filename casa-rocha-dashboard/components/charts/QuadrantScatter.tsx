"use client";

// Scatter 0–5 × 0–5 com quadrantes nomeados e drill-down por ponto (DASHBOARD_SPEC P7).

import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ScatterPoint {
  id: string;
  title: string;
  x: number;
  y: number;
  status: string; // ai_coded | reviewed
}

export default function QuadrantScatter({
  data,
  xLabel,
  yLabel,
  height = 420,
}: {
  data: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  height?: number;
}) {
  const router = useRouter();
  const mid = 2.5;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid stroke="var(--grid)" strokeWidth={1} />
        <ReferenceArea x1={mid} x2={5.2} y1={mid} y2={5.2} fill="var(--seq-200)" fillOpacity={0.12} />
        <XAxis
          type="number"
          dataKey="x"
          domain={[-0.2, 5.2]}
          ticks={[0, 1, 2, 3, 4, 5]}
          stroke="var(--baseline)"
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          label={{ value: xLabel, position: "insideBottom", offset: -4, fill: "var(--text-secondary)", fontSize: 12 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          domain={[-0.2, 5.2]}
          ticks={[0, 1, 2, 3, 4, 5]}
          stroke="var(--baseline)"
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          width={36}
          label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "var(--text-secondary)", fontSize: 12 }}
        />
        <ReferenceLine x={mid} stroke="var(--baseline)" strokeDasharray="4 4" />
        <ReferenceLine y={mid} stroke="var(--baseline)" strokeDasharray="4 4" />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--foreground)",
          }}
          content={({ payload }) => {
            const p = payload?.[0]?.payload as ScatterPoint | undefined;
            if (!p) return null;
            return (
              <div className="rounded-lg border bg-white px-3 py-2 text-xs shadow-sm" style={{ borderColor: "var(--border)" }}>
                <p className="font-medium max-w-64">{p.title}</p>
                <p className="text-neutral-600">{xLabel}: {p.x} · {yLabel}: {p.y}</p>
                <p className="text-neutral-500">{p.status === "reviewed" ? "revisada" : "codificada por IA"} · clique para abrir</p>
              </div>
            );
          }}
        />
        <Scatter
          data={data}
          fill="var(--series-1)"
          stroke="var(--surface)"
          strokeWidth={1.5}
          onClick={(p) => router.push(`/sermons/${(p as unknown as ScatterPoint).id}`)}
          cursor="pointer"
          shape={(props: unknown) => {
            const { cx, cy, payload } = props as { cx: number; cy: number; payload: ScatterPoint };
            return (
              <circle
                cx={cx}
                cy={cy}
                r={5}
                fill={payload.status === "reviewed" ? "var(--series-1)" : "var(--seq-200)"}
                stroke="var(--surface)"
                strokeWidth={1.5}
              />
            );
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
