import React from "react";
import Financial from "../controllers/financial/Financial";
import NetWorthChart from "../controllers/financial/NetWorthChart";
import AccountDistributionChart from "../controllers/financial/AccountDistributionChart";
import SavingsGrowthChart from "../controllers/financial/SavingsGrowthChart";
import NetworthCash from "../controllers/financial/NetworthCash";

const Networth = () => {
  return (
    <div className="networth">
      <div className="networth-and-cash-container">
        <div className="networth-chart-networth">
          <NetWorthChart />
        </div>
        <div className="networth-cash-networth">
          <NetworthCash />
        </div>
      </div>

      <div className="savings-account-charts-container">
        <div className="account-distribution-chart">
          <AccountDistributionChart />
        </div>
        <div className="savings-growth-chart">
          <SavingsGrowthChart />
        </div>
      </div>

      <div className="financial-table-section">
        <Financial />
      </div>
    </div>
  );
};

export default Networth;
