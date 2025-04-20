import React from "react";

const formatVolume = (num) => `${(num / 1_000_000).toFixed(1)}M`;
const formatPercent = (val) =>
  typeof val === "number" ? `${val > 0 ? "+" : ""}${val.toFixed(2)}%` : val;
const formatDate = (d) => (d ? new Date(d).toDateString() : "N/A");

const MetricFlow = ({ data }) => {
  const timeframes = ["2D", "1D", "Live"];

  const rows = [
    { label: "Scenario", key: "scenario", from: "self" },
    { label: "Score", key: "score", from: "self" },
    { label: "MFI", key: "mfi", type: "mfi" },
    { label: "MA(5)", key: "ma_5" },
    { label: "MA(9)", key: "ma_9" },
    {
      label: "% Change",
      key: "percent_change",
      from: "price_action",
      type: "percent",
    },
    {
      label: "Volume",
      key: "volume",
      from: "price_action",
      format: formatVolume,
    },
  ];

  const getValue = (block, key, from = "indicators") => {
    if (!block) return "N/A";
    if (!from || from === "self") return block[key] ?? "N/A";
    return block?.[from]?.[key] ?? "N/A";
  };

  const getCellStyle = (value, type) => {
    if (typeof value !== "number") return {};
    if (type === "rsi" && value < 30) return { color: "green" };
    if (type === "mfi" && value > 80) return { color: "red" };
    if (type === "percent") return { color: value < 0 ? "red" : "green" };
    return {};
  };

  return (
    <div className="metric-flow-cards">
      {timeframes.map((tf, i) => {
        const block = data?.[tf] || {};
        const sessionDate = block?.price_action?.date || "N/A";

        return (
          <div key={tf} className="metric-card">
            <div className="metric-header">
              <div className="metric-title">{tf}</div>
              <div className="session-date">{formatDate(sessionDate)}</div>
            </div>

            {rows.map(({ label, key, from, type, format }) => {
              const val = getValue(block, key, from);
              const numeric = typeof val === "number" ? val : parseFloat(val);
              const display =
                type === "percent" && typeof numeric === "number"
                  ? formatPercent(numeric)
                  : format
                  ? format(val)
                  : val;
              return (
                <div key={key} className="metric-row">
                  <div className="metric-label">{label}</div>
                  <div
                    className="metric-value"
                    style={getCellStyle(numeric, type)}
                  >
                    {display}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default MetricFlow;
