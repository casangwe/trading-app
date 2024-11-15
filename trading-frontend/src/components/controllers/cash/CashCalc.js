// Calculate Initial Cash (from API response)
export const calculateInitialCash = (cashData) => {
  return cashData?.initial_cash ? Number(cashData.initial_cash) : 0;
};

// // Calculate Total Deposits
// export const calculateTotalDeposits = (transactions) => {
//   return transactions
//     .filter((transaction) => transaction.transaction_type === "deposit")
//     .reduce((total, transaction) => total + Number(transaction.amount), 0);
// };

// // Calculate Total Withdrawals
// export const calculateTotalWithdrawals = (transactions) => {
//   return transactions
//     .filter((transaction) => transaction.transaction_type === "withdrawal")
//     .reduce((total, transaction) => total + Number(transaction.amount), 0);
// };

// Calculate Total Deposits
export const calculateTotalDeposits = (transactions) => {
  if (!Array.isArray(transactions)) {
    console.error("Expected an array of transactions, but got:", transactions);
    return 0;
  }

  return transactions
    .filter((transaction) => transaction.transaction_type === "deposit")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
};

// Calculate Total Withdrawals
export const calculateTotalWithdrawals = (transactions) => {
  if (!Array.isArray(transactions)) {
    console.error("Expected an array of transactions, but got:", transactions);
    return 0;
  }

  return transactions
    .filter((transaction) => transaction.transaction_type === "withdrawal")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
};

// Calculate Net Profit/Loss (from daily PNL data)
export const calculateNetPL = (dailyPnls) => {
  return dailyPnls.reduce((totalPL, pnl) => {
    return totalPL + Number(pnl.balance);
  }, 0);
};

// Calculate Available Cash (Initial Cash + Net P/L + Deposits - Withdrawals)
export const calculateAvailableCash = (initialCash, netPL, transactions) => {
  const totalDeposits = calculateTotalDeposits(transactions);
  const totalWithdrawals = calculateTotalWithdrawals(transactions);

  return initialCash + totalDeposits - totalWithdrawals + netPL;
};

// Calculate Cash Balance (same as available cash)
export const calculateCashBalance = (initialCash, netPL, transactions) => {
  return calculateAvailableCash(initialCash, netPL, transactions);
};

// Calculate Return on Investment (RoI) based on Initial Cash and Net P/L
export const calculateROI = (initialCash, netPL) => {
  if (initialCash === 0) return 0;
  return (netPL / initialCash) * 100;
};
