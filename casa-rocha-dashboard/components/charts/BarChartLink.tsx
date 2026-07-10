"use client";

// Barra única-série clicável (drill-down → /sermons?<param>=<chave>).
// Marca fina, topo arredondado 4px, grid recessivo, tooltip por marca.

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface BarDatum {
  key: string;
  label: string;
  value: number;
}

export default function BarChartLink({
  data,
  drillParam,
  vertical = false,
  height = 260,
}: {
  data: BarDatum[];
  drillParam: string; // ex.: "year" | "series"
  vertical?: boolean;
  height?: number;
}) {
  const router = useRouter();
  const go = (d: BarDatum) => router.push(`/sermons?${drillParam}=${encodeURIComponent(d.key)}`);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={vertical ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 12, bottom: 4, left: vertical ? 8 : 0 }}
      >
        <CartesianGrid stroke="var(--grid)" strokeWidth={1} horizontal={!vertical} vertical={vertical} />
        {vertical ? (
          <>
            <XAxis type="number" stroke="var(--baseline)" tick={{ fill: "var(--muted)", fontSize: 12 }} allowDecimals={false} />
            <YAxis type="category" dataKey="label" width={150} stroke="var(--baseline)" tick={{ fill: "var(--muted)", fontSize: 12 }} />
          </>
        ) : (
          <>
            <XAxis dataKey="label" stroke="var(--baseline)" tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis stroke="var(--baseline)" tick={{ fill: "var(--muted)", fontSize: 12 }} allowDecimals={false} width={34} />
          </>
        )}
        <Tooltip
          cursor={{ fill: "rgba(11,11,11,0.04)" }}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--foreground)",
          }}
          formatter={(v) => [String(v), "pregações"]}
          labelStyle={{ color: "var(--text-secondary)" }}
        />
        <Bar
          dataKey="value"
          fill="var(--series-1)"
          radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          maxBarSize={vertical ? 18 : 36}
          onClick={(d) => go(d as unknown as BarDatum)}
          cursor="pointer"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
