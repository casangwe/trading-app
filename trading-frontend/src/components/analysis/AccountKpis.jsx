// src/components/analysis/AccountKpis.jsx

import React from "react";
import { formatCurrency, formatPercent } from "../../func/formatters";

const AccountKpis = ({ dashboard }) => {
  const account = dashboard?.account || {
    initial_capital: 0,
    invested_capital: 0,
    total_value: 0,
    current_equity: 0,
    net_pnl: 0,
    roi: 0,
    total_deposits: 0,
    total_withdrawals: 0,
    net_contributed: 0,
  };

  return (
    <div className="account-kpis">
      <div className="summary-row">
        <div className="metric">
          <span className="label">Principal</span>
          <span className="value">
            {formatCurrency(account.initial_capital ?? 0)}
          </span>
        </div>

        <div className="metric">
          <span className="label">Invested</span>
          <span className="value">
            {formatCurrency(account.invested_capital ?? 0)}
          </span>
        </div>

        <div className="metric">
          <span className="label">Total Value</span>
          <span className="value emphasis">
            {formatCurrency(account.total_value ?? 0)}
          </span>
        </div>
      </div>

      <div className="divider" />

      <div className="summary-row">
        <div className="metric">
          <span className="label">Equity</span>
          <span className="value emphasis">
            {formatCurrency(account.current_equity ?? 0)}
          </span>
        </div>

        <div className="metric">
          <span className="label">Net P/L</span>
          <span
            className={`value ${(account.net_pnl ?? 0) >= 0 ? "positive" : "negative"}`}
          >
            {formatCurrency(account.net_pnl ?? 0)}
          </span>
        </div>

        <div className="metric">
          <span className="label">ROI</span>
          <span
            className={`value ${(account.roi ?? 0) >= 0 ? "positive" : "negative"}`}
          >
            {formatPercent(account.roi ?? 0)}
          </span>
        </div>
      </div>

      <div className="divider" />

      <div className="summary-row">
        <div className="metric">
          <span className="label">Deposits</span>
          <span className="value">
            {formatCurrency(account.total_deposits ?? 0)}
          </span>
        </div>

        <div className="metric">
          <span className="label">Withdrawals</span>
          <span className="value">
            {formatCurrency(account.total_withdrawals ?? 0)}
          </span>
        </div>

        <div className="metric">
          <span className="label">Net Contributed</span>
          <span className="value emphasis">
            {formatCurrency(account.net_contributed ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AccountKpis;

// import React from "react";
// import { formatCurrency } from "../../func/formatters";

// const AccountKpis = ({ dashboard }) => {
//   const account = dashboard?.account || {
//     initial_capital: 0,
//     invested_capital: 0,
//     total_value: 0,
//     current_equity: 0,
//     net_pnl: 0,
//     roi: 0,
//     total_deposits: 0,
//     total_withdrawals: 0,
//     net_contributed: 0,
//   };

//   return (
//     <div className="account-summary">
//       <div className="account-card-container">
//         <div className="account-card">
//           <span className="label">Principal</span>
//           <span className="value">{formatCurrency(account.initial_capital ?? 0)}</span>
//         </div>

//         <div className="account-card">
//           <span className="label">Invested</span>
//           <span className="value">{formatCurrency(account.invested_capital ?? 0)}</span>
//         </div>

//         <div className="account-card">
//           <span className="label">Total Value</span>
//           <span className="value emphasis">{formatCurrency(account.total_value ?? 0)}</span>
//         </div>

//         <hr className="divider" />

//         <div className="account-card">
//           <span className="label">Equity</span>
//           <span className="value emphasis">{formatCurrency(account.current_equity ?? 0)}</span>
//         </div>

//         <div className="account-card">
//           <span className={`value ${(account.net_pnl ?? 0) >= 0 ? "positive" : "negative"}`}>
//             <span className="label">Net P/L</span>
//             {formatCurrency(account.net_pnl ?? 0)}
//           </span>
//         </div>

//         <div className="account-card">
//           <span className="label">ROI</span>
//           <span className={`value ${(account.roi ?? 0) >= 0 ? "positive" : "negative"}`}>
//             {Number(account.roi ?? 0).toFixed(2)}%
//           </span>
//         </div>

//         <hr className="divider" />

//         <div className="account-card">
//           <span className="label">Deposits</span>
//           <span className="value">{formatCurrency(account.total_deposits ?? 0)}</span>
//         </div>

//         <div className="account-card">
//           <span className="label">Withdrawals</span>
//           <span className="value">{formatCurrency(account.total_withdrawals ?? 0)}</span>
//         </div>

//         <div className="account-card">
//           <span className="label">Net Contributed</span>
//           <span className="value emphasis">
//             {formatCurrency(account.net_contributed ?? 0)}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AccountKpis;

