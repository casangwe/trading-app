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
      // cashBalance,
    };

    return analysisResults;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};
