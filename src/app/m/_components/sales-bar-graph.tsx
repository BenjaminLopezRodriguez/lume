"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const CHART_CONFIG = {
  value: { label: "Value", color: "#22c55e" },
} satisfies ChartConfig;

const DEFAULT_DATA = [
  { label: "Mon", value: 820 },
  { label: "Tue", value: 940 },
  { label: "Wed", value: 880 },
  { label: "Thu", value: 1120 },
  { label: "Fri", value: 1284 },
  { label: "Sat", value: 1460 },
  { label: "Sun", value: 1190 },
] as const;

function formatChartValue(value: number, valueFormat: "currency" | "number") {
  if (valueFormat === "currency") {
    return `$${value.toLocaleString()}`;
  }

  return value.toLocaleString();
}

export function SalesBarGraph({
  className,
  data = DEFAULT_DATA,
  label,
  color = "#22c55e",
  valueFormat = "currency",
}: {
  className?: string;
  data?: ReadonlyArray<{ label: string; value: number }>;
  label?: string;
  color?: string;
  valueFormat?: "currency" | "number";
}) {
  const chartData = [...data];
  const maxValue = Math.max(...chartData.map((item) => item.value));

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[#ebebeb] bg-white px-4 pt-4 pb-2",
        className,
      )}
    >
      {label ? (
        <p className="mb-2 text-sm text-neutral-500">{label}</p>
      ) : null}
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
            tick={{ fill: "#a3a3a3", fontSize: 11 }}
            dy={4}
          />
          <YAxis hide domain={[0, maxValue * 1.2]} />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={36}>
            <LabelList
              dataKey="value"
              position="top"
              offset={8}
              formatter={(value) => formatChartValue(Number(value), valueFormat)}
              className="fill-neutral-700"
              style={{ fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
