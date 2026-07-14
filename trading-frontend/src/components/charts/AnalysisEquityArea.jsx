// src/components/charts/AnalysisEquityArea.jsx

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { formatCurrency, formatDate } from "../../func/formatters";

const AnalysisEquityArea = ({ analysis = null, height = 400 }) => {
  const chartData = useMemo(() => {
    const equity = analysis?.equity || [];
    const ideal = analysis?.ideal_line || [];

    if (!equity.length || !ideal.length) return [];

    const n = Math.min(equity.length, ideal.length);

    return Array.from({ length: n }).map((_, i) => {
      const eq = Number(equity[i]?.value || 0);
      const id = Number(ideal[i]?.value || 0);
      const delta = eq - id;

      return {
        date: formatDate(equity[i].date),
        equity: eq,
        ideal: id,
        idealBase: id,
        posDelta: delta > 0 ? delta : 0,
        negDelta: delta < 0 ? delta : 0,
      };
    });
  }, [analysis]);

  const tradeCount = useMemo(() => {
    const n = analysis?.trade_count ?? analysis?.tradeCount ?? analysis?.total_trades ?? 0;
    return Number(n || 0);
  }, [analysis]);

  const HEADER_H = 110;
  const chartH = useMemo(() => {
    const base = Number(height || 400);
    return Math.max(180, base - HEADER_H);
  }, [height]);

  if (!chartData.length) return null;

  return (
    <div className="analysis-chart">
      <div className="analysis-chart-header">
        <div className="investment-summary" style={{ padding: 0, marginBottom: 0 }}>
          <div className="investment-account">{tradeCount}</div>

          <div className="investment-equity">Wins {analysis?.wins ?? 0}</div>
          <div className="investment-equity">Losses {analysis?.losses ?? 0}</div>

          <div
            className={`investment-roi ${
              (analysis?.win_rate ?? 0) >= 50 ? "positive" : "negative"
            }`}
          >
            Win Rate: {Number(analysis?.win_rate ?? 0).toFixed(1)}%
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartH}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide />

          <Tooltip
            cursor={false}
            content={({ payload }) => {
              if (!payload || !payload.length) return null;
              const p = payload[0]?.payload;
              if (!p) return null;

              const diff = (p.equity || 0) - (p.ideal || 0);

              return (
                <div className="tooltip-content">
                  <p>{formatCurrency(p.equity)}</p>
                  <p className="tooltip-date">{p.date}</p>
                  <p className="tooltip-date">Ideal: {formatCurrency(p.ideal)}</p>
                  <p className="tooltip-date">
                    Diff: {diff >= 0 ? "+" : ""}
                    {formatCurrency(diff)}
                  </p>
                </div>
              );
            }}
          />

          <Area
            type="monotone"
            dataKey="idealBase"
            stackId="band"
            stroke="none"
            fill="rgba(0,0,0,0)"
            isAnimationActive
          />

          <Area
            type="monotone"
            dataKey="posDelta"
            stackId="band"
            stroke="none"
            fill="rgba(74,144,226,0.22)"
            isAnimationActive
          />

          <Area
            type="monotone"
            dataKey="negDelta"
            stackId="band"
            stroke="none"
            fill="rgba(214,40,40,0.20)"
            isAnimationActive
          />

          <Line type="monotone" dataKey="ideal" stroke="#9aa0a6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="equity" stroke="#4a90e2" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalysisEquityArea;

