import { getCash } from "../api/CashApi";
import { fetchTrades } from "../api/TradesAPI";
import {
  calculateNumberOfTrades,
  calculateWinningTrades,
  calculateLosingTrades,
  calculateWinRate,
  calculateAverageWin,
  calculateAverageLoss,
  calculateRiskRewardRatio,
  calculateAbsoluteReturn,
  calculateSharpeRatio,
  calculateAverageDaysInTrade,
} from "./AnalysisCalc";

export const performAnalysis = async () => {
  try {
    const cashData = await getCash();
    const trades = await fetchTrades();

    console.log(cashData);
    console.log(trades);

    // Calculate metrics
    const numberOfTrades = calculateNumberOfTrades(trades);
    const winningTrades = calculateWinningTrades(trades);
    const losingTrades = calculateLosingTrades(trades);
    const winRate = calculateWinRate(trades);
    const averageWin = calculateAverageWin(trades);
    const averageLoss = calculateAverageLoss(trades);
    const riskRewardRatio = calculateRiskRewardRatio(trades);
    const absoluteReturn = calculateAbsoluteReturn(trades);
    const sharpeRatio = calculateSharpeRatio(trades);
    const avgDaysInTrade = calculateAverageDaysInTrade(trades);

    // Assuming netPL needs to be fetched or calculated elsewhere
    // const netPL = ...; // Fetch or calculate netPL
    // const cashBalance = calculateCashBalance(cashData.initial_cash, netPL);

    // Prepare the results object
    const analysisResults = {
      numberOfTrades,
      winningTrades,
      losingTrades,
      winRate,
      averageWin,
      averageLoss,
      riskRewardRatio,
      absoluteReturn,
      sharpeRatio,
      avgDaysInTrade,
      // cashBalance, // Uncomment if needed
    };

    console.log(analysisResults);

    return analysisResults;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};
