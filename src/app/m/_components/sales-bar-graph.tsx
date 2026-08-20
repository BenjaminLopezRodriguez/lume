"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const CHART_CONFIG = {
  value: { label: "Value", color: "var(--success)" },
} satisfies ChartConfig;

function formatChartValue(value: number, valueFormat: "currency" | "number") {
  if (valueFormat === "currency") {
    return `$${value.toLocaleString()}`;
  }

  return value.toLocaleString();
}

export function SalesBarGraph({
  className,
  data,
  label,
  color = "var(--success)",
  valueFormat = "currency",
}: {
  className?: string;
  data: ReadonlyArray<{ label: string; value: number }>;
  label?: string;
  color?: string;
  valueFormat?: "currency" | "number";
}) {
  const chartData = [...data];
  const hasData = chartData.some((item) => item.value > 0);
  const maxValue = hasData
    ? Math.max(...chartData.map((item) => item.value))
    : 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card px-4 pt-4 pb-2",
        className,
      )}
    >
      {label ? (
        <p className="mb-2 text-sm text-muted-foreground">{label}</p>
      ) : null}
      {!hasData ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No data yet
        </p>
      ) : (
      <ChartContainer
        config={CHART_CONFIG}
        className="aspect-[3/1] h-40 w-full [&_.recharts-surface]:overflow-visible"
        initialDimension={{ width: 400, height: 160 }}
      >
        <BarChart
          data={chartData}
          margin={{ top: 28, right: 4, left: 4, bottom: 0 }}
          barCategoryGap="18%"
        >
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            dy={4}
          />
          <YAxis hide domain={[0, maxValue * 1.2]} />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={36}>
            <LabelList
              dataKey="value"
              position="top"
              offset={8}
              formatter={(value) => formatChartValue(Number(value), valueFormat)}
              className="fill-muted-foreground"
              style={{ fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      )}
    </div>
  );
}
