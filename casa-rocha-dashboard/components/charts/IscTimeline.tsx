"use client";

// Linha temporal do ISC médio por ano (métrica lexical — hipótese a validar).

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface IscYearDatum {
  year: number;
  isc: number; // média do ano, %
  n: number; // denominador (pregações calculáveis)
}

export default function IscTimeline({
  data,
  threshold,
  height = 260,
}: {
  data: IscYearDatum[];
  threshold: number;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid stroke="var(--grid)" strokeWidth={1} vertical={false} />
        <XAxis dataKey="year" stroke="var(--baseline)" tick={{ fill: "var(--muted)", fontSize: 12 }} />
        <YAxis
          stroke="var(--baseline)"
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          width={40}
          unit="%"
          domain={[0, (max: number) => Math.max(Math.ceil(max * 1.2), threshold + 5)]}
        />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--foreground)",
          }}
          formatter={(v, _n, item) => [
            `${Number(v).toFixed(1)}% (média de ${(item?.payload as IscYearDatum | undefined)?.n ?? "?"} pregações)`,
            "ISC médio",
          ]}
          labelStyle={{ color: "var(--text-secondary)" }}
        />
        <ReferenceLine
          y={threshold}
          stroke="var(--status-serious)"
          strokeDasharray="4 4"
          label={{
            value: `limiar ${threshold}%`,
            position: "insideTopRight",
            fill: "var(--text-secondary)",
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="isc"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={{ r: 4, fill: "var(--series-1)", stroke: "var(--surface)", strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
