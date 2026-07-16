// src/components/transactions/TransactionEntry.jsx

import React, { useState } from "react";
import { createTransaction } from "../../api/transactions.api";

const TransactionEntry = ({ onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    transaction_type: "deposit",
    timing: "after_close",
    transaction_date: "",
    amount: "",
    transaction_summary: "",
  });

  const setType = (nextType) => {
    setForm((prev) => ({
      ...prev,
      transaction_type: nextType,
      timing: "after_close",
    }));
  };

  const setTiming = (nextTiming) => {
    setForm((prev) => ({
      ...prev,
      timing: nextTiming,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await createTransaction({
      transaction_type: form.transaction_type,
      timing: form.timing,
      transaction_date: form.transaction_date,
      amount: Number(form.amount),
      transaction_summary: form.transaction_summary || null,
      // We intentionally do NOT send is_initial_cash from the UI anymore.
      // Backend can manage initial cash rules separately.
    });

    if (typeof onSuccess === "function") onSuccess();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (typeof onCancel === "function") onCancel();
    }
  };

  // const isWithdrawal = form.transaction_type === "withdrawal";

  return (
    <form className="entry-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      <label>Type</label>
      <div className="option-toggle">
        <button
          type="button"
          className={`option-btn ${form.transaction_type === "deposit" ? "active" : ""}`}
          onClick={() => setType("deposit")}
        >
          Deposit
        </button>

        <div className="option-divider" />

        <button
          type="button"
          className={`option-btn ${form.transaction_type === "withdrawal" ? "active" : ""}`}
          onClick={() => setType("withdrawal")}
        >
          Withdrawal
        </button>
      </div>

      <label>Date</label>
      <input
        name="transaction_date"
        type="date"
        value={form.transaction_date}
        onChange={handleChange}
        required
        autoFocus
      />

      <label>Amount</label>
      <input
        name="amount"
        type="text"
        value={form.amount}
        onChange={handleChange}
        placeholder="0.00"
        required
      />

      <label>Summary</label>
      <input
        name="transaction_summary"
        value={form.transaction_summary}
        onChange={handleChange}
      />

      <label>Timing</label>
      <div className="option-toggle">
        <button
          type="button"
          className={`option-btn ${form.timing === "pre_open" ? "active" : ""}`}
          onClick={() => setTiming("pre_open")}
        >
          Before open
        </button>

        <div className="option-divider" />

        <button
          type="button"
          className={`option-btn ${form.timing === "after_close" ? "active" : ""}`}
          onClick={() => setTiming("after_close")}
          // optional: you may want withdrawals to default to after_close but still editable.
          // If you want to FORCE withdrawals to after_close, uncomment this:
          // disabled={isWithdrawal}
        >
          After close
        </button>
      </div>

      <button className="btn primary">Add transaction</button>
    </form>
  );
};

export default TransactionEntry;


// // src/components/transactions/TransactionEntry.jsx

// import React, { useEffect, useState } from "react";
// import { createTransaction } from "../../api/transactions.api";

// const TransactionEntry = ({ onSuccess, onCancel }) => {
//   const [form, setForm] = useState({
//     transaction_type: "deposit",
//     timing: "pre_open",
//     is_initial_cash: false,
//     transaction_date: "",
//     amount: "",
//     transaction_summary: "",
//   });

//   // Keep timing sensible when type changes
//   useEffect(() => {
//     setForm((prev) => {
//       const nextTiming =
//         prev.transaction_type === "deposit" ? "pre_open" : "after_close";

//       // if it's not a deposit, initial cash can't be true
//       const nextInitial =
//         prev.transaction_type === "deposit" ? prev.is_initial_cash : false;

//       return { ...prev, timing: nextTiming, is_initial_cash: nextInitial };
//     });
//   }, [form.transaction_type]);

//   // If user marks "Initial Cash", force timing pre_open
//   useEffect(() => {
//     if (!form.is_initial_cash) return;
//     setForm((prev) => ({ ...prev, timing: "pre_open" }));
//   }, [form.is_initial_cash]);

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setForm((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     await createTransaction({
//       transaction_type: form.transaction_type,
//       timing: form.timing,
//       is_initial_cash: form.is_initial_cash,
//       transaction_date: form.transaction_date,
//       amount: Number(form.amount),
//       transaction_summary: form.transaction_summary || null,
//     });

//     if (onSuccess) onSuccess();
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Escape") {
//       e.preventDefault();
//       if (onCancel) onCancel(); // ✅ fixes no-unused-expressions
//     }
//   };

//   return (
//     <form className="entry-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
//       <label>Type</label>
//       <div className="option-toggle">
//         <button
//           type="button"
//           className={`option-btn ${form.transaction_type === "deposit" ? "active" : ""}`}
//           onClick={() => setForm((prev) => ({ ...prev, transaction_type: "deposit" }))}
//         >
//           Deposit
//         </button>

//         <div className="option-divider" />

//         <button
//           type="button"
//           className={`option-btn ${form.transaction_type === "withdrawal" ? "active" : ""}`}
//           onClick={() => setForm((prev) => ({ ...prev, transaction_type: "withdrawal" }))}
//         >
//           Withdrawal
//         </button>
//       </div>

//       {/* {form.transaction_type === "deposit" && (
//         <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
//           <input
//             type="checkbox"
//             name="is_initial_cash"
//             checked={form.is_initial_cash}
//             onChange={handleChange}
//           />
//           Mark as Initial Cash
//         </label>
//       )} */}

//       <label>Date</label>
//       <input
//         name="transaction_date"
//         type="date"
//         value={form.transaction_date}
//         onChange={handleChange}
//         required
//         autoFocus
//       />

//       <label>Amount</label>
//       <input
//         name="amount"
//         type="text"
//         value={form.amount}
//         onChange={handleChange}
//         placeholder="0.00"
//         required
//       />

//       <label>Summary</label>
//       <input
//         name="transaction_summary"
//         value={form.transaction_summary}
//         onChange={handleChange}
//       />

//       <label>Timing</label>
//       <div className="option-toggle">
//         <button
//           type="button"
//           className={`option-btn ${form.timing === "pre_open" ? "active" : ""}`}
//           onClick={() => setForm((prev) => ({ ...prev, timing: "pre_open" }))}
//           disabled={form.is_initial_cash}
//         >
//           Pre-open
//         </button>

//         <div className="option-divider" />

//         <button
//           type="button"
//           className={`option-btn ${form.timing === "after_close" ? "active" : ""}`}
//           onClick={() => setForm((prev) => ({ ...prev, timing: "after_close" }))}
//           disabled={form.is_initial_cash}
//         >
//           After close
//         </button>
//       </div>
//       <button className="btn primary">Add transaction</button>
//     </form>
//   );
// };

// export default TransactionEntry;


// // // src/components/transactions/TransactionEntry.jsx

// // import React, { useEffect, useState } from "react";
// // import { createTransaction } from "../../api/transactions.api";

// // const TransactionEntry = ({ onSuccess, onCancel }) => {
// //   const [form, setForm] = useState({
// //     transaction_type: "deposit",
// //     timing: "pre_open",          // ✅ NEW
// //     is_initial_cash: false,      // ✅ NEW
// //     transaction_date: "",
// //     amount: "",
// //     transaction_summary: "",
// //   });

// //   // Keep timing sensible when type changes
// //   useEffect(() => {
// //     setForm((prev) => {
// //       const nextTiming =
// //         prev.transaction_type === "deposit" ? "pre_open" : "after_close";

// //       // if it's not a deposit, initial cash can't be true
// //       const nextInitial = prev.transaction_type === "deposit" ? prev.is_initial_cash : false;

// //       return { ...prev, timing: nextTiming, is_initial_cash: nextInitial };
// //     });
// //   }, [form.transaction_type]);

// //   // If user marks "Initial Cash", force timing pre_open
// //   useEffect(() => {
// //     if (!form.is_initial_cash) return;
// //     setForm((prev) => ({ ...prev, timing: "pre_open" }));
// //   }, [form.is_initial_cash]);

// //   const handleChange = (e) => {
// //     const { name, value, type, checked } = e.target;
// //     setForm((prev) => ({
// //       ...prev,
// //       [name]: type === "checkbox" ? checked : value,
// //     }));
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();

// //     await createTransaction({
// //       transaction_type: form.transaction_type,
// //       timing: form.timing,
// //       is_initial_cash: form.is_initial_cash,
// //       transaction_date: form.transaction_date,
// //       amount: Number(form.amount),
// //       transaction_summary: form.transaction_summary || null,
// //     });

// //     onSuccess();
// //   };

// //   const handleKeyDown = (e) => {
// //     if (e.key === "Escape") {
// //       e.preventDefault();
// //       onCancel?.();
// //     }
// //   };

// //   return (
// //     <form className="entry-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
// //       <label>Type</label>
// //       <div className="option-toggle">
// //         <button
// //           type="button"
// //           className={`option-btn ${form.transaction_type === "deposit" ? "active" : ""}`}
// //           onClick={() => setForm((prev) => ({ ...prev, transaction_type: "deposit" }))}
// //         >
// //           Deposit
// //         </button>

// //         <div className="option-divider" />

// //         <button
// //           type="button"
// //           className={`option-btn ${form.transaction_type === "withdrawal" ? "active" : ""}`}
// //           onClick={() => setForm((prev) => ({ ...prev, transaction_type: "withdrawal" }))}
// //         >
// //           Withdrawal
// //         </button>
// //       </div>

// //       {/* ✅ NEW: Timing */}
// //       <label>Timing</label>
// //       <div className="option-toggle">
// //         <button
// //           type="button"
// //           className={`option-btn ${form.timing === "pre_open" ? "active" : ""}`}
// //           onClick={() => setForm((prev) => ({ ...prev, timing: "pre_open" }))}
// //           disabled={form.transaction_type === "withdrawal" && form.is_initial_cash}
// //         >
// //           Pre-open
// //         </button>

// //         <div className="option-divider" />

// //         <button
// //           type="button"
// //           className={`option-btn ${form.timing === "after_close" ? "active" : ""}`}
// //           onClick={() => setForm((prev) => ({ ...prev, timing: "after_close" }))}
// //           disabled={form.is_initial_cash}
// //         >
// //           After close
// //         </button>
// //       </div>

// //       {/* ✅ NEW: Initial Cash */}
// //       {form.transaction_type === "deposit" && (
// //         <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
// //           <input
// //             type="checkbox"
// //             name="is_initial_cash"
// //             checked={form.is_initial_cash}
// //             onChange={handleChange}
// //           />
// //           Mark as Initial Cash
// //         </label>
// //       )}

// //       <label>Date</label>
// //       <input
// //         name="transaction_date"
// //         type="date"
// //         value={form.transaction_date}
// //         onChange={handleChange}
// //         required
// //         autoFocus
// //       />

// //       <label>Amount</label>
// //       <input
// //         name="amount"
// //         type="text"
// //         value={form.amount}
// //         onChange={handleChange}
// //         placeholder="0.00"
// //         required
// //       />

// //       <label>Summary</label>
// //       <input
// //         name="transaction_summary"
// //         value={form.transaction_summary}
// //         onChange={handleChange}
// //       />

// //       <button className="btn primary">Add transaction</button>
// //     </form>
// //   );
// // };

// // export default TransactionEntry;


// // // // src/components/transactions/TransactionEntry.jsx

// // // import React, { useState } from "react";
// // // import { createTransaction } from "../../api/transactions.api";

// // // const TransactionEntry = ({ onSuccess, onCancel }) => {
// // //   const [form, setForm] = useState({
// // //     transaction_type: "deposit",
// // //     transaction_date: "",
// // //     amount: "",
// // //     transaction_summary: "",
// // //   });

// // //   const handleChange = (e) => {
// // //     setForm((prev) => ({
// // //       ...prev,
// // //       [e.target.name]: e.target.value,
// // //     }));
// // //   };

// // //   const handleSubmit = async (e) => {
// // //     e.preventDefault();

// // //     await createTransaction({
// // //       transaction_type: form.transaction_type,
// // //       transaction_date: form.transaction_date,
// // //       amount: Number(form.amount),
// // //       transaction_summary: form.transaction_summary || null,
// // //     });

// // //     onSuccess();
// // //   };

// // //   const handleKeyDown = (e) => {
// // //     if (e.key === "Escape") {
// // //       e.preventDefault();
// // //       if (onCancel) {
// // //         onCancel();
// // //       }
// // //     }
// // //   };

// // //   return (
// // //     <form
// // //       className="entry-form"
// // //       onSubmit={handleSubmit}
// // //       onKeyDown={handleKeyDown}
// // //     >
// // //       <label>Type</label>
// // //       <div className="option-toggle">
// // //         <button
// // //           type="button"
// // //           className={`option-btn ${
// // //             form.transaction_type === "deposit" ? "active" : ""
// // //           }`}
// // //           onClick={() =>
// // //             setForm((prev) => ({ ...prev, transaction_type: "deposit" }))
// // //           }
// // //         >
// // //           Deposit
// // //         </button>

// // //         <div className="option-divider" />

// // //         <button
// // //           type="button"
// // //           className={`option-btn ${
// // //             form.transaction_type === "withdrawal" ? "active" : ""
// // //           }`}
// // //           onClick={() =>
// // //             setForm((prev) => ({ ...prev, transaction_type: "withdrawal" }))
// // //           }
// // //         >
// // //           Withdrawal
// // //         </button>
// // //       </div>

// // //       <label>Date</label>
// // //       <input
// // //         name="transaction_date"
// // //         type="date"
// // //         value={form.transaction_date}
// // //         onChange={handleChange}
// // //         required
// // //         autoFocus
// // //       />

// // //       <label>Amount</label>
// // //       <input
// // //         name="amount"
// // //         type="text"
// // //         value={form.amount}
// // //         onChange={handleChange}
// // //         placeholder="0.00"
// // //         required
// // //       />

// // //       <label>Summary</label>
// // //       <input
// // //         name="transaction_summary"
// // //         value={form.transaction_summary}
// // //         onChange={handleChange}
// // //         // placeholder="Optional note"
// // //       />

// // //       <button className="btn primary">Add transaction</button>
// // //     </form>
// // //   );
// // // };

// // // export default TransactionEntry;
