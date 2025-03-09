export const calculateInitialCash = (cashData) => {
  return cashData?.initial_cash ? Number(cashData.initial_cash) : 0;
};

export const calculateTotalDeposits = (transactions) => {
  if (!Array.isArray(transactions)) {
    console.error("Expected an array of transactions, but got:", transactions);
    return 0;
  }

  return transactions
    .filter((transaction) => transaction.transaction_type === "deposit")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
};

export const calculateTotalWithdrawals = (transactions) => {
  if (!Array.isArray(transactions)) {
    console.error("Expected an array of transactions, but got:", transactions);
    return 0;
  }

  return transactions
    .filter((transaction) => transaction.transaction_type === "withdrawal")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
};

export const calculateNetPL = (dailyPnls) => {
  return dailyPnls.reduce((totalPL, pnl) => {
    return totalPL + Number(pnl.balance);
  }, 0);
};

export const calculateAvailableCash = (initialCash, netPL, transactions) => {
  const totalDeposits = calculateTotalDeposits(transactions);
  const totalWithdrawals = calculateTotalWithdrawals(transactions);

  return initialCash + totalDeposits - totalWithdrawals + netPL;
};

export const calculateCashBalance = (initialCash, netPL, transactions) => {
  return calculateAvailableCash(initialCash, netPL, transactions);
};

export const calculateROI = (initialCash, netPL) => {
  if (initialCash === 0) return 0;
  return (netPL / initialCash) * 100;
};
