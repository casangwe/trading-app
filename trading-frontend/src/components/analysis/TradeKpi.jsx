
// src/components/analysis/TradeKpi.jsx
import React from "react";

const TradeKpi = ({ stats }) => {
  if (!stats) return <div className="analysis-summary" />;

  return (
    <div className="analysis-summary">
      <div className="analysis-circle-summary">
        <div className="circle trades">
          <p>{stats.total_trades ?? 0}</p>
          <h3>Trades</h3>
        </div>

        <div className="circle wins">
          <p>{stats.wins ?? 0}</p>
          <h3>Wins</h3>
        </div>

        <div className="circle win-rate">
          <p>{Number(stats.win_rate ?? 0).toFixed(1)}%</p>
          <h3>Win Rate</h3>
        </div>

        <div className="circle losses">
          <p>{stats.losses ?? 0}</p>
          <h3>Losses</h3>
        </div>

        <div className="circle profit-factor">
          <p>{Number(stats.profit_factor ?? 0).toFixed(2)}</p>
          <h3>Profit Factor</h3>
        </div>

        <div className="circle expectancy">
          <p>{Number(stats.expectancy ?? 0).toFixed(2)}</p>
          <h3>Expectancy</h3>
        </div>

        <div className="circle payoff">
          <p>{Number(stats.reward_per_dollar_risk ?? stats.payoff_ratio ?? 0).toFixed(2)}</p>
          <h3>R/R</h3>
        </div>

        {/* <div className="circle payoff">
          <p>{Number(stats.payoff_ratio ?? 0).toFixed(2)}</p>
          <h3>Payoff</h3>
        </div> */}

        {/* Leave this in  */}
        {/* <div className="circle max-dd">
          <p>{Number(stats.max_drawdown_percent ?? 0).toFixed(1)}%</p>
          <h3>Max Drawdown</h3>
        </div> */}

        <div className="circle avg-hold">
          <p>{stats.avg_hold_time_days_rounded ?? 0}</p>
          <h3>Days</h3>
        </div>
      </div>
    </div>
  );
};

export default TradeKpi;
