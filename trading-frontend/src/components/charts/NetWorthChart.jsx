// src/components/charts/NetWorthChart.jsx
import React, { useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatCurrency, formatDate } from "../../func/formatters";

const NetWorthChart = ({ entries = [] }) => {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const [activeKey, setActiveKey] = useState(null);

  const { latest, previous } = useMemo(() => {
    if (!safeEntries.length) return { latest: null, previous: null };

    const sorted = [...safeEntries]
      .filter((e) => e && e.entry_date)
      .sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));

    const latestEntry = sorted[sorted.length - 1] || null;
    const prevEntry = sorted.length > 1 ? sorted[sorted.length - 2] : latestEntry;

    return { latest: latestEntry, previous: prevEntry };
  }, [safeEntries]);

  const summary = useMemo(() => {
    if (!latest) return { current: 0, previous: 0, change: 0, percent: 0 };

    const current = Number(latest.networth || 0);
    const prev = Number(previous?.networth || 0);
    const change = current - prev;
    const percent = prev !== 0 ? (change / prev) * 100 : 0;

    return { current, previous: prev, change, percent };
  }, [latest, previous]);

  const notesText = useMemo(() => {
    if (!latest) return "";
    return (
      latest.notes ||
      latest.note ||
      latest.comment ||
      latest.comments ||
      latest.description ||
      ""
    );
  }, [latest]);

  const entryDateLabel = useMemo(() => {
    if (!latest?.entry_date) return "";
    return formatDate(latest.entry_date);
  }, [latest]);

  const jarRows = useMemo(() => {
    if (!latest) return [];

    const keys = [
      { key: "nec", label: "NEC" },
      { key: "ffa", label: "FFA" },
      { key: "play", label: "PLAY" },
      { key: "ltss", label: "LTSS" },
      { key: "give", label: "GIVE" },
    ];

    const colors = {
      NEC: "#9ebadb",
      FFA: "#9ab7a5",
      PLAY: "#e29c4a",
      LTSS: "#4a90e2",
      GIVE: "#aea0a0",
    };

    return keys.map((k) => {
      const cur = Number(latest[k.key] || 0);
      const prev = Number(previous?.[k.key] || 0);

      return {
        key: k.label,
        label: k.label,
        value: Number.isFinite(cur) ? cur : 0,
        prevValue: Number.isFinite(prev) ? prev : 0,
        fill: colors[k.label] || "#4a90e2",
      };
    });
  }, [latest, previous]);

  const pieKey = useMemo(() => {
    if (!latest) return "pie-empty";
    const valuesSig = jarRows.map((r) => `${r.key}:${r.value}`).join("|");
    return `pie-${latest.entry_date}-${valuesSig}`;
  }, [latest, jarRows]);

  if (!latest) return null;

  return (
    <div className="networth-donut-shell">
      <div className="networth-left">
        <div className="networth-summary-block">
          <div className="investment-account">{formatCurrency(summary.current)}</div>

          <div className="investment-equity">
            Previous: {formatCurrency(summary.previous)}
          </div>

          <div className={`investment-pnl ${summary.change >= 0 ? "positive" : "negative"}`}>
            Change: {formatCurrency(summary.change)}
          </div>

          <div className={`investment-roi ${summary.percent >= 0 ? "positive" : "negative"}`}>
            {summary.percent.toFixed(2)}%
          </div>
        </div>

        <div className="networth-notes-block">
          <div className="networth-notes-text">
            {notesText ? notesText : "No notes for this entry."}
          </div>

          <div className="networth-notes-date">{entryDateLabel}</div>
        </div>
      </div>

      <div className="networth-right">
        <div className="networth-donut-wrap">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                key={pieKey}                         
                data={jarRows}
                dataKey="value"
                nameKey="label"
                innerRadius="62%"
                outerRadius="90%"
                paddingAngle={2}
                onMouseEnter={(_, idx) => setActiveKey(jarRows[idx]?.key || null)}
                onMouseLeave={() => setActiveKey(null)}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={900}
              >
                {jarRows.map((r) => (
                  <Cell
                    key={r.key}
                    fill={r.fill}
                    opacity={activeKey && activeKey !== r.key ? 0.35 : 1}
                  />
                ))}
              </Pie>

              <Tooltip
                cursor={false}
                content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const p = payload[0]?.payload;
                  if (!p) return null;

                  return (
                    <div className="networth-jar-tooltip">
                      <p className="networth-jar-tooltip-title">{p.label}</p>
                      <p>{formatCurrency(p.value)}</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default NetWorthChart;

