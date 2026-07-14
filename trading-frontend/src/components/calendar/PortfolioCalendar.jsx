// src/components/calendar/PortfolioCalendar.jsx

import React, { useMemo, useState } from "react";
import Calendar from "react-calendar";
import { formatCurrency } from "../../func/formatters";

const isoFromDate = (d) => d.toISOString().split("T")[0];
const monthKeyFromDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const yearKeyFromDate = (d) => String(d.getFullYear());

const PortfolioCalendar = ({
  charts = null,
  curveKey = "normalized_equity_curve",
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const curve = charts?.[curveKey] || [];
  const hasData = Array.isArray(curve) && curve.length > 0;

  // Build daily pnl map from equity curve
  const dailyPnlByDate = useMemo(() => {
    if (!hasData) return {};

    const pnl = {};
    for (let i = 0; i < curve.length; i++) {
      const iso = String(curve[i].date);
      const v = Number(curve[i].value ?? 0);

      if (i === 0) pnl[iso] = 0;
      else {
        const prevV = Number(curve[i - 1].value ?? 0);
        pnl[iso] = v - prevV;
      }
    }
    return pnl;
  }, [curve, hasData]);

  // Aggregate daily -> monthly
  const monthlyPnl = useMemo(() => {
    const m = {};
    for (const iso in dailyPnlByDate) {
      const mk = iso.slice(0, 7);
      m[mk] = (m[mk] || 0) + Number(dailyPnlByDate[iso] || 0);
    }
    return m;
  }, [dailyPnlByDate]);

  // Aggregate monthly -> yearly
  const yearlyPnl = useMemo(() => {
    const y = {};
    for (const mk in monthlyPnl) {
      const yk = mk.slice(0, 4);
      y[yk] = (y[yk] || 0) + Number(monthlyPnl[mk] || 0);
    }
    return y;
  }, [monthlyPnl]);

  const maxAbsDaily = useMemo(() => {
    const vals = Object.values(dailyPnlByDate).map((n) => Math.abs(Number(n || 0)));
    return vals.length ? Math.max(...vals) : 0;
  }, [dailyPnlByDate]);

  const maxAbsMonthly = useMemo(() => {
    const vals = Object.values(monthlyPnl).map((n) => Math.abs(Number(n || 0)));
    return vals.length ? Math.max(...vals) : 0;
  }, [monthlyPnl]);

  const maxAbsYearly = useMemo(() => {
    const vals = Object.values(yearlyPnl).map((n) => Math.abs(Number(n || 0)));
    return vals.length ? Math.max(...vals) : 0;
  }, [yearlyPnl]);

  const levelFor = (pnl, maxAbs) => {
    const v = Number(pnl || 0);
    if (!Number.isFinite(v) || v === 0 || !maxAbs) return 0;
    const t = Math.abs(v) / maxAbs;
    if (t <= 0.2) return 1;
    if (t <= 0.4) return 2;
    if (t <= 0.6) return 3;
    if (t <= 0.8) return 4;
    return 5;
  };

  const tileContent = ({ date, view }) => {
    if (!hasData) return null;

    if (view === "month") {
      const iso = isoFromDate(date);
      if (!(iso in dailyPnlByDate)) return null;

      const pnl = Number(dailyPnlByDate[iso] || 0);

      return (
        <div className="pnl-tile">
          <div className={`pnl-value ${pnl >= 0 ? "positive" : "negative"}`}>
            {formatCurrency(pnl)}
          </div>
        </div>
      );
    }

    if (view === "year") {
      const mk = monthKeyFromDate(date);
      if (!(mk in monthlyPnl)) return null;

      const pnl = Number(monthlyPnl[mk] || 0);

      return (
        <div className="pnl-tile">
          <div className={`pnl-value ${pnl >= 0 ? "positive" : "negative"}`}>
            {formatCurrency(pnl)}
          </div>
        </div>
      );
    }

    if (view === "decade") {
      const yk = yearKeyFromDate(date);
      if (!(yk in yearlyPnl)) return null;

      const pnl = Number(yearlyPnl[yk] || 0);

      return (
        <div className="pnl-tile">
          <div className={`pnl-value ${pnl >= 0 ? "positive" : "negative"}`}>
            {formatCurrency(pnl)}
          </div>
        </div>
      );
    }

    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (!hasData) return "cal-tile-empty";

    if (view === "month") {
      const iso = isoFromDate(date);
      if (!(iso in dailyPnlByDate)) return "cal-tile-empty";

      const pnl = Number(dailyPnlByDate[iso] || 0);
      const lvl = levelFor(pnl, maxAbsDaily);
      const sign = pnl > 0 ? "pos" : pnl < 0 ? "neg" : "flat";
      return `cal-tile has-point ${sign}-${lvl}`;
    }

    if (view === "year") {
      const mk = monthKeyFromDate(date);
      if (!(mk in monthlyPnl)) return "cal-tile-empty";

      const pnl = Number(monthlyPnl[mk] || 0);
      const lvl = levelFor(pnl, maxAbsMonthly);
      const sign = pnl > 0 ? "pos" : pnl < 0 ? "neg" : "flat";
      return `cal-tile has-point ${sign}-${lvl}`;
    }

    if (view === "decade") {
      const yk = yearKeyFromDate(date);
      if (!(yk in yearlyPnl)) return "cal-tile-empty";

      const pnl = Number(yearlyPnl[yk] || 0);
      const lvl = levelFor(pnl, maxAbsYearly);
      const sign = pnl > 0 ? "pos" : pnl < 0 ? "neg" : "flat";
      return `cal-tile has-point ${sign}-${lvl}`;
    }

    return "cal-tile-empty";
  };

  return (
    <div className="calendar-container">
      <Calendar
        value={selectedDate}
        onChange={setSelectedDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
      />
    </div>
  );
};

export default PortfolioCalendar;


