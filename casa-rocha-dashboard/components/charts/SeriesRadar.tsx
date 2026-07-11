"use client";

// Radar sobreposto para comparar até 3 séries (paleta categórica validada, ordem fixa).

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const SERIES_COLORS = ["#2a78d6", "#1baf7a", "#eda100"]; // slots 1–3 da paleta

export interface SeriesRadarRow {
  axis: string;
  [seriesName: string]: string | number | null;
}

export default function SeriesRadar({
  data,
  seriesNames,
  height = 420,
}: {
  data: SeriesRadarRow[];
  seriesNames: string[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="68%">
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
          formatter={(v) => (v == null ? "sem dado" : Number(v).toFixed(2))}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {seriesNames.map((name, i) => (
          <Radar
            key={name}
            name={name}
            dataKey={name}
            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
            fill={SERIES_COLORS[i % SERIES_COLORS.length]}
            fillOpacity={0.12}
            strokeWidth={2}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}
