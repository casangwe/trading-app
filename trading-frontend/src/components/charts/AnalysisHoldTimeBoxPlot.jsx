import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Scatter,
} from "recharts";

import { formatCurrency } from "../../func/formatters";

const BoxPlotShape = (props) => {
  const { cx, payload, yAxis, active } = props;
  if (!payload || cx == null || !yAxis?.scale) return null;
  if (!Number(payload.count)) return null;

  const yScale = yAxis.scale;

  const p10 = Number(payload.p10 ?? 0);
  const p25 = Number(payload.p25 ?? 0);
  const med = Number(payload.median ?? 0);
  const p75 = Number(payload.p75 ?? 0);
  const p90 = Number(payload.p90 ?? 0);

  const y10 = yScale(p10);
  const y25 = yScale(p25);
  const y50 = yScale(med);
  const y75 = yScale(p75);
  const y90 = yScale(p90);

  // Match app palette
  const isPos = med >= 0;
  const accentStroke = isPos ? "#4a90e2" : "#f44336";
  const accentFill = isPos ? "rgba(74,144,226,0.14)" : "rgba(244,67,54,0.12)";

  const neutralStroke = "rgba(154,160,166,0.75)"; // soft gray
  const baselineStroke = "#e5e7eb";

  const boxW = 45;
  const half = boxW / 2;

  const capW = 40;
  const capHalf = capW / 2;

  // subtle hover glow
  const glow = active
    ? isPos
      ? "drop-shadow(0px 10px 18px rgba(72, 144, 226, 0.25))"
      : "drop-shadow(0px 10px 18px rgba(244, 67, 54, 0.22))"
    : "none";

  const boxTop = Math.min(y75, y25);
  const boxH = Math.max(3, Math.abs(y25 - y75));

  return (
    <g style={{ filter: glow }}>
      {/* whisker vertical */}
      <line
        x1={cx}
        x2={cx}
        y1={y90}
        y2={y10}
        stroke={neutralStroke}
        strokeWidth="1"
      />

      {/* whisker caps */}
      <line
        x1={cx - capHalf}
        x2={cx + capHalf}
        y1={y90}
        y2={y90}
        stroke={neutralStroke}
        strokeWidth="1"
      />
      <line
        x1={cx - capHalf}
        x2={cx + capHalf}
        y1={y10}
        y2={y10}
        stroke={neutralStroke}
        strokeWidth="1"
      />

      {/* box */}
      <rect
        x={cx - half}
        y={boxTop}
        width={boxW}
        height={boxH}
        fill={accentFill}
        stroke={baselineStroke}
        strokeWidth="1"
        rx="2"
      />

      {/* median line */}
      <line
        x1={cx - half + 2}
        x2={cx + half - 2}
        y1={y50}
        y2={y50}
        stroke={accentStroke}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* tiny dot on median (nice touch, matches dots in your app) */}
      <circle cx={cx} cy={y50} r={2.5} fill={accentStroke} />
    </g>
  );
};

const AnalysisHoldTimeBoxPlot = ({ buckets = [], height = 320 }) => {
  const data = useMemo(() => {
    return (buckets || []).map((b) => ({
      bucket: b.bucket,
      count: Number(b.count || 0),
      p10: Number(b.p10 || 0),
      p25: Number(b.p25 || 0),
      median: Number(b.median || 0),
      p75: Number(b.p75 || 0),
      p90: Number(b.p90 || 0),
      y: Number(b.median || 0), // required for Scatter positioning
    }));
  }, [buckets]);

  const domain = useMemo(() => {
    const nonEmpty = data.filter((d) => d.count > 0);
    if (!nonEmpty.length) return ["auto", "auto"];

    const minY = Math.min(...nonEmpty.map((d) => d.p10));
    const maxY = Math.max(...nonEmpty.map((d) => d.p90));
    const pad = (maxY - minY) * 0.12 || 10;

    return [minY - pad, maxY + pad];
  }, [data]);

  const HEADER_H = 95;
  const chartH = useMemo(() => Math.max(220, (height || 450) - HEADER_H), [height]);

  // const totalTrades = useMemo(() => {
  //   return data.reduce((s, d) => s + (d.count || 0), 0);
  // }, [data]);

  return (
    <div className="analysis-chart">
      <div className="analysis-chart-header" style={{ paddingBottom: 8 }}>
        {/* <div className="investment-summary" style={{ padding: 0, marginBottom: 0 }}>
          <div className="investment-account">PnL by Days Held</div>
          <div className="investment-equity">{totalTrades} trades</div>
          <div className="investment-equity">Box (25–75), whiskers (10–90)</div>
        </div> */}
      </div>

      {!data.length ? (
        <div className="card-error" style={{ padding: "0 16px 16px 16px" }}>
          No hold-time bucket data available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartH}>
          <ComposedChart data={data} margin={{ top: 10, right: 32, left: 32, bottom: 6 }}>
            <XAxis
              dataKey="bucket"
              interval={0}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis domain={domain} hide />

            {/* baseline style matches your bars */}
            <ReferenceLine y={0} stroke="#e5e7eb" />

            <Tooltip
              cursor={false}
              content={({ payload }) => {
                const p = payload?.[0]?.payload;
                if (!p) return null;

                const isPos = Number(p.median || 0) >= 0;

                // Use your TradePnl tooltip class feel
                return (
                  <div
                    className="trade-pnl-tooltip"
                    style={{
                      backgroundColor: isPos ? "#e6f7ff" : "#fdecea",
                      borderColor: isPos ? "#4a90e2" : "#f44336",
                      boxShadow: isPos
                        ? "0 8px 16px rgba(72, 144, 226, 0.3), 0 14px 28px rgba(72, 144, 226, 0.2)"
                        : "0 8px 16px rgba(244, 67, 54, 0.25), 0 14px 28px rgba(244, 67, 54, 0.18)",
                    }}
                  >
                    <p style={{ fontWeight: 700 }}>{p.bucket}</p>
                    <p className="trade-pnl-tooltip-date">Trades: {p.count}</p>
                    <p className="trade-pnl-tooltip-date">
                      Median: {formatCurrency(p.median)}
                    </p>
                    <p className="trade-pnl-tooltip-date">
                      25–75: {formatCurrency(p.p25)} to {formatCurrency(p.p75)}
                    </p>
                    <p className="trade-pnl-tooltip-date">
                      10–90: {formatCurrency(p.p10)} to {formatCurrency(p.p90)}
                    </p>
                  </div>
                );
              }}
            />

            {/* One box plot per bucket */}
            <Scatter
              data={data}
              dataKey="y"
              shape={<BoxPlotShape />}
              isAnimationActive
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default AnalysisHoldTimeBoxPlot;

// import React, { useMemo } from "react";
// import {
//   ResponsiveContainer,
//   ComposedChart,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ReferenceLine,
//   Scatter,
// } from "recharts";

// import { formatCurrency } from "../../func/formatters";

// // Custom SVG box plot renderer per bucket
// const BoxPlotShape = (props) => {
//   const { cx, payload, yAxis } = props;
//   if (!payload || cx == null || !yAxis) return null;

//   const yScale = yAxis.scale;
//   if (!yScale) return null;

//   const p10 = Number(payload.p10 ?? 0);
//   const p25 = Number(payload.p25 ?? 0);
//   const med = Number(payload.median ?? 0);
//   const p75 = Number(payload.p75 ?? 0);
//   const p90 = Number(payload.p90 ?? 0);

//   // Convert values to pixel Y
//   const y10 = yScale(p10);
//   const y25 = yScale(p25);
//   const y50 = yScale(med);
//   const y75 = yScale(p75);
//   const y90 = yScale(p90);

//   // Box width
//   const boxW = 26;
//   const half = boxW / 2;

//   // Whisker cap width
//   const capW = 18;
//   const capHalf = capW / 2;

//   // If empty bucket (count 0), hide
//   if (!Number(payload.count)) return null;

//   return (
//     <g>
//       {/* whisker vertical line */}
//       <line
//         x1={cx}
//         x2={cx}
//         y1={y90}
//         y2={y10}
//         stroke="rgba(154,160,166,0.85)"
//         strokeWidth="2"
//       />

//       {/* whisker caps */}
//       <line
//         x1={cx - capHalf}
//         x2={cx + capHalf}
//         y1={y90}
//         y2={y90}
//         stroke="rgba(154,160,166,0.85)"
//         strokeWidth="2"
//       />
//       <line
//         x1={cx - capHalf}
//         x2={cx + capHalf}
//         y1={y10}
//         y2={y10}
//         stroke="rgba(154,160,166,0.85)"
//         strokeWidth="2"
//       />

//       {/* box (Q1 -> Q3) */}
//       <rect
//         x={cx - half}
//         y={Math.min(y75, y25)}
//         width={boxW}
//         height={Math.max(2, Math.abs(y25 - y75))}
//         fill="rgba(154,160,166,0.18)"
//         stroke="rgba(154,160,166,0.55)"
//         strokeWidth="2"
//         rx="6"
//       />

//       {/* median line */}
//       <line
//         x1={cx - half}
//         x2={cx + half}
//         y1={y50}
//         y2={y50}
//         stroke="rgba(17,24,39,0.9)"
//         strokeWidth="2"
//       />
//     </g>
//   );
// };

// const AnalysisHoldTimeBoxPlot = ({ buckets = [], height = 320 }) => {
//   const data = useMemo(() => {
//     return (buckets || []).map((b) => ({
//       bucket: b.bucket,
//       count: Number(b.count || 0),
//       p10: Number(b.p10 || 0),
//       p25: Number(b.p25 || 0),
//       median: Number(b.median || 0),
//       p75: Number(b.p75 || 0),
//       p90: Number(b.p90 || 0),
//       // scatter needs some numeric y. we’ll use median.
//       y: Number(b.median || 0),
//     }));
//   }, [buckets]);

//   const domain = useMemo(() => {
//     const nonEmpty = data.filter((d) => d.count > 0);
//     if (!nonEmpty.length) return ["auto", "auto"];

//     const minY = Math.min(...nonEmpty.map((d) => d.p10));
//     const maxY = Math.max(...nonEmpty.map((d) => d.p90));
//     const pad = (maxY - minY) * 0.12 || 10;

//     return [minY - pad, maxY + pad];
//   }, [data]);

//   const HEADER_H = 90;
//   const chartH = useMemo(() => Math.max(220, (height || 320) - HEADER_H), [height]);

//   return (
//     <div className="analysis-chart">
//       <div className="analysis-chart-header" style={{ paddingBottom: 8 }}>
//         <div className="investment-summary" style={{ padding: 0, marginBottom: 0 }}>
//           <div className="investment-account">PnL by Days Held</div>
//           <div className="investment-equity">Box (25–75), whiskers (10–90)</div>
//         </div>
//       </div>

//       {!data.length ? (
//         <div className="card-error" style={{ padding: "0 16px 16px 16px" }}>
//           No hold-time bucket data available.
//         </div>
//       ) : (
//         <ResponsiveContainer width="100%" height={chartH}>
//           <ComposedChart data={data} margin={{ top: 10, right: 16, left: 16, bottom: 6 }}>
//             <XAxis dataKey="bucket" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
//             <YAxis domain={domain} hide />
//             <ReferenceLine y={0} stroke="rgba(17,24,39,0.12)" />

//             <Tooltip
//               cursor={false}
//               content={({ payload }) => {
//                 const p = payload?.[0]?.payload;
//                 if (!p) return null;

//                 return (
//                   <div className="tooltip-content">
//                     <p style={{ fontWeight: 700 }}>{p.bucket}</p>
//                     <p className="tooltip-date">Trades: {p.count}</p>
//                     <p className="tooltip-date">Median: {formatCurrency(p.median)}</p>
//                     <p className="tooltip-date">
//                       25–75: {formatCurrency(p.p25)} to {formatCurrency(p.p75)}
//                     </p>
//                     <p className="tooltip-date">
//                       10–90: {formatCurrency(p.p10)} to {formatCurrency(p.p90)}
//                     </p>
//                   </div>
//                 );
//               }}
//             />

//             {/* One scatter point per bucket, but drawn as a full box plot */}
//             <Scatter data={data} dataKey="y" shape={<BoxPlotShape />} isAnimationActive />
//           </ComposedChart>
//         </ResponsiveContainer>
//       )}
//     </div>
//   );
// };

// export default AnalysisHoldTimeBoxPlot;

// // // src/components/charts/AnalysisHoldTimeBoxPlot.jsx

// // import React, { useMemo } from "react";
// // import {
// //   ResponsiveContainer,
// //   ComposedChart,
// //   XAxis,
// //   YAxis,
// //   Tooltip,
// //   ReferenceLine,
// //   ReferenceArea,
// //   Line,
// // } from "recharts";

// // import { formatCurrency } from "../../func/formatters";

// // const AnalysisHoldTimeBoxPlot = ({ buckets = [], height = 450 }) => {
// //   const data = useMemo(() => {
// //     return (buckets || []).map((b) => ({
// //       bucket: b.bucket,
// //       count: Number(b.count || 0),
// //       p10: Number(b.p10 || 0),
// //       p25: Number(b.p25 || 0),
// //       median: Number(b.median || 0),
// //       p75: Number(b.p75 || 0),
// //       p90: Number(b.p90 || 0),
// //     }));
// //   }, [buckets]);

// //   // y-range so it fits nicely
// //   const domain = useMemo(() => {
// //     if (!data.length) return ["auto", "auto"];
// //     const lows = data.map((d) => d.p10);
// //     const highs = data.map((d) => d.p90);
// //     const minY = Math.min(...lows);
// //     const maxY = Math.max(...highs);

// //     // pad 10%
// //     const pad = (maxY - minY) * 0.1 || 10;
// //     return [minY - pad, maxY + pad];
// //   }, [data]);

// //   const HEADER_H = 90;
// //   const chartH = useMemo(() => Math.max(220, (height || 450) - HEADER_H), [height]);

// //   return (
// //     <div className="analysis-chart">
// //       <div className="analysis-chart-header" style={{ paddingBottom: 8 }}>
// //         {/* <div className="investment-summary" style={{ padding: 0, marginBottom: 0 }}>
// //           <div className="investment-account">PnL by Hold Time</div>
// //           <div className="investment-equity">Box (25–75), whiskers (10–90)</div>
// //         </div> */}
// //       </div>

// //       {!data.length ? (
// //         <div className="card-error" style={{ padding: "0 16px 16px 16px" }}>
// //           No hold-time bucket data available.
// //         </div>
// //       ) : (
// //         <ResponsiveContainer width="100%" height={chartH}>
// //           <ComposedChart data={data} margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
// //             <XAxis dataKey="bucket" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
// //             <YAxis domain={domain} hide />
// //             <ReferenceLine y={0} stroke="rgba(17,24,39,0.12)" />

// //             {/* “Box” per bucket: Q1 -> Q3 */}
// //             {data.map((d) => (
// //               <ReferenceArea
// //                 key={d.bucket}
// //                 x1={d.bucket}
// //                 x2={d.bucket}
// //                 y1={d.p25}
// //                 y2={d.p75}
// //                 fill="rgba(154,160,166,0.18)"
// //                 stroke="rgba(154,160,166,0.35)"
// //                 ifOverflow="extendDomain"
// //               />
// //             ))}

// //             {/* Median line across buckets */}
// //             <Line type="monotone" dataKey="median" stroke="#111827" strokeWidth={2} dot={{ r: 3 }} />

// //             {/* Whisker lines (10th/90th) */}
// //             <Line type="monotone" dataKey="p90" stroke="rgba(154,160,166,0.8)" strokeWidth={1} dot={false} />
// //             <Line type="monotone" dataKey="p10" stroke="rgba(154,160,166,0.8)" strokeWidth={1} dot={false} />

// //             <Tooltip
// //               cursor={false}
// //               content={({ payload }) => {
// //                 const p = payload?.[0]?.payload;
// //                 if (!p) return null;

// //                 return (
// //                   <div className="tooltip-content">
// //                     <p style={{ fontWeight: 700 }}>{p.bucket}</p>
// //                     <p className="tooltip-date">Trades: {p.count}</p>
// //                     <p className="tooltip-date">Median: {formatCurrency(p.median)}</p>
// //                     <p className="tooltip-date">25–75: {formatCurrency(p.p25)} to {formatCurrency(p.p75)}</p>
// //                     <p className="tooltip-date">10–90: {formatCurrency(p.p10)} to {formatCurrency(p.p90)}</p>
// //                   </div>
// //                 );
// //               }}
// //             />
// //           </ComposedChart>
// //         </ResponsiveContainer>
// //       )}
// //     </div>
// //   );
// // };

// // export default AnalysisHoldTimeBoxPlot;