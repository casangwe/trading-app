// Calculate Number of Trades
export const calculateNumberOfTrades = (trades) => trades.length;

// Calculate Winning Trades
export const calculateWinningTrades = (trades) =>
  trades.filter((trade) => trade.exit_price - trade.entry_price > 0).length;

// Calculate Losing Trades
export const calculateLosingTrades = (trades) =>
  trades.filter((trade) => trade.exit_price - trade.entry_price < 0).length;

// Calculate Win Rate (percentage of winning trades)
export const calculateWinRate = (trades) => {
  const winningTrades = calculateWinningTrades(trades);
  const totalTrades = calculateNumberOfTrades(trades);
  return totalTrades === 0 ? 0 : (winningTrades / totalTrades) * 100;
};

// Calculate Average Win (average profit of winning trades)
export const calculateAverageWin = (trades) => {
  const winningTrades = trades.filter(
    (trade) => trade.exit_price - trade.entry_price > 0
  );
  const totalWin = winningTrades.reduce(
    (acc, trade) => acc + (trade.exit_price - trade.entry_price),
    0
  );
  return winningTrades.length === 0 ? 0 : totalWin / winningTrades.length;
};

// Calculate Average Loss (average loss of losing trades)
export const calculateAverageLoss = (trades) => {
  const losingTrades = trades.filter(
    (trade) => trade.exit_price - trade.entry_price < 0
  );
  const totalLoss = losingTrades.reduce(
    (acc, trade) => acc + Math.abs(trade.exit_price - trade.entry_price),
    0
  );
  return losingTrades.length === 0 ? 0 : totalLoss / losingTrades.length;
};

// Calculate Risk-Reward Ratio (average win over average loss)
export const calculateRiskRewardRatio = (trades) => {
  const averageWin = calculateAverageWin(trades);
  const averageLoss = calculateAverageLoss(trades);
  return averageLoss === 0 ? 0 : averageWin / averageLoss;
};

// Calculate Absolute Return (total profit/loss)
export const calculateAbsoluteReturn = (trades) => {
  const totalPL = trades.reduce(
    (acc, trade) => acc + (trade.exit_price - trade.entry_price),
    0
  );
  return totalPL;
};

// Calculate Sharpe Ratio
export const calculateSharpeRatio = (trades) => {
  const averageReturn = calculateAbsoluteReturn(trades) / trades.length;
  const standardDeviation = calculateStandardDeviation(trades);
  return standardDeviation === 0 ? 0 : averageReturn / standardDeviation;
};

// Calculate Standard Deviation of returns for Sharpe Ratio
export const calculateStandardDeviation = (trades) => {
  const returns = trades.map((trade) => trade.exit_price - trade.entry_price);
  const mean = returns.reduce((acc, value) => acc + value, 0) / returns.length;
  const variance =
    returns.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) /
    returns.length;
  return Math.sqrt(variance);
};

// Calculate Average Days in Trade
export const calculateAverageDaysInTrade = (trades) => {
  if (!trades || trades.length === 0) return 0;

  let totalDays = 0;
  let validTrades = 0;

  trades.forEach((trade) => {
    if (!trade.entry_date || !trade.close_date) return;

    const entryDate = new Date(trade.entry_date);
    const exitDate = new Date(trade.close_date);

    if (isNaN(entryDate.getTime()) || isNaN(exitDate.getTime())) {
      console.warn("Invalid date format for trade:", trade);
      return;
    }

    const diffTime = Math.abs(exitDate - entryDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    totalDays += diffDays;
    validTrades += 1;
  });

  return validTrades === 0 ? 0 : totalDays / validTrades;
};

// Calculate Cash Balance
export const calculateCashBalance = (initialCash, netPL) => {
  const initialCashNumber = Number(initialCash);
  const netPLNumber = Number(netPL);

  if (isNaN(initialCashNumber) || isNaN(netPLNumber)) {
    console.error("Invalid input to calculateCashBalance:", {
      initialCash,
      netPL,
    });
    return 0;
  }

  return initialCashNumber + netPLNumber;
};
