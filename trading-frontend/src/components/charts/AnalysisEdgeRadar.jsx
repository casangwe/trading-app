// src/components/charts/AnalysisEdgeRadar.jsx

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));

const AXES = [
  { metric: "Win Rate", score: 0, raw: "0.00%" },
  { metric: "Profit Factor", score: 0, raw: "0.00" },
  { metric: "Expectancy", score: 0, raw: "0.00" },
  { metric: "Payoff", score: 0, raw: "0.00" },
  { metric: "Risk/Reward", score: 0, raw: "0.00" },
  { metric: "Drawdown", score: 0, raw: "0.00%" },
  { metric: "Hold Time", score: 0, raw: "0.00h" },
];

function hasMeaningfulEdgeData(stats) {
  if (!stats) return false;

  const values = [
    stats.win_rate,
    stats.profit_factor,
    stats.expectancy,
    stats.payoff_ratio,
    stats.risk_reward,
    stats.max_drawdown_percent,
    stats.avg_hold_time_hours,
  ];

  return values.some((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n !== 0;
  });
}

function buildEdgeProfile(stats) {
  if (!hasMeaningfulEdgeData(stats)) return AXES;

  const winRate = Number(stats.win_rate ?? 0);

  const profitFactorRaw = Number(stats.profit_factor ?? 0);
  const profitFactorScore = clamp((profitFactorRaw / 3) * 100);

  const expectancyRaw = Number(stats.expectancy ?? 0);
  const expectancyScore = clamp(50 + 50 * Math.tanh(expectancyRaw / 50));

  const payoffRaw = Number(stats.payoff_ratio ?? 0);
  const payoffScore = clamp((payoffRaw / 3) * 100);

  const rrRaw = Number(stats.risk_reward ?? 0);
  const rrScore = clamp(100 - (Math.min(rrRaw, 3) / 3) * 100);

  const ddRaw = Math.abs(Number(stats.max_drawdown_percent ?? 0));
  const ddScore = clamp(100 - (Math.min(ddRaw, 50) / 50) * 100);

  const holdRaw = Number(stats.avg_hold_time_hours ?? 0);
  const holdScore = clamp(100 - (Math.min(Math.abs(holdRaw), 24) / 24) * 100);

  return [
    { metric: "Win Rate", score: clamp(winRate), raw: `${winRate.toFixed(2)}%` },
    { metric: "Profit Factor", score: profitFactorScore, raw: profitFactorRaw.toFixed(2) },
    { metric: "Expectancy", score: expectancyScore, raw: expectancyRaw.toFixed(2) },
    { metric: "Payoff", score: payoffScore, raw: payoffRaw.toFixed(2) },
    { metric: "Risk/Reward", score: rrScore, raw: rrRaw.toFixed(2) },
    { metric: "Drawdown", score: ddScore, raw: `${ddRaw.toFixed(2)}%` },
    { metric: "Hold Time", score: holdScore, raw: `${holdRaw.toFixed(2)}h` },
  ];
}

const AnalysisEdgeRadar = ({ stats, height = 300 }) => {
  const hasData = useMemo(() => hasMeaningfulEdgeData(stats), [stats]);
  const data = useMemo(() => buildEdgeProfile(stats), [stats]);

  return (
    <div className="analysis-chart" style={{ display: "flex", justifyContent: "center" }}>
      <ResponsiveContainer
        width="100%"
        height={height}
        style={{ maxWidth: 520, margin: "0 auto" }}
      >
        <RadarChart
          data={data}
          margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
        >
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />

          {hasData && (
            <Tooltip
              cursor={false}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const p = payload[0]?.payload;
                if (!p) return null;

                return (
                  <div className="tooltip-content">
                    <p style={{ fontWeight: 600 }}>{p.metric}</p>
                    <p className="tooltip-date">Score: {Number(p.score).toFixed(0)} / 100</p>
                    <p className="tooltip-date">Raw: {p.raw}</p>
                  </div>
                );
              }}
            />
          )}

          {hasData && (
            <Radar
              name="Edge"
              dataKey="score"
              stroke="#4a90e2"
              fill="rgba(74,144,226,0.22)"
              strokeWidth={2}
              isAnimationActive
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalysisEdgeRadar;

// // src/components/charts/AnalysisEdgeRadar.jsx

// import React, { useMemo } from "react";
// import {
//   ResponsiveContainer,
//   RadarChart,
//   PolarGrid,
//   PolarAngleAxis,
//   PolarRadiusAxis,
//   Radar,
//   Tooltip,
// } from "recharts";

// const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));

// /**
//  * Heuristic scoring (0–100) so RadarChart is meaningful.
//  * Tooltip shows raw values so you never lose truth.
//  */
// function buildEdgeProfile(stats) {
//   if (!stats) return [];

//   const winRate = Number(stats.win_rate ?? 0); // already 0-100

//   // profit_factor: > 1 good. cap at 3.0 for scoring.
//   const profitFactorRaw = Number(stats.profit_factor ?? 0);
//   const profitFactorScore = clamp((profitFactorRaw / 3) * 100);

//   // expectancy: can be negative/positive (dollars). Use tanh-ish scaling so big values don't dominate.
//   const expectancyRaw = Number(stats.expectancy ?? 0);
//   // scale: +/-50 feels meaningful; adjust if you want it more/less sensitive
//   const expectancyScore = clamp(50 + 50 * Math.tanh(expectancyRaw / 50));

//   // payoff_ratio: avg win / abs(avg loss (higher better). cap at 3.
//   const payoffRaw = Number(stats.payoff_ratio ?? 0);
//   const payoffScore = clamp((payoffRaw / 3) * 100);

//   // risk_reward: abs(avg loss) / avg win (lower is better). cap at 3.
//   const rrRaw = Number(stats.risk_reward ?? 0);
//   const rrScore = clamp(100 - (Math.min(rrRaw, 3) / 3) * 100);

//   // max_drawdown_percent: smaller is better. cap at 50%
//   const ddRaw = Math.abs(Number(stats.max_drawdown_percent ?? 0));
//   const ddScore = clamp(100 - (Math.min(ddRaw, 50) / 50) * 100);

//   // hold time: depends on your strategy. We'll treat "shorter is better" by default.
//   // cap at 24h for scoring (0h => 100, 24h+ => 0)
//   const holdRaw = Number(stats.avg_hold_time_hours ?? 0);
//   const holdScore = clamp(100 - (Math.min(Math.abs(holdRaw), 24) / 24) * 100);

//   return [
//     { metric: "Win Rate", score: clamp(winRate), raw: `${winRate.toFixed(2)}%` },
//     { metric: "Profit Factor", score: profitFactorScore, raw: profitFactorRaw.toFixed(2) },
//     { metric: "Expectancy", score: expectancyScore, raw: expectancyRaw.toFixed(2) },
//     { metric: "Payoff", score: payoffScore, raw: payoffRaw.toFixed(2) },
//     { metric: "Risk/Reward", score: rrScore, raw: rrRaw.toFixed(2) },
//     { metric: "Drawdown", score: ddScore, raw: `${ddRaw.toFixed(2)}%` },
//     { metric: "Hold Time", score: holdScore, raw: `${holdRaw.toFixed(2)}h` },
//   ];
// }

// /**
//  * AnalysisEdgeRadar
//  * - Radar view of trading "edge profile"
//  *
//  * Props:
//  *  - stats: object from /dashboard/stats
//  *  - height?: number
//  */
// const AnalysisEdgeRadar = ({ stats, height = 300 }) => {
//   const data = useMemo(() => buildEdgeProfile(stats), [stats]);

//   return (
//     <div className="analysis-chart" style={{ display: "flex", justifyContent: "center" }}>
//       {!data.length ? (
//         <div className="card-error" style={{ padding: "0 16px 16px 16px" }}>
//           No stats available.
//         </div>
//       ) : (
//         <ResponsiveContainer
//           width="100%"
//           height={height}
//           style={{ maxWidth: 520, margin: "0 auto" }}
//         >
//           <RadarChart
//             data={data}
//             margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
//           >
//             <PolarGrid />
//             <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
//             <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />

//             <Tooltip
//               cursor={false}
//               content={({ payload }) => {
//                 if (!payload?.length) return null;
//                 const p = payload[0]?.payload;
//                 if (!p) return null;

//                 return (
//                   <div className="tooltip-content">
//                     <p style={{ fontWeight: 600 }}>{p.metric}</p>
//                     <p className="tooltip-date">Score: {Number(p.score).toFixed(0)} / 100</p>
//                     <p className="tooltip-date">Raw: {p.raw}</p>
//                   </div>
//                 );
//               }}
//             />

//             <Radar
//               name="Edge"
//               dataKey="score"
//               stroke="#4a90e2"
//               fill="rgba(74,144,226,0.22)"
//               strokeWidth={2}
//               isAnimationActive
//             />
//           </RadarChart>
//         </ResponsiveContainer>
//       )}
//     </div>
//   );
// };

// export default AnalysisEdgeRadar;


// // // src/components/charts/AnalysisEdgeRadar.jsx

// // import React, { useMemo } from "react";
// // import {
// //   ResponsiveContainer,
// //   RadarChart,
// //   PolarGrid,
// //   PolarAngleAxis,
// //   PolarRadiusAxis,
// //   Radar,
// //   Tooltip,
// // } from "recharts";

// // const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));

// // /**
// //  * Heuristic scoring (0–100) so RadarChart is meaningful.
// //  * Tooltip shows raw values so you never lose truth.
// //  */
// // function buildEdgeProfile(stats) {
// //   if (!stats) return [];

// //   const winRate = Number(stats.win_rate ?? 0); // already 0-100

// //   // profit_factor: > 1 good. cap at 3.0 for scoring.
// //   const profitFactorRaw = Number(stats.profit_factor ?? 0);
// //   const profitFactorScore = clamp((profitFactorRaw / 3) * 100);

// //   // expectancy: can be negative/positive (dollars). Use tanh-ish scaling so big values don't dominate.
// //   const expectancyRaw = Number(stats.expectancy ?? 0);
// //   // scale: +/-50 feels meaningful; adjust if you want it more/less sensitive
// //   const expectancyScore = clamp(50 + 50 * Math.tanh(expectancyRaw / 50));

// //   // payoff_ratio: avg win / abs(avg loss (higher better). cap at 3.
// //   const payoffRaw = Number(stats.payoff_ratio ?? 0);
// //   const payoffScore = clamp((payoffRaw / 3) * 100);

// //   // risk_reward: abs(avg loss) / avg win (lower is better). cap at 3.
// //   const rrRaw = Number(stats.risk_reward ?? 0);
// //   const rrScore = clamp(100 - (Math.min(rrRaw, 3) / 3) * 100);

// //   // max_drawdown_percent: smaller is better. cap at 50%
// //   const ddRaw = Math.abs(Number(stats.max_drawdown_percent ?? 0));
// //   const ddScore = clamp(100 - (Math.min(ddRaw, 50) / 50) * 100);

// //   // hold time: depends on your strategy. We'll treat "shorter is better" by default.
// //   // cap at 24h for scoring (0h => 100, 24h+ => 0)
// //   const holdRaw = Number(stats.avg_hold_time_hours ?? 0);
// //   const holdScore = clamp(100 - (Math.min(Math.abs(holdRaw), 24) / 24) * 100);

// //   return [
// //     { metric: "Win Rate", score: clamp(winRate), raw: `${winRate.toFixed(2)}%` },
// //     { metric: "Profit Factor", score: profitFactorScore, raw: profitFactorRaw.toFixed(2) },
// //     { metric: "Expectancy", score: expectancyScore, raw: expectancyRaw.toFixed(2) },
// //     { metric: "Payoff", score: payoffScore, raw: payoffRaw.toFixed(2) },
// //     { metric: "Risk/Reward", score: rrScore, raw: rrRaw.toFixed(2) },
// //     { metric: "Drawdown", score: ddScore, raw: `${ddRaw.toFixed(2)}%` },
// //     { metric: "Hold Time", score: holdScore, raw: `${holdRaw.toFixed(2)}h` },
// //   ];
// // }

// // /**
// //  * AnalysisEdgeRadar
// //  * - Radar view of trading "edge profile"
// //  *
// //  * Props:
// //  *  - stats: object from /dashboard/stats
// //  *  - height?: number
// //  */
// // const AnalysisEdgeRadar = ({ stats, height = 300 }) => {
// //   const data = useMemo(() => buildEdgeProfile(stats), [stats]);

// //   return (
// //     <div className="analysis-chart">
// //       {/* <div className="analysis-chart-header" style={{ paddingBottom: 8 }}>
// //         <div className="analysis-chart-title">Edge Profile</div>
// //         <div className="analysis-chart-subtitle">
// //           Higher score = stronger edge (tooltip shows raw values)
// //         </div>
// //       </div> */}

// //       {!data.length ? (
// //         <div className="card-error" style={{ padding: "0 16px 16px 16px" }}>
// //           No stats available.
// //         </div>
// //       ) : (
// //         <ResponsiveContainer width="100%" height={height}>
// //           <RadarChart data={data} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
// //             <PolarGrid />
// //             <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
// //             <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />

// //             <Tooltip
// //               cursor={false}
// //               content={({ payload }) => {
// //                 if (!payload?.length) return null;
// //                 const p = payload[0]?.payload;
// //                 if (!p) return null;

// //                 return (
// //                   <div className="tooltip-content">
// //                     <p style={{ fontWeight: 600 }}>{p.metric}</p>
// //                     <p className="tooltip-date">Score: {Number(p.score).toFixed(0)} / 100</p>
// //                     <p className="tooltip-date">Raw: {p.raw}</p>
// //                   </div>
// //                 );
// //               }}
// //             />

// //             <Radar
// //               name="Edge"
// //               dataKey="score"
// //               stroke="#4a90e2"
// //               fill="rgba(74,144,226,0.22)"
// //               strokeWidth={2}
// //               isAnimationActive
// //             />
// //           </RadarChart>
// //         </ResponsiveContainer>
// //       )}
// //     </div>
// //   );
// // };

// // export default AnalysisEdgeRadar;


// // // src/components/analysis/AnalysisEdgeRadar.jsx

// // import React, { useMemo } from "react";
// // import {
// //   RadarChart,
// //   Radar,
// //   PolarGrid,
// //   PolarAngleAxis,
// //   PolarRadiusAxis,
// //   ResponsiveContainer,
// //   Tooltip,
// // } from "recharts";

// // /**
// //  * AnalysisEdgeRadar
// //  * - Radar that summarizes "edge" quality (normalized 0-100)
// //  * - Uses /dashboard/stats fields
// //  *
// //  * Props:
// //  *  - stats: dashboard stats object
// //  *  - height?: number (default 300)
// //  */
// // const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
// // const toScore = (val, min, max) => {
// //   const v = clamp(val, min, max);
// //   return ((v - min) / (max - min)) * 100;
// // };

// // const AnalysisEdgeRadar = ({ stats, height = 300 }) => {
// //   const data = useMemo(() => {
// //     if (!stats) return [];

// //     const winRate = Number(stats.win_rate || 0); // 0-100
// //     const profitFactor = Number(stats.profit_factor || 0); // typical 0-3+
// //     const expectancy = Number(stats.expectancy || 0); // depends on sizing, clamp
// //     const payoff = Number(stats.payoff_ratio || 0); // typical 0-3+
// //     const riskReward = Number(stats.risk_reward || 0); // lower better
// //     const maxDD = Math.abs(Number(stats.max_drawdown_percent || 0)); // lower better

// //     // normalize to 0-100 scores (sane clamps)
// //     const scores = [
// //       { metric: "Win Rate", score: clamp(winRate, 0, 100) },
// //       { metric: "Profit Factor", score: toScore(profitFactor, 0, 3) },
// //       { metric: "Expectancy", score: toScore(expectancy, -100, 100) },
// //       { metric: "Payoff", score: toScore(payoff, 0, 3) },
// //       // invert: lower riskReward is better (0.5 is great, 3 is poor)
// //       { metric: "Risk/Reward", score: 100 - toScore(riskReward, 0.5, 3) },
// //       // invert drawdown: 0% best, 50% terrible
// //       { metric: "Drawdown", score: 100 - toScore(maxDD, 0, 50) },
// //     ];

// //     return scores.map((s) => ({
// //       metric: s.metric,
// //       score: clamp(s.score, 0, 100),
// //     }));
// //   }, [stats]);

// //   return (
// //     <div className="analysis-chart">
// //       <div className="analysis-chart-header">
// //         <div className="analysis-chart-title">Edge Profile</div>
// //         <div className="analysis-chart-subtitle">0–100 (normalized)</div>
// //       </div>

// //       <ResponsiveContainer width="100%" height={height}>
// //         <RadarChart data={data}>
// //           <PolarGrid />
// //           <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
// //           <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

// //           <Tooltip
// //             cursor={false}
// //             content={({ payload }) => {
// //               if (!payload || !payload.length) return null;
// //               const p = payload[0].payload;
// //               return (
// //                 <div className="tooltip-content">
// //                   <p>{p.metric}</p>
// //                   <p className="tooltip-date">{Math.round(p.score)} / 100</p>
// //                 </div>
// //               );
// //             }}
// //           />

// //           <Radar
// //             dataKey="score"
// //             stroke="#4a90e2"
// //             fill="rgba(74, 144, 226, 0.25)"
// //             strokeWidth={2}
// //             isAnimationActive
// //           />
// //         </RadarChart>
// //       </ResponsiveContainer>
// //     </div>
// //   );
// // };

// // export default AnalysisEdgeRadar;
