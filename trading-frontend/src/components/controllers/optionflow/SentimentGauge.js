import React from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
  ResponsiveContainer,
  Rectangle,
} from "recharts";

const sentimentLabels = {
  "-3": "Strong Bearish",
  "-2": "Bearish",
  "-1": "Weak Bearish",
  0: "Neutral",
  1: "Bullish",
  2: "Accumulation",
  3: "Strong Bullish",
};

const SentimentGauge = ({ score }) => {
  const scoreRange = [-3, -2, -1, 0, 1, 2, 3];
  const data = scoreRange.map((val) => ({ sentiment: val, y: 0 }));

  return (
    <div className="sentiment-chart">
      <ResponsiveContainer width="100%" height={80}>
        <ComposedChart
          data={data}
          margin={{ top: 30, bottom: 10, left: 0, right: 0 }}
        >
          <XAxis
            dataKey="sentiment"
            type="number"
            domain={[-3.1, 3.1]}
            ticks={scoreRange}
            axisLine={{ stroke: "#ccc" }}
            tickLine={false}
            tick={false}
            padding={{ left: 0, right: 0 }}
          />
          <text x="0" y="70" textAnchor="start" fontSize="10px" fill="#666">
            Bearish
          </text>
          <text x="100%" y="70" textAnchor="end" fontSize="10px" fill="#666">
            Bullish
          </text>

          <YAxis hide type="number" domain={[0, 1]} />

          {/* <ReferenceDot
            x={score}
            y={0}
            r={4}
            fill="#4a90e2"
            stroke="#4a90e2"
            isFront
          /> */}

          <ReferenceDot
            x={score}
            y={0}
            isFront
            shape={({ cx, cy }) => (
              <rect
                x={cx - 4}
                y={cy - 12}
                width={8}
                height={24}
                rx={4}
                fill="#4a90e2"
              />
            )}
          />

          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const val = payload[0]?.payload?.sentiment;
                return (
                  <div className="tooltip-content">
                    <p className="amount">{sentimentLabels[val]}</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SentimentGauge;
