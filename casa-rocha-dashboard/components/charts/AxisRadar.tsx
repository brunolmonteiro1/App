"use client";

// Radar dos eixos de saúde formativa (médias 0–5 sobre pregações codificadas).

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface RadarDatum {
  axis: string;
  value: number; // média 0–5
  n: number; // denominador
}

export default function AxisRadar({ data, height = 380 }: { data: RadarDatum[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid stroke="var(--grid)" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fill: "var(--muted)", fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
          }}
          formatter={(v, _n, item) => [
            `${Number(v).toFixed(2)} (média de ${(item?.payload as RadarDatum)?.n ?? "?"} pregações)`,
            "score médio",
          ]}
        />
        <Radar dataKey="value" stroke="var(--series-1)" fill="var(--series-1)" fillOpacity={0.25} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
