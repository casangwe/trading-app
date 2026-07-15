// src/components/charts/InvestmentsChart.jsx

import React, { useMemo } from "react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

import { formatCurrency, formatDate } from "../../func/formatters";

const InvestmentsChart = ({
  variant = "profile",
  dashboard,
  charts,
  curveKey = "normalized_equity_curve",
}) => {
  const account = dashboard?.account || null;
  const daily = dashboard?.portfolio_daily_summary || null;

  const isHome = variant === "home";

  const curve = useMemo(() => {
    if (!charts) return [];

    const selectedCurve = charts?.[curveKey];

    if (Array.isArray(selectedCurve) && selectedCurve.length > 0) {
      return selectedCurve;
    }

    const fallbackCurve = isHome
      ? charts?.equity_curve
      : charts?.normalized_equity_curve;

    if (Array.isArray(fallbackCurve) && fallbackCurve.length > 0) {
      return fallbackCurve;
    }

    return [];
  }, [charts, curveKey, isHome]);

  const latestCurveValue = useMemo(() => {
    if (!curve.length) return null;

    const latest = curve[curve.length - 1];
    const value = Number(latest?.value);

    return Number.isFinite(value) ? value : null;
  }, [curve]);

  const chartData = useMemo(() => {
    if (!curve || !curve.length) return [];

    return curve.map((point) => ({
      date: formatDate(point.date),
      value: Number(point.value || 0),
    }));
  }, [curve]);

  if (!account) return null;

  const fallbackBigNumber = isHome
    ? account.current_equity
    : account.total_value;

  // const bigNumber = latestCurveValue ?? fallbackBigNumber ?? 0;

  const bigNumber = isHome
    ? account.current_equity
    : (latestCurveValue ?? account.total_value ?? 0);

  const pnlValue = isHome ? (daily?.pnl ?? 0) : account.net_pnl;
  const roiValue = isHome ? (daily?.roi ?? 0) : account.roi;

  const secondaryLabel = isHome ? "Total" : "Equity";
  const secondaryValue = isHome ? account.total_value : account.current_equity;

  return (
    <div className="investment-chart">
      <div className="investment-summary">
        <div className="investment-account">{formatCurrency(bigNumber)}</div>

        <div className="investment-equity">
          {secondaryLabel} {formatCurrency(secondaryValue)}
        </div>

        <div className={`investment-pnl ${pnlValue >= 0 ? "positive" : "negative"}`}>
          PnL: {formatCurrency(pnlValue)}
        </div>

        <div className={`investment-roi ${roiValue >= 0 ? "positive" : "negative"}`}>
          RoI: {Number(roiValue).toFixed(2)}%
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" hide />

          <Tooltip
            cursor={false}
            content={({ payload }) => {
              if (!payload || !payload.length) return null;

              const { value, date } = payload[0].payload;

              return (
                <div className="tooltip-content">
                  <p>{formatCurrency(value)}</p>
                  <p className="tooltip-date">{date}</p>
                </div>
              );
            }}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#4a90e2"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InvestmentsChart;

// // src/components/charts/InvestmentsChart.jsx

// import React, { useMemo } from "react";
// import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

// import { formatCurrency, formatDate } from "../../func/formatters";

// const InvestmentsChart = ({ variant = "profile", dashboard, charts }) => {
//   const account = dashboard?.account || null;
//   const daily = dashboard?.portfolio_daily_summary || null;

//   const curve = useMemo(() => {
//     const normalized = charts?.normalized_equity_curve || [];
//     const raw = charts?.equity_curve || [];
//     return normalized.length ? normalized : raw;
//   }, [charts]);

//   const chartData = useMemo(() => {
//     if (!curve || !curve.length) return [];
//     return curve.map((point) => ({
//       date: formatDate(point.date),
//       value: point.value,
//     }));
//   }, [curve]);

//   if (!account) return null;

//   const isHome = variant === "home";

//   const bigNumber = isHome ? account.current_equity : account.total_value;

//   const pnlValue = isHome ? (daily?.pnl ?? 0) : account.net_pnl;
//   const roiValue = isHome ? (daily?.roi ?? 0) : account.roi;

//   const secondaryLabel = isHome ? "Total" : "Equity";
//   const secondaryValue = isHome ? account.total_value : account.current_equity;

//   return (
//     <div className="investment-chart">
//       <div className="investment-summary">
//         <div className="investment-account">{formatCurrency(bigNumber)}</div>

//         <div className="investment-equity">
//           {secondaryLabel} {formatCurrency(secondaryValue)}
//         </div>

//         <div className={`investment-pnl ${pnlValue >= 0 ? "positive" : "negative"}`}>
//           PnL: {formatCurrency(pnlValue)}
//         </div>

//         <div className={`investment-roi ${roiValue >= 0 ? "positive" : "negative"}`}>
//           RoI: {Number(roiValue).toFixed(2)}%
//         </div>
//       </div>

//       <ResponsiveContainer width="100%" height={300}>
//         <LineChart data={chartData}>
//           <XAxis dataKey="date" hide />

//           <Tooltip
//             cursor={false}
//             content={({ payload }) => {
//               if (!payload || !payload.length) return null;
//               const { value, date } = payload[0].payload;

//               return (
//                 <div className="tooltip-content">
//                   <p>{formatCurrency(value)}</p>
//                   <p className="tooltip-date">{date}</p>
//                 </div>
//               );
//             }}
//           />

//           <Line
//             type="monotone"
//             dataKey="value"
//             stroke="#4a90e2"
//             strokeWidth={2}
//             dot={false}
//           />
//         </LineChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default InvestmentsChart;

