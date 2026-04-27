"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { useTheme } from "@/contexts/ThemeContext";

interface MiniChartProps {
  data: { date: string; minutes: number }[];
  type?: "line" | "bar";
  height?: number;
  showAxis?: boolean;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
          {label}
        </p>
        <p className="text-sm font-light text-foreground">
          {payload[0].value} <span className="text-muted-foreground text-xs">min</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function MiniChart({
  data,
  type = "line",
  height = 200,
  showAxis = true,
}: MiniChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const lineColor = isDark ? "#ffffff" : "#111111";
  const gridColor = isDark ? "#1a1a1a" : "#e5e5e5";
  const axisColor = isDark ? "#444" : "#999";

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          {showAxis && (
            <>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: axisColor }}
                axisLine={{ stroke: gridColor }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: axisColor }}
                axisLine={false}
                tickLine={false}
              />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="minutes"
            fill={lineColor}
            radius={[4, 4, 0, 0]}
            maxBarSize={12}
            opacity={0.7}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        {showAxis && (
          <>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: axisColor }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: axisColor }}
              axisLine={false}
              tickLine={false}
            />
          </>
        )}
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="minutes"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          activeDot={{
            r: 4,
            fill: lineColor,
            stroke: isDark ? "#000" : "#fff",
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
