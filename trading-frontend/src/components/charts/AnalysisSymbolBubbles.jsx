// src/components/charts/AnalysisSymbolBubbles.jsx
import React, { useMemo } from "react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip } from "recharts";

import EmptyState from "../layout/EmptyState";
import { formatCurrency } from "../../func/formatters";

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function overlapsAny(x, y, r, placed, padding = 2) {
  for (const p of placed) {
    const dx = x - p.x;
    const dy = y - p.y;
    const minDist = r + p.r + padding;
    if (dx * dx + dy * dy < minDist * minDist) return true;
  }
  return false;
}

function computeRadiusScale(values, count) {
  const minV = Math.min(...values);
  const maxV = Math.max(...values);

  const rMin = 10;
  const rMax = clamp(56 - count * 0.9, 18, 52);

  return (v) => {
    if (!Number.isFinite(v)) return rMin;
    if (maxV === minV) return (rMin + rMax) / 2;
    const t = (v - minV) / (maxV - minV);
    return rMin + t * (rMax - rMin);
  };
}

function packBubbles(items, opts = {}) {
  const {
    padding = 2,
    clusterX = 45,
    spiralStep = 2.2,
    angleStep = 0.35,
    maxTries = 3500,
  } = opts;

  const placed = [];
  const sorted = items.slice().sort((a, b) => b.r - a.r);

  for (const d of sorted) {
    const cx = d.total_pnl >= 0 ? clusterX : -clusterX;
    const cy = 0;

    let found = false;
    let a = Math.random() * Math.PI * 2;
    let s = 0;

    for (let t = 0; t < maxTries; t++) {
      s += spiralStep;
      a += angleStep;

      const x = cx + Math.cos(a) * s;
      const y = cy + Math.sin(a) * s;

      if (!overlapsAny(x, y, d.r, placed, padding)) {
        placed.push({ ...d, x, y });
        found = true;
        break;
      }
    }

    if (!found) {
      placed.push({
        ...d,
        x: cx + (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 20),
        y: (Math.random() - 0.5) * 80,
      });
    }
  }

  return placed;
}

function fitToDomain(placed, domain = { x: [-95, 95], y: [-65, 65] }) {
  if (!placed.length) return placed;

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  for (const p of placed) {
    minX = Math.min(minX, p.x - p.r);
    maxX = Math.max(maxX, p.x + p.r);
    minY = Math.min(minY, p.y - p.r);
    maxY = Math.max(maxY, p.y + p.r);
  }

  const srcW = maxX - minX || 1;
  const srcH = maxY - minY || 1;

  const dstW = domain.x[1] - domain.x[0];
  const dstH = domain.y[1] - domain.y[0];

  const scale = Math.min(dstW / srcW, dstH / srcH);

  const srcCx = (minX + maxX) / 2;
  const srcCy = (minY + maxY) / 2;
  const dstCx = (domain.x[0] + domain.x[1]) / 2;
  const dstCy = (domain.y[0] + domain.y[1]) / 2;

  return placed.map((p) => ({
    ...p,
    x: (p.x - srcCx) * scale + dstCx,
    y: (p.y - srcCy) * scale + dstCy,
    r: p.r * scale,
  }));
}

const AnalysisSymbolBubbles = ({ stats = null, height = 450, limit = 24 }) => {
  const raw = useMemo(() => {
    const rows = stats?.pnl_by_symbol_detail || [];

    if (rows.length) {
      const sorted = rows
        .map((d) => ({
          symbol: d.symbol,
          trade_count: d.trade_count ?? 0,
          win_rate: d.win_rate ?? 0,
          avg_pnl: d.avg_pnl ?? 0,
          total_pnl: Number(d.total_pnl ?? 0),
        }))
        .sort((a, b) => Math.abs(b.total_pnl) - Math.abs(a.total_pnl));

      return sorted.slice(0, limit);
    }

    const map = stats?.pnl_by_symbol || {};
    const arr = Object.entries(map)
      .map(([symbol, total]) => ({
        symbol,
        trade_count: 0,
        win_rate: 0,
        avg_pnl: 0,
        total_pnl: Number(total || 0),
      }))
      .sort((a, b) => Math.abs(b.total_pnl) - Math.abs(a.total_pnl));

    return arr.slice(0, limit);
  }, [stats, limit]);

  const packed = useMemo(() => {
    if (!raw.length) return [];

    const impacts = raw.map((d) => Math.abs(d.total_pnl));
    const rOf = computeRadiusScale(impacts, raw.length);

    const sized = raw.map((d) => ({
      ...d,
      impact: Math.abs(d.total_pnl),
      r: rOf(Math.abs(d.total_pnl)),
    }));

    const placed = packBubbles(sized, {
      padding: raw.length > 26 ? 1 : 2,
      clusterX: raw.length > 26 ? 36 : 44,
      spiralStep: raw.length > 26 ? 2.0 : 2.2,
      angleStep: 0.35,
      maxTries: 3500,
    });

    return fitToDomain(placed, { x: [-95, 95], y: [-65, 65] });
  }, [raw]);

  const chartH = useMemo(() => Math.max(320, Number(height || 450)), [height]);

  return (
    <div className="analysis-chart" style={{ minHeight: chartH }}>
      {!packed.length ? (
        <div style={{ padding: "0 16px 16px 16px" }}>
          <EmptyState
            title="Symbols heatmap"
            description="Enter your first trade to view symbol heatmap performance."
          />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartH}>
          <ScatterChart margin={{ top: 18, right: 18, left: 18, bottom: 18 }}>
            <XAxis type="number" dataKey="x" domain={[-95, 95]} hide />
            <YAxis type="number" dataKey="y" domain={[-65, 65]} hide />

            <Tooltip
              cursor={false}
              content={({ payload }) => {
                const p = payload?.[0]?.payload;
                if (!p) return null;

                return (
                  <div className="tooltip-content">
                    <p style={{ fontWeight: 700 }}>{p.symbol}</p>
                    <p className="tooltip-date">Total: {formatCurrency(p.total_pnl)}</p>
                    <p className="tooltip-date">Trades: {p.trade_count}</p>
                    <p className="tooltip-date">
                      Win rate: {Number(p.win_rate ?? 0).toFixed(1)}%
                    </p>
                  </div>
                );
              }}
            />

            <Scatter
              data={packed.filter((d) => d.total_pnl >= 0)}
              shape={(props) => {
                const { cx, cy, payload } = props;
                if (cx == null || cy == null) return null;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={payload.r}
                    fill="rgba(74,144,226,0.22)"
                    stroke="rgba(74,144,226,0.9)"
                    strokeWidth={2}
                  />
                );
              }}
              isAnimationActive
            />

            <Scatter
              data={packed.filter((d) => d.total_pnl < 0)}
              shape={(props) => {
                const { cx, cy, payload } = props;
                if (cx == null || cy == null) return null;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={payload.r}
                    fill="rgba(214,40,40,0.20)"
                    stroke="rgba(214,40,40,0.9)"
                    strokeWidth={2}
                  />
                );
              }}
              isAnimationActive
            />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default AnalysisSymbolBubbles;


// // src/components/charts/AnalysisSymbolBubbles.jsx
// import React, { useMemo } from "react";
// import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip } from "recharts";

// import EmptyState from "../layout/EmptyState";
// import { formatCurrency } from "../../func/formatters";

// const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// function overlapsAny(x, y, r, placed, padding = 2) {
//   for (const p of placed) {
//     const dx = x - p.x;
//     const dy = y - p.y;
//     const minDist = r + p.r + padding;
//     if (dx * dx + dy * dy < minDist * minDist) return true;
//   }
//   return false;
// }

// function computeRadiusScale(values, count) {
//   const minV = Math.min(...values);
//   const maxV = Math.max(...values);

//   const rMin = 10;
//   const rMax = clamp(56 - count * 0.9, 18, 52);

//   return (v) => {
//     if (!Number.isFinite(v)) return rMin;
//     if (maxV === minV) return (rMin + rMax) / 2;
//     const t = (v - minV) / (maxV - minV);
//     return rMin + t * (rMax - rMin);
//   };
// }

// function packBubbles(items, opts = {}) {
//   const {
//     padding = 2,
//     clusterX = 45,
//     spiralStep = 2.2,
//     angleStep = 0.35,
//     maxTries = 3500,
//   } = opts;

//   const placed = [];
//   const sorted = items.slice().sort((a, b) => b.r - a.r);

//   for (const d of sorted) {
//     const cx = d.total_pnl >= 0 ? clusterX : -clusterX;
//     const cy = 0;

//     let found = false;
//     let a = Math.random() * Math.PI * 2;
//     let s = 0;

//     for (let t = 0; t < maxTries; t++) {
//       s += spiralStep;
//       a += angleStep;

//       const x = cx + Math.cos(a) * s;
//       const y = cy + Math.sin(a) * s;

//       if (!overlapsAny(x, y, d.r, placed, padding)) {
//         placed.push({ ...d, x, y });
//         found = true;
//         break;
//       }
//     }

//     if (!found) {
//       placed.push({
//         ...d,
//         x: cx + (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 20),
//         y: (Math.random() - 0.5) * 80,
//       });
//     }
//   }

//   return placed;
// }

// function fitToDomain(placed, domain = { x: [-95, 95], y: [-65, 65] }) {
//   if (!placed.length) return placed;

//   // Find extents INCLUDING radius, so circles stay inside
//   let minX = Infinity,
//     maxX = -Infinity,
//     minY = Infinity,
//     maxY = -Infinity;

//   for (const p of placed) {
//     minX = Math.min(minX, p.x - p.r);
//     maxX = Math.max(maxX, p.x + p.r);
//     minY = Math.min(minY, p.y - p.r);
//     maxY = Math.max(maxY, p.y + p.r);
//   }

//   const srcW = maxX - minX || 1;
//   const srcH = maxY - minY || 1;

//   const dstW = domain.x[1] - domain.x[0];
//   const dstH = domain.y[1] - domain.y[0];

//   const scale = Math.min(dstW / srcW, dstH / srcH);

//   // Center
//   const srcCx = (minX + maxX) / 2;
//   const srcCy = (minY + maxY) / 2;
//   const dstCx = (domain.x[0] + domain.x[1]) / 2;
//   const dstCy = (domain.y[0] + domain.y[1]) / 2;

//   return placed.map((p) => ({
//     ...p,
//     x: (p.x - srcCx) * scale + dstCx,
//     y: (p.y - srcCy) * scale + dstCy,
//     r: p.r * scale,
//   }));
// }

// const AnalysisSymbolBubbles = ({ stats = null, height = 450, limit = 24 }) => {
//   const raw = useMemo(() => {
//     const rows = stats?.pnl_by_symbol_detail || [];

//     if (rows.length) {
//       const sorted = rows
//         .map((d) => ({
//           symbol: d.symbol,
//           trade_count: d.trade_count ?? 0,
//           win_rate: d.win_rate ?? 0,
//           avg_pnl: d.avg_pnl ?? 0,
//           total_pnl: Number(d.total_pnl ?? 0),
//         }))
//         .sort((a, b) => Math.abs(b.total_pnl) - Math.abs(a.total_pnl));

//       return sorted.slice(0, limit);
//     }

//     const map = stats?.pnl_by_symbol || {};
//     const arr = Object.entries(map)
//       .map(([symbol, total]) => ({
//         symbol,
//         trade_count: 0,
//         win_rate: 0,
//         avg_pnl: 0,
//         total_pnl: Number(total || 0),
//       }))
//       .sort((a, b) => Math.abs(b.total_pnl) - Math.abs(a.total_pnl));

//     return arr.slice(0, limit);
//   }, [stats, limit]);

//   const packed = useMemo(() => {
//     if (!raw.length) return [];

//     const impacts = raw.map((d) => Math.abs(d.total_pnl));
//     const rOf = computeRadiusScale(impacts, raw.length);

//     const sized = raw.map((d) => ({
//       ...d,
//       impact: Math.abs(d.total_pnl),
//       r: rOf(Math.abs(d.total_pnl)),
//     }));

//     const placed = packBubbles(sized, {
//       padding: raw.length > 26 ? 1 : 2,
//       clusterX: raw.length > 26 ? 36 : 44,
//       spiralStep: raw.length > 26 ? 2.0 : 2.2,
//       angleStep: 0.35,
//       maxTries: 3500,
//     });

//     // Slightly inset domain gives edge padding so strokes don’t clip
//     return fitToDomain(placed, { x: [-95, 95], y: [-65, 65] });
//   }, [raw]);

//   // ✅ use full height (no header subtraction)
//   const chartH = useMemo(() => Math.max(320, Number(height || 450)), [height]);

//   return (
//     <div className="analysis-chart" style={{ minHeight: chartH }}>
//       {!packed.length ? (
//         <div style={{ padding: "0 16px 16px 16px" }}>
//           <EmptyState
//             title="Symbol bubbles unavailable"
//             description="No symbol PnL data found yet."
//           />
//         </div>
//       ) : (
//         <ResponsiveContainer width="100%" height={chartH}>
//           <ScatterChart margin={{ top: 18, right: 18, left: 18, bottom: 18 }}>
//             <XAxis type="number" dataKey="x" domain={[-95, 95]} hide />
//             <YAxis type="number" dataKey="y" domain={[-65, 65]} hide />

//             <Tooltip
//               cursor={false}
//               content={({ payload }) => {
//                 const p = payload?.[0]?.payload;
//                 if (!p) return null;

//                 return (
//                   <div className="tooltip-content">
//                     <p style={{ fontWeight: 700 }}>{p.symbol}</p>
//                     <p className="tooltip-date">Total: {formatCurrency(p.total_pnl)}</p>
//                     <p className="tooltip-date">Trades: {p.trade_count}</p>
//                     <p className="tooltip-date">
//                       Win rate: {Number(p.win_rate ?? 0).toFixed(1)}%
//                     </p>
//                   </div>
//                 );
//               }}
//             />

//             <Scatter
//               data={packed.filter((d) => d.total_pnl >= 0)}
//               shape={(props) => {
//                 const { cx, cy, payload } = props;
//                 if (cx == null || cy == null) return null;
//                 return (
//                   <circle
//                     cx={cx}
//                     cy={cy}
//                     r={payload.r}
//                     fill="rgba(74,144,226,0.22)"
//                     stroke="rgba(74,144,226,0.9)"
//                     strokeWidth={2}
//                   />
//                 );
//               }}
//               isAnimationActive
//             />

//             <Scatter
//               data={packed.filter((d) => d.total_pnl < 0)}
//               shape={(props) => {
//                 const { cx, cy, payload } = props;
//                 if (cx == null || cy == null) return null;
//                 return (
//                   <circle
//                     cx={cx}
//                     cy={cy}
//                     r={payload.r}
//                     fill="rgba(214,40,40,0.20)"
//                     stroke="rgba(214,40,40,0.9)"
//                     strokeWidth={2}
//                   />
//                 );
//               }}
//               isAnimationActive
//             />
//           </ScatterChart>
//         </ResponsiveContainer>
//       )}
//     </div>
//   );
// };

// export default AnalysisSymbolBubbles;

