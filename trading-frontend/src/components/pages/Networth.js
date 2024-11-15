import React from "react";
import Financial from "../controllers/financial/Financial";
import NetWorthChart from "../controllers/financial/NetWorthChart";
import AccountDistributionChart from "../controllers/financial/AccountDistributionChart";
import IncomeExpensesComparisonChart from "../controllers/financial/IncomeExpensesComparisonChart";
import SavingsGrowthChart from "../controllers/financial/SavingsGrowthChart";

const Networth = () => {
  return (
    <div className="networth-page-container">
      <div className="networth-chart-section">
        <NetWorthChart />
      </div>

      <div className="financial-table-section">
        <Financial />
      </div>

      <div className="savings-account-charts-container">
        <div className="account-distribution-chart">
          <AccountDistributionChart />
        </div>
        <div className="savings-growth-chart">
          <SavingsGrowthChart />
        </div>
      </div>

      <div className="income-expenses-chart-section">
        <IncomeExpensesComparisonChart />
      </div>
    </div>
  );
};

export default Networth;
