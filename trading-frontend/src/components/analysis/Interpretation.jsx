// src/components/analysis/Interpretation.jsx
import React, { useMemo } from "react";
import { formatCurrency } from "../../func/formatters";

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (v, d = 2) => n(v).toFixed(d);

const Interpretation = ({ stats }) => {
  const tiles = useMemo(() => {
    if (!stats) return [];

    // Core
    const totalTrades = n(stats.total_trades);
    const wins = n(stats.wins);
    const losses = n(stats.losses);
    const winRate = n(stats.win_rate);

    // System metrics
    const profitFactor = n(stats.profit_factor);
    const rewardPerRisk = n(stats.reward_per_dollar_risk ?? stats.payoff_ratio);
    const expectancy = n(stats.expectancy);

    const grossProfit = n(stats.gross_profit);
    const grossLoss = Math.abs(n(stats.gross_loss));
    const netPnl = n(stats.net_pnl);

    const holdDays = n(stats.avg_hold_time_days_rounded ?? 0);
    const maxDD = n(stats.max_drawdown_percent); 

    // Helper blurbs (short, non-essay)
    const winRateText =
      winRate >= 60
        ? "High win rate. Make sure losses stay controlled."
        : winRate >= 50
        ? "Solid win rate. Payoff matters for growth."
        : winRate >= 40
        ? "Moderate win rate. You need bigger winners."
        : "Low win rate. Improve entries or tighten risk.";

    const pfText =
      profitFactor >= 2
        ? "Strong. Profits are about 2x losses."
        : profitFactor >= 1.25
        ? "Positive. Edge is there but not huge."
        : profitFactor > 1
        ? "Slight edge. Execution matters."
        : "Not profitable yet. Losses outweigh gains.";

    const rprText =
      rewardPerRisk >= 2
        ? "Excellent payoff. Wins are large."
        : rewardPerRisk >= 1.3
        ? "Healthy payoff. Good structure."
        : rewardPerRisk >= 1
        ? "Break-even payoff. Needs better exits."
        : "Low payoff. Losses are too large.";

    const expText =
      expectancy > 0
        ? "Positive expectancy: system earns per trade."
        : expectancy < 0
        ? "Negative expectancy: system loses per trade."
        : "Break-even expectancy.";

    const holdText =
      holdDays >= 7
        ? "Week+ holds. Overnight and weekend risk matters."
        : holdDays >= 3
        ? "Swing holds. Manage multi-day risk + decay."
        : holdDays >= 1
        ? "Overnight holds. Gaps matter."
        : "Mostly intraday behavior.";

    const ddAbs = Math.abs(maxDD);
    const ddText =
      ddAbs >= 50
        ? "Very high drawdown. Risk sizing needs work."
        : ddAbs >= 20
        ? "Moderate drawdown. Add tighter risk rails."
        : ddAbs > 0
        ? "Controlled drawdown."
        : "No drawdown measured.";

    // 3 columns x 4 rows
    return [
      // Column 1: Simple trade details
      {
        group: "Trades",
        title: "Trades",
        value: String(totalTrades),
        desc: "Total number of trades in this period.",
      },
      {
        group: "Trades",
        title: "Wins",
        value: String(wins),
        desc: "Trades closed green.",
      },
      {
        group: "Trades",
        title: "Losses",
        value: String(losses),
        desc: "Trades closed red.",
      },
      {
        group: "Trades",
        title: "Win Rate",
        value: `${fmt(winRate, 1)}%`,
        desc: winRateText,
      },

      // Column 2: Outcome / System quality
      {
        group: "System",
        title: "Profit Factor",
        value: fmt(profitFactor, 2),
        desc: pfText,
      },
      {
        group: "System",
        title: "Risk per Reward",
        value: fmt(rewardPerRisk, 2),
        desc: `For every $1 risked, avg reward is $${fmt(rewardPerRisk, 2)}. ${rprText}`,
      },
      {
        group: "System",
        title: "Max Drawdown",
        value: `${fmt(maxDD, 1)}%`,
        desc: ddText,
      },
      {
        group: "System",
        title: "Avg Hold Time",
        value: `${holdDays} day${holdDays === 1 ? "" : "s"}`,
        desc: holdText,
      },

      // Column 3: Financial
      {
        group: "Financial",
        title: "Expectancy",
        value: formatCurrency(expectancy),
        desc: expText,
      },
      {
        group: "Financial",
        title: "Gross Profit",
        value: formatCurrency(grossProfit),
        desc: "Total dollars from winning trades.",
      },
      {
        group: "Financial",
        title: "Gross Loss",
        value: formatCurrency(grossLoss),
        desc: "Total dollars lost from losing trades.",
      },
      {
        group: "Financial",
        title: "Net PnL",
        value: formatCurrency(netPnl),
        desc: "Gross Profit minus Gross Loss.",
      },
    ];
  }, [stats]);

  if (!stats) return null;

  const groups = {
    Trades: tiles.filter((t) => t.group === "Trades"),
    System: tiles.filter((t) => t.group === "System"),
    Financial: tiles.filter((t) => t.group === "Financial"),
  };

  return (
    <div className="interp3-shell">
      <div className="interp3-col">
        {groups.Trades.map((t) => (
          <div className="interp3-tile" key={t.title}>
            <div className="interp3-title">{t.title}</div>
            <div className="interp3-divider" />
            <div className="interp3-value">{t.value}</div>
            <div className="interp3-desc">{t.desc}</div>
          </div>
        ))}
      </div>

      <div className="interp3-col">
        {groups.System.map((t) => (
          <div className="interp3-tile" key={t.title}>
            <div className="interp3-title">{t.title}</div>
            <div className="interp3-divider" />
            <div className="interp3-value">{t.value}</div>
            <div className="interp3-desc">{t.desc}</div>
          </div>
        ))}
      </div>

      <div className="interp3-col">
        {groups.Financial.map((t) => (
          <div className="interp3-tile" key={t.title}>
            <div className="interp3-title">{t.title}</div>
            <div className="interp3-divider" />
            <div className="interp3-value">{t.value}</div>
            <div className="interp3-desc">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Interpretation;