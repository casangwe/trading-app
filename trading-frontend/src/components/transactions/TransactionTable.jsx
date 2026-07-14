// src/components/transactions/TransactionTable.jsx

import React, { useMemo } from "react";
import { formatCurrency, formatFullDate } from "../../func/formatters";
import EmptyState from "../layout/EmptyState";

const TransactionsTable = ({
  transactions = [],
  initialCash = null,
  onAdd,
  onEdit,
}) => {
  const normalizedRows = useMemo(() => {
    const baseRows = Array.isArray(transactions) ? [...transactions] : [];

    const hasInitialCashRowFromApi = baseRows.some(
      (tx) =>
        Boolean(tx?.is_initial_cash) ||
        tx?.transaction_type === "initial_cash"
    );

    if (initialCash && !hasInitialCashRowFromApi) {
      baseRows.push({
        id: `initial-cash-${initialCash.id ?? "derived"}`,
        transaction_date: initialCash.entry_date || null,
        transaction_type: "initial_cash",
        amount: Number(initialCash.initial_cash ?? 0),
        transaction_summary: "Initial cash",
        is_initial_cash: true,
        __derived: true,
      });
    }

    baseRows.sort((a, b) => {
      const aTime = a?.transaction_date
        ? new Date(a.transaction_date).getTime()
        : 0;
      const bTime = b?.transaction_date
        ? new Date(b.transaction_date).getTime()
        : 0;

      return bTime - aTime; // newest first
    });

    return baseRows;
  }, [transactions, initialCash]);

  const hasRows = normalizedRows.length > 0;

  return (
    <div className="table-wrapper">
      <div className="table-header">
        <h3 className="table-title">Transactions</h3>

        <button
          className="table-add-btn has-tooltip"
          onClick={onAdd}
          data-tooltip="New Entry"
        >
          +
        </button>
      </div>

      <div className="divider" />

      {hasRows ? (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "24%" }}>Date</th>
                <th style={{ width: "20%" }}>Type</th>
                <th style={{ width: "18%" }}>Amount</th>
                <th style={{ width: "38%" }}>Summary</th>
              </tr>
            </thead>

            <tbody>
              {normalizedRows.map((tx) => {
                const isInitial = Boolean(tx.is_initial_cash);
                const isDerived = Boolean(tx.__derived);
                const isLocked = isInitial || isDerived;

                const typeLabel = isInitial
                  ? "initial cash"
                  : tx.transaction_type || "—";

                const isWithdrawal = tx.transaction_type === "withdrawal";
                const amountClass = isWithdrawal ? "negative" : "positive";
                const sign = isWithdrawal ? "-" : "+";

                const rowKey =
                  tx.id ??
                  `${tx.transaction_date}-${tx.transaction_type}-${tx.amount}`;

                const handleRowClick = () => {
                  if (isLocked) return;
                  if (typeof onEdit === "function") onEdit(tx);
                };

                return (
                  <tr
                    key={rowKey}
                    className={`row ${isLocked ? "muted locked" : ""}`}
                    onClick={handleRowClick}
                    style={isLocked ? { cursor: "default" } : undefined}
                  >
                    <td>
                      {tx.transaction_date
                        ? formatFullDate(tx.transaction_date)
                        : "—"}
                    </td>

                    <td className={amountClass}>{typeLabel}</td>

                    <td className={`num ${amountClass}`}>
                      {sign}
                      {formatCurrency(Number(tx.amount ?? 0))}
                    </td>

                    <td title={tx.transaction_summary || ""}>
                      {tx.transaction_summary || (isInitial ? "Initial cash" : "—")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-empty-state">
          <EmptyState
            description="Add your first deposit or withdrawal to begin tracking activity."
            onAction={onAdd}
          />
        </div>
      )}
    </div>
  );
};

export default TransactionsTable;

// // src/components/transactions/TransactionTable.jsx

// import React, { useMemo } from "react";
// import { formatCurrency, formatFullDate } from "../../func/formatters";
// import EmptyState from "../layout/EmptyState";

// const TransactionsTable = ({
//   transactions = [],
//   initialCash = null,
//   onAdd,
//   onEdit,
// }) => {
//   const normalizedRows = useMemo(() => {
//     const baseRows = Array.isArray(transactions) ? [...transactions] : [];

//     const hasInitialCashRowFromApi = baseRows.some(
//       (tx) => Boolean(tx?.is_initial_cash) || tx?.transaction_type === "initial_cash"
//     );

//     if (initialCash && !hasInitialCashRowFromApi) {
//       baseRows.unshift({
//         id: `initial-cash-${initialCash.id ?? "derived"}`,
//         transaction_date:
//           initialCash.initial_cash_date ||
//           initialCash.created_at ||
//           initialCash.transaction_date ||
//           null,
//         transaction_type: "initial_cash",
//         amount: Number(initialCash.amount ?? 0),
//         transaction_summary:
//           initialCash.note || initialCash.transaction_summary || "Initial cash",
//         is_initial_cash: true,
//         __derived: true,
//       });
//     }

//     return baseRows;
//   }, [transactions, initialCash]);

//   const hasRows = normalizedRows.length > 0;

//   return (
//     <div className="table-wrapper">
//       <div className="table-header">
//         <h3 className="table-title">Transactions</h3>

//         <button
//           className="table-add-btn has-tooltip"
//           onClick={onAdd}
//           data-tooltip="New Entry"
//         >
//           +
//         </button>
//       </div>

//       <div className="divider" />

//       {hasRows ? (
//         <div className="table-scroll">
//           <table className="table">
//             <thead>
//               <tr>
//                 <th style={{ width: "24%" }}>Date</th>
//                 <th style={{ width: "20%" }}>Type</th>
//                 <th style={{ width: "18%" }}>Amount</th>
//                 <th style={{ width: "38%" }}>Summary</th>
//               </tr>
//             </thead>

//             <tbody>
//               {normalizedRows.map((tx) => {
//                 const isInitial = Boolean(tx.is_initial_cash);
//                 const isDerived = Boolean(tx.__derived);
//                 const isLocked = isInitial || isDerived;

//                 const typeLabel = isInitial
//                   ? "initial cash"
//                   : tx.transaction_type || "—";

//                 const isWithdrawal = tx.transaction_type === "withdrawal";
//                 const amountClass = isWithdrawal ? "negative" : "positive";
//                 const sign = isWithdrawal ? "-" : "+";

//                 const rowKey =
//                   tx.id ??
//                   `${tx.transaction_date}-${tx.transaction_type}-${tx.amount}`;

//                 const handleRowClick = () => {
//                   if (isLocked) return;
//                   if (typeof onEdit === "function") onEdit(tx);
//                 };

//                 return (
//                   <tr
//                     key={rowKey}
//                     className={`row ${isLocked ? "muted locked" : ""}`}
//                     onClick={handleRowClick}
//                     style={isLocked ? { cursor: "default" } : undefined}
//                   >
//                     <td>
//                       {tx.transaction_date
//                         ? formatFullDate(tx.transaction_date)
//                         : "—"}
//                     </td>

//                     <td className={amountClass}>{typeLabel}</td>

//                     <td className={`num ${amountClass}`}>
//                       {sign}
//                       {formatCurrency(Number(tx.amount ?? 0))}
//                     </td>

//                     <td title={tx.transaction_summary || ""}>
//                       {tx.transaction_summary || (isInitial ? "Initial cash" : "—")}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       ) : (
//         <div className="table-empty-state">
//           <EmptyState
//             description="Add your first deposit or withdrawal to begin tracking activity."
//             onAction={onAdd}
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default TransactionsTable;

// // // src/components/transactions/TransactionTable.jsx

// // import React from "react";
// // import { formatCurrency, formatFullDate } from "../../func/formatters";
// // import EmptyState from "../layout/EmptyState";

// // const TransactionsTable = ({ transactions = [], onAdd, onEdit }) => {
// //   const hasRows = Array.isArray(transactions) && transactions.length > 0;

// //   return (
// //     <div className="table-wrapper">
// //       <div className="table-header">
// //         <h3 className="table-title">Transactions</h3>

// //         <button
// //           className="table-add-btn has-tooltip"
// //           onClick={onAdd}
// //           data-tooltip="New Entry"
// //         >
// //           +
// //         </button>
// //       </div>

// //       <div className="divider" />

// //       {hasRows ? (
// //         <div className="table-scroll">
// //           <table className="table">
// //             <thead>
// //               <tr>
// //                 <th>Date</th>
// //                 <th>Type</th>
// //                 <th>Amount</th>
// //                 <th>Summary</th>
// //               </tr>
// //             </thead>

// //             <tbody>
// //               {transactions.map((tx) => {
// //                 const isInitial = Boolean(tx.is_initial_cash);
// //                 const isDerived = Boolean(tx.__derived);
// //                 const isLocked = isInitial || isDerived;

// //                 const typeLabel = isInitial ? "initial cash" : tx.transaction_type;

// //                 const sign = tx.transaction_type === "withdrawal" ? "-" : "+";
// //                 const amountClass =
// //                   tx.transaction_type === "deposit" ? "positive" : "negative";

// //                 const rowKey =
// //                   tx.id ?? `${tx.transaction_date}-${tx.transaction_type}-${tx.amount}`;

// //                 const handleRowClick = () => {
// //                   if (isLocked) return;
// //                   if (typeof onEdit === "function") onEdit(tx);
// //                 };

// //                 return (
// //                   <tr
// //                     key={rowKey}
// //                     className={`row ${isLocked ? "muted locked" : ""}`}
// //                     onClick={handleRowClick}
// //                     style={isLocked ? { cursor: "default" } : undefined}
// //                   >
// //                     <td>{formatFullDate(tx.transaction_date)}</td>

// //                     <td className={amountClass}>{typeLabel}</td>

// //                     <td className={`num ${amountClass}`}>
// //                       {sign}
// //                       {formatCurrency(tx.amount)}
// //                     </td>

// //                     <td>{tx.transaction_summary || (isInitial ? "Initial cash" : "—")}</td>
// //                   </tr>
// //                 );
// //               })}
// //             </tbody>
// //           </table>
// //         </div>
// //       ) : (
// //         <div className="table-empty-state">
// //           <EmptyState
// //             description="Add your first deposit or withdrawal to begin tracking activity."
// //             onAction={onAdd}
// //           />
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default TransactionsTable;

// // // // src/components/transactions/TransactionTable.jsx

// // // import React from "react";
// // // import { formatCurrency, formatFullDate } from "../../func/formatters";

// // // const TransactionsTable = ({ transactions = [], onAdd, onEdit }) => {
// // //   return (
// // //     <div className="table-wrapper">
// // //       <div className="table-header">
// // //         <h3 className="table-title">Transactions</h3>

// // //         <button
// // //           className="table-add-btn has-tooltip"
// // //           onClick={onAdd}
// // //           data-tooltip="New Entry"
// // //         >
// // //           +
// // //         </button>
// // //       </div>

// // //       <div className="divider" />

// // //       <table className="table">
// // //         <thead>
// // //           <tr>
// // //             <th>Date</th>
// // //             <th>Type</th>
// // //             <th>Amount</th>
// // //             <th>Summary</th>
// // //           </tr>
// // //         </thead>

// // //         <tbody>
// // //           {transactions.length === 0 && (
// // //             <tr>
// // //               <td colSpan="4" style={{ textAlign: "center", opacity: 0.6 }}>
// // //                 No transactions yet
// // //               </td>
// // //             </tr>
// // //           )}

// // //           {transactions.map((tx) => {
// // //             const isInitial = Boolean(tx.is_initial_cash);
// // //             const isDerived = Boolean(tx.__derived);
// // //             const isLocked = isInitial || isDerived;

// // //             const typeLabel = isInitial ? "initial cash" : tx.transaction_type;

// // //             const sign = tx.transaction_type === "withdrawal" ? "-" : "+";
// // //             const amountClass = tx.transaction_type === "deposit" ? "positive" : "negative";

// // //             const rowKey =
// // //               tx.id ?? `${tx.transaction_date}-${tx.transaction_type}-${tx.amount}`;

// // //             const handleRowClick = () => {
// // //               if (isLocked) return;
// // //               if (typeof onEdit === "function") onEdit(tx);
// // //             };

// // //             return (
// // //               <tr
// // //                 key={rowKey}
// // //                 className={`row ${isLocked ? "muted locked" : ""}`}
// // //                 onClick={handleRowClick}
// // //                 style={isLocked ? { cursor: "default" } : undefined}
// // //               >
// // //                 <td>{formatFullDate(tx.transaction_date)}</td>

// // //                 <td className={amountClass}>{typeLabel}</td>

// // //                 <td className={`num ${amountClass}`}>
// // //                   {sign}
// // //                   {formatCurrency(tx.amount)}
// // //                 </td>

// // //                 <td>{tx.transaction_summary || (isInitial ? "Initial cash" : "—")}</td>
// // //               </tr>
// // //             );
// // //           })}
// // //         </tbody>
// // //       </table>
// // //     </div>
// // //   );
// // // };

// // // export default TransactionsTable;


// // // // // src/components/transactions/TransactionTable.jsx

// // // // import React from "react";
// // // // import { formatCurrency, formatFullDate } from "../../func/formatters";

// // // // const TransactionsTable = ({ transactions = [], onAdd, onEdit }) => {
// // // //   return (
// // // //     <div className="table-wrapper">
// // // //       <div className="table-header">
// // // //         <h3 className="table-title">Transactions</h3>

// // // //         <button
// // // //           className="table-add-btn has-tooltip"
// // // //           onClick={onAdd}
// // // //           data-tooltip="New Entry"
// // // //         >
// // // //           +
// // // //         </button>
// // // //       </div>

// // // //       <div className="divider" />

// // // //       <table className="table">
// // // //         <thead>
// // // //           <tr>
// // // //             <th>Date</th>
// // // //             <th>Type</th>
// // // //             {/* <th>Timing</th> */}
// // // //             <th>Amount</th>
// // // //             <th>Summary</th>
// // // //           </tr>
// // // //         </thead>

// // // //         <tbody>
// // // //           {transactions.length === 0 && (
// // // //             <tr>
// // // //               <td colSpan="5" style={{ textAlign: "center", opacity: 0.6 }}>
// // // //                 No transactions yet
// // // //               </td>
// // // //             </tr>
// // // //           )}

// // // //           {transactions.map((tx) => {
// // // //             const isInitial = Boolean(tx.is_initial_cash);
// // // //             const isDerived = Boolean(tx.__derived);

// // // //             // lock initial cash + derived rows
// // // //             const isLocked = isInitial || isDerived;

// // // //             const typeLabel = isInitial ? "initial cash" : tx.transaction_type;

// // // //             // const timingLabel = tx.timing === "pre_open" ? "pre-open" : "after close";

// // // //             const sign = tx.transaction_type === "withdrawal" ? "-" : "+";
// // // //             const amountClass = tx.transaction_type === "deposit" ? "positive" : "negative";

// // // //             return (
// // // //               <tr
// // // //                 key={tx.id}
// // // //                 className={`row ${isLocked ? "muted locked" : ""}`}
// // // //                 onClick={() => {
// // // //                   if (isLocked) return;
// // // //                   if (onEdit) onEdit(tx);
// // // //                 }}
// // // //                 // title={isLocked ? "Locked entry" : "Click to edit"}
// // // //                 style={isLocked ? { cursor: "default" } : undefined}
// // // //               >
// // // //                 <td>{formatFullDate(tx.transaction_date)}</td>

// // // //                 <td className={amountClass}>{typeLabel}</td>

// // // //                 {/* <td style={{ opacity: 0.8 }}>{timingLabel}</td> */}

// // // //                 <td className={`num ${amountClass}`}>
// // // //                   {sign}
// // // //                   {formatCurrency(tx.amount)}
// // // //                 </td>

// // // //                 <td>{tx.transaction_summary || (isInitial ? "Initial cash" : "—")}</td>
// // // //               </tr>
// // // //             );
// // // //           })}
// // // //         </tbody>
// // // //       </table>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default TransactionsTable;


// // // // // //src/components/transactions/TransactionTable.jsx

// // // // // import React from "react";
// // // // // import {
// // // // //   formatCurrency,
// // // // //   formatFullDate
// // // // // } from "../../func/formatters";

// // // // // const TransactionsTable = ({ transactions, onAdd, onEdit }) => {
// // // // //   return (
// // // // //     <div className="table-wrapper">
// // // // //       <div className="table-header">
// // // // //         <h3 className="table-title">Transactions</h3>

// // // // //         <button
// // // // //           className="table-add-btn has-tooltip"
// // // // //           onClick={onAdd}
// // // // //           data-tooltip="New Entry"
// // // // //         >
// // // // //           +
// // // // //         </button>
// // // // //       </div>

// // // // //       <div className="divider" />

// // // // //       <table className="table">
// // // // //         <thead>
// // // // //           <tr>
// // // // //             <th>Date</th>
// // // // //             <th>Type</th>
// // // // //             <th>Amount</th>
// // // // //             <th>Summary</th>
// // // // //           </tr>
// // // // //         </thead>

// // // // //         <tbody>
// // // // //           {transactions.length === 0 && (
// // // // //             <tr>
// // // // //               <td colSpan="4" style={{ textAlign: "center", opacity: 0.6 }}>
// // // // //                 No transactions yet
// // // // //               </td>
// // // // //             </tr>
// // // // //           )}

// // // // //           {transactions.map(tx => (
// // // // //             <tr
// // // // //                 key={tx.id}
// // // // //                 // className="trade-row"
// // // // //                 className={`row ${tx.__derived ? "muted" : ""}`}
// // // // //                 onClick={() => !tx.__derived && onEdit(tx)}
// // // // //             >

// // // // //               {/* Date */}
// // // // //               <td>{formatFullDate(tx.transaction_date)}</td>

// // // // //               {/* Type */}
// // // // //               <td
// // // // //                 className={
// // // // //                   tx.transaction_type === "deposit"
// // // // //                     ? "positive"
// // // // //                     : "negative"
// // // // //                 }
// // // // //               >
// // // // //                 {tx.transaction_type}
// // // // //               </td>

// // // // //               {/* Amount */}
// // // // //               <td
// // // // //                 className={`num ${
// // // // //                   tx.transaction_type === "deposit"
// // // // //                     ? "positive"
// // // // //                     : "negative"
// // // // //                 }`}
// // // // //               >
// // // // //                 {tx.transaction_type === "withdrawal" ? "-" : "+"}
// // // // //                 {formatCurrency(tx.amount)}
// // // // //               </td>

// // // // //               {/* Summary */}
// // // // //               <td>{tx.transaction_summary || "—"}</td>
// // // // //             </tr>
// // // // //           ))}
// // // // //         </tbody>
// // // // //       </table>
// // // // //     </div>
// // // // //   );
// // // // // };

// // // // // export default TransactionsTable;
