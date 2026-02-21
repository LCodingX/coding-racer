"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { RaceHistoryEntry } from "@/lib/types";

interface CPMChartProps {
  races: RaceHistoryEntry[];
  averageCPM: number;
}

export default function CPMChart({ races, averageCPM }: CPMChartProps) {
  const data = [...races]
    .reverse()
    .map((race, index) => ({
      name: `Race ${index + 1}`,
      cpm: race.cpm,
      accuracy: race.accuracy,
    }));

  if (data.length === 0) {
    return (
      <div className="bg-navy/60 rounded-lg p-6 text-center text-editor-comment">
        No race history yet. Play some races!
      </div>
    );
  }

  return (
    <div className="bg-navy/60 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-editor-text mb-4">
        CPM History (Last 10 Races)
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#45475a" />
          <XAxis dataKey="name" stroke="#6c7086" fontSize={12} />
          <YAxis stroke="#6c7086" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e1e2e",
              border: "1px solid #45475a",
              borderRadius: "8px",
              color: "#cdd6f4",
            }}
          />
          <ReferenceLine
            y={averageCPM}
            stroke="#e8a317"
            strokeDasharray="5 5"
            label={{
              value: `Avg: ${Math.round(averageCPM)}`,
              fill: "#e8a317",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="cpm"
            stroke="#2ecc71"
            strokeWidth={2}
            dot={{ fill: "#2ecc71", r: 4 }}
            activeDot={{ r: 6, fill: "#2ecc71" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
