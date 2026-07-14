// src/components/charts/AnalysisWeekdayLine.jsx

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

import { formatCurrency } from "../../func/formatters";

const ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const LABEL = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri" };

const AnalysisWeekdayLine = ({ pnlByWeekday = {}, height = 260 }) => {
  const data = useMemo(() => {
    return ORDER.map((day) => ({
      day,
      label: LABEL[day],
      pnl: Number(pnlByWeekday?.[day] ?? 0),
    }));
  }, [pnlByWeekday]);


  return (
    <div className="analysis-chart">
      <div className="analysis-chart-header" style={{ paddingBottom: 8 }}>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 6, right: 16, left: 16, bottom: 4 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <ReferenceLine y={0} stroke="rgba(17,24,39,0.10)" />

          <Tooltip
            cursor={false}
            content={({ payload }) => {
              if (!payload?.length) return null;
              const p = payload[0]?.payload;
              if (!p) return null;

              return (
                <div className="tooltip-content">
                  <p style={{ fontWeight: 600 }}>{p.day}</p>
                  <p className="tooltip-date">PnL: {formatCurrency(p.pnl)}</p>
                </div>
              );
            }}
          />

          <Line
            type="monotone"
            dataKey="pnl"
            stroke="#4a90e2"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalysisWeekdayLine;
