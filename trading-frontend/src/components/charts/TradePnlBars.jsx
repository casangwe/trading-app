// src/components/charts/TradePnlBars.jsx

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

import { formatCurrency } from "../../func/formatters";

const TradePnlBars = ({
  summary = null,
  range = "1M",
  onRangeChange,
  data = null,
  error = null,
}) => {
  const bars = useMemo(() => {
    if (!data || !Array.isArray(data.bars)) return [];
    return data.bars.map((b, idx) => ({
      i: idx,
      label: b.label ?? "",
      pnl: Number(b.pnl || 0),
      tradeCount: Number(b.trade_count || 0),
      start: b.start,
      end: b.end,
    }));
  }, [data]);

  const totalPnl = useMemo(() => {
    return bars.reduce((sum, b) => sum + (Number.isFinite(b.pnl) ? b.pnl : 0), 0);
  }, [bars]);

  const pnlClass = totalPnl >= 0 ? "positive" : "negative";

  if (error) {
    return (
      <div className="investment-chart">
        <div className="error-message">
          {String(error?.message || error || "Failed to load realized P&L.")}
        </div>
      </div>
    );
  }

  return (
    <div className="investment-chart pnl-bars-layout">
      {summary && (
        <div className="investment-summary pnl-bars-summary">
          <div className="investment-account">{summary.tradeCount ?? 0}</div>

          <div className="investment-equity">Wins {summary.wins ?? 0}</div>
          <div className="investment-equity">Losses {summary.losses ?? 0}</div>

          <div
            className={`investment-roi ${
              (summary.winRate ?? 0) >= 50 ? "positive" : "negative"
            }`}
          >
            Win Rate: {Number(summary.winRate ?? 0).toFixed(1)}%
          </div>

          <div className={`investment-roi ${pnlClass}`}>
            PnL: {formatCurrency(totalPnl)}
          </div>
        </div>
      )}

      <div className="pnl-bars-chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={false} axisLine={false} />
            <YAxis hide />
            <ReferenceLine y={0} stroke="#e5e7eb" />

            <Tooltip
              cursor={false}
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const p = payload[0].payload;
                return (
                  <div className="trade-pnl-tooltip">
                    <p>{formatCurrency(p.pnl)}</p>
                    <p className="trade-pnl-tooltip-date">{p.label}</p>
                    <p className="trade-pnl-tooltip-date">Trades: {p.tradeCount}</p>
                  </div>
                );
              }}
            />

            <Bar
              dataKey="pnl"
              radius={[5, 5, 5, 5]}
              barSize={55}
              isAnimationActive
              animationBegin={0}
              animationDuration={700}
              animationEasing="ease-out"
            >
              {bars.map((b) => (
                <Cell key={b.i} fill={b.pnl >= 0 ? "#4a90e2" : "#f44336"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="tab-container tab-container-bottom-left pnl-bars-tabs">
        <button
          type="button"
          className={`tab-button ${range === "1W" ? "active" : ""}`}
          onClick={() => onRangeChange?.("1W")}
        >
          1W
        </button>
        <button
          type="button"
          className={`tab-button ${range === "1M" ? "active" : ""}`}
          onClick={() => onRangeChange?.("1M")}
        >
          1M
        </button>
        <button
          type="button"
          className={`tab-button ${range === "1Y" ? "active" : ""}`}
          onClick={() => onRangeChange?.("1Y")}
        >
          1Y
        </button>
      </div>
    </div>
  );
};

export default TradePnlBars;

// // src/components/charts/TradePnlBars.jsx

// import React, { useMemo } from "react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   Cell,
//   ReferenceLine,
// } from "recharts";

// import { formatCurrency } from "../../func/formatters";

// const TradePnlBars = ({
//   summary = null,
//   range = "1M",
//   onRangeChange,
//   data = null,
//   error = null,
// }) => {
//   const bars = useMemo(() => {
//     if (!data || !Array.isArray(data.bars)) return [];
//     return data.bars.map((b, idx) => ({
//       i: idx,
//       label: b.label ?? "",
//       pnl: Number(b.pnl || 0),
//       tradeCount: Number(b.trade_count || 0),
//       start: b.start,
//       end: b.end,
//     }));
//   }, [data]);

//   const totalPnl = useMemo(() => {
//     return bars.reduce((sum, b) => sum + (Number.isFinite(b.pnl) ? b.pnl : 0), 0);
//   }, [bars]);

//   const pnlClass = totalPnl >= 0 ? "positive" : "negative";

//   if (error) {
//     return (
//       <div className="investment-chart">
//         <div className="error-message">
//           {String(error?.message || error || "Failed to load realized P&L.")}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="investment-chart pnl-bars-layout">
//       {summary && (
//         <div className="investment-summary pnl-bars-summary">
//           <div className="investment-account">{summary.tradeCount ?? 0}</div>

//           <div className="investment-equity">Wins {summary.wins ?? 0}</div>
//           <div className="investment-equity">Losses {summary.losses ?? 0}</div>

//           <div
//             className={`investment-roi ${
//               (summary.winRate ?? 0) >= 50 ? "positive" : "negative"
//             }`}
//           >
//             Win Rate: {Number(summary.winRate ?? 0).toFixed(1)}%
//           </div>

//           <div className={`investment-roi ${pnlClass}`}>
//             PnL: {formatCurrency(totalPnl)}
//           </div>
//         </div>
//       )}

//       <div className="pnl-bars-chart-area">
//         <ResponsiveContainer width="100%" height="100%">
//           <BarChart data={bars} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
//             <XAxis dataKey="label" tick={false} axisLine={false} />
//             <YAxis hide />
//             <ReferenceLine y={0} stroke="#e5e7eb" />

//             <Tooltip
//               cursor={false}
//               content={({ payload }) => {
//                 if (!payload || !payload.length) return null;
//                 const p = payload[0].payload;
//                 return (
//                   <div className="trade-pnl-tooltip">
//                     <p>{formatCurrency(p.pnl)}</p>
//                     <p className="trade-pnl-tooltip-date">{p.label}</p>
//                     <p className="trade-pnl-tooltip-date">Trades: {p.tradeCount}</p>
//                   </div>
//                 );
//               }}
//             />

//             <Bar
//               dataKey="pnl"
//               radius={[5, 5, 5, 5]}
//               barSize={55}
//               isAnimationActive
//               animationBegin={0}
//               animationDuration={700}
//               animationEasing="ease-out"
//             >
//               {bars.map((b) => (
//                 <Cell key={b.i} fill={b.pnl >= 0 ? "#4a90e2" : "#f44336"} />
//               ))}
//             </Bar>
//           </BarChart>
//         </ResponsiveContainer>
//       </div>

//       <div className="tab-container tab-container-bottom-left pnl-bars-tabs">
//         <button
//           type="button"
//           className={`tab-button ${range === "1W" ? "active" : ""}`}
//           onClick={() => onRangeChange?.("1W")}
//         >
//           1W
//         </button>
//         <button
//           type="button"
//           className={`tab-button ${range === "1M" ? "active" : ""}`}
//           onClick={() => onRangeChange?.("1M")}
//         >
//           1M
//         </button>
//         <button
//           type="button"
//           className={`tab-button ${range === "1Y" ? "active" : ""}`}
//           onClick={() => onRangeChange?.("1Y")}
//         >
//           1Y
//         </button>
//       </div>
//     </div>
//   );
// };

// export default TradePnlBars;
// // // src/components/charts/TradePnlBars.jsx

// // import React, { useEffect, useMemo, useState } from "react";
// // import {
// //   BarChart,
// //   Bar,
// //   XAxis,
// //   YAxis,
// //   Tooltip,
// //   ResponsiveContainer,
// //   Cell,
// //   ReferenceLine,
// // } from "recharts";

// // import { useRealizedPnl } from "../../hooks/useRealizedPnl";
// // import { formatCurrency } from "../../func/formatters";

// // const MIN_READY_DELAY_MS = 1000;

// // const TradePnlBars = ({ summary = null }) => {
// //   const { range, setRange, data, error } = useRealizedPnl("1M");
// //   const [chartReady, setChartReady] = useState(false);

// //   useEffect(() => {
// //     let t = null;
// //     setChartReady(false);

// //     if (error) return;

// //     const hasBars = !!data && Array.isArray(data.bars) && data.bars.length > 0;
// //     if (!hasBars) return;

// //     t = setTimeout(() => {
// //       setChartReady(true);
// //     }, MIN_READY_DELAY_MS);

// //     return () => {
// //       if (t) clearTimeout(t);
// //     };
// //   }, [data, error, range]);

// //   const bars = useMemo(() => {
// //     if (!data || !Array.isArray(data.bars)) return [];
// //     return data.bars.map((b, idx) => ({
// //       i: idx,
// //       label: b.label ?? "",
// //       pnl: Number(b.pnl || 0),
// //       tradeCount: Number(b.trade_count || 0),
// //       start: b.start,
// //       end: b.end,
// //     }));
// //   }, [data]);

// //   const totalPnl = useMemo(() => {
// //     return bars.reduce((sum, b) => sum + (Number.isFinite(b.pnl) ? b.pnl : 0), 0);
// //   }, [bars]);

// //   const pnlClass = totalPnl >= 0 ? "positive" : "negative";

// //   if (error) {
// //     return (
// //       <div className="investment-chart">
// //         <div className="error-message">
// //           {String(error?.message || error || "Failed to load realized P&L.")}
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="investment-chart pnl-bars-layout">
// //       {summary && (
// //         <div className="investment-summary pnl-bars-summary">
// //           <div className="investment-account">{summary.tradeCount ?? 0}</div>

// //           <div className="investment-equity">Wins {summary.wins ?? 0}</div>
// //           <div className="investment-equity">Losses {summary.losses ?? 0}</div>

// //           <div
// //             className={`investment-roi ${
// //               (summary.winRate ?? 0) >= 50 ? "positive" : "negative"
// //             }`}
// //           >
// //             Win Rate: {Number(summary.winRate ?? 0).toFixed(1)}%
// //           </div>

// //           <div className={`investment-roi ${pnlClass}`}>
// //             PnL: {formatCurrency(totalPnl)}
// //           </div>
// //         </div>
// //       )}

// //       <div className="pnl-bars-chart-area">
// //         {chartReady ? (
// //           <ResponsiveContainer width="100%" height="100%">
// //             <BarChart data={bars} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
// //               <XAxis dataKey="label" tick={false} axisLine={false} />
// //               <YAxis hide />
// //               <ReferenceLine y={0} stroke="#e5e7eb" />

// //               <Tooltip
// //                 cursor={false}
// //                 content={({ payload }) => {
// //                   if (!payload || !payload.length) return null;
// //                   const p = payload[0].payload;
// //                   return (
// //                     <div className="trade-pnl-tooltip">
// //                       <p>{formatCurrency(p.pnl)}</p>
// //                       <p className="trade-pnl-tooltip-date">{p.label}</p>
// //                       <p className="trade-pnl-tooltip-date">Trades: {p.tradeCount}</p>
// //                     </div>
// //                   );
// //                 }}
// //               />

// //               <Bar
// //                 dataKey="pnl"
// //                 radius={[5, 5, 5, 5]}
// //                 barSize={55}
// //                 isAnimationActive
// //                 animationBegin={0}
// //                 animationDuration={700}
// //                 animationEasing="ease-out"
// //               >
// //                 {bars.map((b) => (
// //                   <Cell key={b.i} fill={b.pnl >= 0 ? "#4a90e2" : "#f44336"} />
// //                 ))}
// //               </Bar>
// //             </BarChart>
// //           </ResponsiveContainer>
// //         ) : null}
// //       </div>

// //       <div className="tab-container tab-container-bottom-left pnl-bars-tabs">
// //         <button
// //           type="button"
// //           className={`tab-button ${range === "1W" ? "active" : ""}`}
// //           onClick={() => setRange("1W")}
// //         >
// //           1W
// //         </button>
// //         <button
// //           type="button"
// //           className={`tab-button ${range === "1M" ? "active" : ""}`}
// //           onClick={() => setRange("1M")}
// //         >
// //           1M
// //         </button>
// //         <button
// //           type="button"
// //           className={`tab-button ${range === "1Y" ? "active" : ""}`}
// //           onClick={() => setRange("1Y")}
// //         >
// //           1Y
// //         </button>
// //       </div>
// //     </div>
// //   );
// // };

// // export default TradePnlBars;

// // // // src/components/charts/TradePnlBars.jsx

// // // import React, { useMemo } from "react";
// // // import {
// // //   BarChart,
// // //   Bar,
// // //   XAxis,
// // //   YAxis,
// // //   Tooltip,
// // //   ResponsiveContainer,
// // //   Cell,
// // //   ReferenceLine,
// // // } from "recharts";

// // // import { useRealizedPnl } from "../../hooks/useRealizedPnl";
// // // import { formatCurrency } from "../../func/formatters";

// // // const TradePnlBars = ({ summary = null }) => {
// // //   const { range, setRange, data, error } = useRealizedPnl("1M");

// // //   const bars = useMemo(() => {
// // //     if (!data || !Array.isArray(data.bars)) return [];
// // //     return data.bars.map((b, idx) => ({
// // //       i: idx,
// // //       label: b.label ?? "",
// // //       pnl: Number(b.pnl || 0),
// // //       tradeCount: Number(b.trade_count || 0),
// // //       start: b.start,
// // //       end: b.end,
// // //     }));
// // //   }, [data]);

// // //   const totalPnl = useMemo(() => {
// // //     return bars.reduce((sum, b) => sum + (Number.isFinite(b.pnl) ? b.pnl : 0), 0);
// // //   }, [bars]);

// // //   const pnlClass = totalPnl >= 0 ? "positive" : "negative";

// // //   if (error) {
// // //     return (
// // //       <div className="investment-chart">
// // //         <div className="error-message">
// // //           {String(error?.message || error || "Failed to load realized P&L.")}
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="investment-chart pnl-bars-layout">
// // //       {summary && (
// // //         <div className="investment-summary pnl-bars-summary">
// // //           <div className="investment-account">{summary.tradeCount ?? 0}</div>

// // //           <div className="investment-equity">Wins {summary.wins ?? 0}</div>
// // //           <div className="investment-equity">Losses {summary.losses ?? 0}</div>

// // //           <div
// // //             className={`investment-roi ${
// // //               (summary.winRate ?? 0) >= 50 ? "positive" : "negative"
// // //             }`}
// // //           >
// // //             Win Rate: {Number(summary.winRate ?? 0).toFixed(1)}%
// // //           </div>

// // //           <div className={`investment-roi ${pnlClass}`}>
// // //             PnL: {formatCurrency(totalPnl)}
// // //           </div>
// // //         </div>
// // //       )}

// // //       <div className="pnl-bars-chart-area">
// // //         <ResponsiveContainer width="100%" height="100%">
// // //           <BarChart data={bars} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
// // //             <XAxis dataKey="label" tick={false} axisLine={false} />
// // //             <YAxis hide />
// // //             <ReferenceLine y={0} stroke="#e5e7eb" />

// // //             <Tooltip
// // //               cursor={false}
// // //               content={({ payload }) => {
// // //                 if (!payload || !payload.length) return null;
// // //                 const p = payload[0].payload;
// // //                 return (
// // //                   <div className="trade-pnl-tooltip">
// // //                     <p>{formatCurrency(p.pnl)}</p>
// // //                     <p className="trade-pnl-tooltip-date">{p.label}</p>
// // //                     <p className="trade-pnl-tooltip-date">Trades: {p.tradeCount}</p>
// // //                   </div>
// // //                 );
// // //               }}
// // //             />

// // //             <Bar
// // //               dataKey="pnl"
// // //               radius={[5, 5, 5, 5]}
// // //               barSize={55}
// // //               isAnimationActive={true}
// // //               animationBegin={0}
// // //               animationEasing="ease-out"
// // //             >
// // //               {bars.map((b) => (
// // //                 <Cell key={b.i} fill={b.pnl >= 0 ? "#4a90e2" : "#f44336"} />
// // //               ))}
// // //             </Bar>
// // //           </BarChart>
// // //         </ResponsiveContainer>
// // //       </div>

// // //       <div className="tab-container tab-container-bottom-left pnl-bars-tabs">
// // //         <button
// // //           type="button"
// // //           className={`tab-button ${range === "1W" ? "active" : ""}`}
// // //           onClick={() => setRange("1W")}
// // //         >
// // //           1W
// // //         </button>
// // //         <button
// // //           type="button"
// // //           className={`tab-button ${range === "1M" ? "active" : ""}`}
// // //           onClick={() => setRange("1M")}
// // //         >
// // //           1M
// // //         </button>
// // //         <button
// // //           type="button"
// // //           className={`tab-button ${range === "1Y" ? "active" : ""}`}
// // //           onClick={() => setRange("1Y")}
// // //         >
// // //           1Y
// // //         </button>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default TradePnlBars;

// // // // // src/components/charts/TradePnlBars.jsx

// // // // import React, { useEffect, useMemo, useState } from "react";
// // // // import {
// // // //   BarChart,
// // // //   Bar,
// // // //   XAxis,
// // // //   YAxis,
// // // //   Tooltip,
// // // //   ResponsiveContainer,
// // // //   Cell,
// // // //   ReferenceLine,
// // // // } from "recharts";

// // // // import { useRealizedPnl } from "../../hooks/useRealizedPnl";
// // // // import { formatCurrency } from "../../func/formatters";

// // // // const MIN_READY_DELAY_MS = 1000;

// // // // const TradePnlBars = ({ summary = null }) => {
// // // //   const { range, setRange, data, error } = useRealizedPnl("1M");

// // // //   const [ready, setReady] = useState(false);

// // // //   useEffect(() => {
// // // //     let t = null;

// // // //     setReady(false);

// // // //     if (error) return;

// // // //     const hasBars = !!data && Array.isArray(data.bars) && data.bars.length > 0;
// // // //     if (!hasBars) return;

// // // //     t = setTimeout(() => setReady(true), MIN_READY_DELAY_MS);

// // // //     return () => {
// // // //       if (t) clearTimeout(t);
// // // //     };
// // // //   }, [data, error, range]);

// // // //   const bars = useMemo(() => {
// // // //     if (!data || !Array.isArray(data.bars)) return [];
// // // //     return data.bars.map((b, idx) => ({
// // // //       i: idx,
// // // //       label: b.label ?? "",
// // // //       pnl: Number(b.pnl || 0),
// // // //       tradeCount: Number(b.trade_count || 0),
// // // //       start: b.start,
// // // //       end: b.end,
// // // //     }));
// // // //   }, [data]);

// // // //   const totalPnl = useMemo(() => {
// // // //     return bars.reduce((sum, b) => sum + (Number.isFinite(b.pnl) ? b.pnl : 0), 0);
// // // //   }, [bars]);

// // // //   const pnlClass = totalPnl >= 0 ? "positive" : "negative";

// // // //   if (error) {
// // // //     return (
// // // //       <div className="investment-chart">
// // // //         <div className="error-message">
// // // //           {String(error?.message || error || "Failed to load realized P&L.")}
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <div className="investment-chart pnl-bars-layout">
// // // //       {/* Top summary */}
// // // //       {summary && (
// // // //         <div className="investment-summary pnl-bars-summary">
// // // //           <div className="investment-account">{summary.tradeCount ?? 0}</div>

// // // //           <div className="investment-equity">Wins {summary.wins ?? 0}</div>
// // // //           <div className="investment-equity">Losses {summary.losses ?? 0}</div>

// // // //           <div
// // // //             className={`investment-roi ${
// // // //               (summary.winRate ?? 0) >= 50 ? "positive" : "negative"
// // // //             }`}
// // // //           >
// // // //             Win Rate: {Number(summary.winRate ?? 0).toFixed(1)}%
// // // //           </div>

// // // //           <div className={`investment-roi ${pnlClass}`}>
// // // //             PnL: {formatCurrency(totalPnl)}
// // // //           </div>
// // // //         </div>
// // // //       )}

// // // //       {/* Chart */}
// // // //       <div className="pnl-bars-chart-area">
// // // //         {!ready ? null : (
// // // //           <ResponsiveContainer width="100%" height="100%">
// // // //             <BarChart data={bars} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
// // // //               <XAxis dataKey="label" tick={false} axisLine={false} />
// // // //               <YAxis hide />
// // // //               <ReferenceLine y={0} stroke="#e5e7eb" />

// // // //               <Tooltip
// // // //                 cursor={false}
// // // //                 content={({ payload }) => {
// // // //                   if (!payload || !payload.length) return null;
// // // //                   const p = payload[0].payload;
// // // //                   return (
// // // //                     <div className="trade-pnl-tooltip">
// // // //                       <p>{formatCurrency(p.pnl)}</p>
// // // //                       <p className="trade-pnl-tooltip-date">{p.label}</p>
// // // //                       <p className="trade-pnl-tooltip-date">Trades: {p.tradeCount}</p>
// // // //                     </div>
// // // //                   );
// // // //                 }}
// // // //               />

// // // //               <Bar
// // // //                 dataKey="pnl"
// // // //                 radius={[5, 5, 5, 5]}
// // // //                 barSize={55}
// // // //                 isAnimationActive={true}
// // // //                 animationBegin={0}
// // // //                 animationEasing="ease-out"
// // // //               >
// // // //                 {bars.map((b) => (
// // // //                   <Cell key={b.i} fill={b.pnl >= 0 ? "#4a90e2" : "#f44336"} />
// // // //                 ))}
// // // //               </Bar>
// // // //             </BarChart>
// // // //           </ResponsiveContainer>
// // // //         )}
// // // //       </div>

// // // //       {/* Tabs */}
// // // //       <div className="tab-container tab-container-bottom-left pnl-bars-tabs">
// // // //         <button
// // // //           type="button"
// // // //           className={`tab-button ${range === "1W" ? "active" : ""}`}
// // // //           onClick={() => setRange("1W")}
// // // //         >
// // // //           1W
// // // //         </button>
// // // //         <button
// // // //           type="button"
// // // //           className={`tab-button ${range === "1M" ? "active" : ""}`}
// // // //           onClick={() => setRange("1M")}
// // // //         >
// // // //           1M
// // // //         </button>
// // // //         <button
// // // //           type="button"
// // // //           className={`tab-button ${range === "1Y" ? "active" : ""}`}
// // // //           onClick={() => setRange("1Y")}
// // // //         >
// // // //           1Y
// // // //         </button>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default TradePnlBars;

