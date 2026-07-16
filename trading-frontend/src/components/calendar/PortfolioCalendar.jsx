// src/components/calendar/PortfolioCalendar.jsx

import React, { useMemo, useState } from "react";
import Calendar from "react-calendar";
import { formatCurrency, formatPercent } from "../../func/formatters";
import Modal from "../layout/Modal";

const isoFromDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const monthKeyFromDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const yearKeyFromDate = (d) => String(d.getFullYear());

const prettyDate = (iso) => {
  if (!iso) return "";
  const [year, month, day] = String(iso).split("-");
  if (!year || !month || !day) return iso;
  return `${month}/${day}/${year}`;
};

const prettyMonth = (monthKey) => {
  if (!monthKey) return "";
  const [year, month] = String(monthKey).split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
};

const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const PortfolioCalendar = ({
  charts = null,
  curveKey = "normalized_equity_curve",
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [detailModal, setDetailModal] = useState(null);

  const curve = charts?.[curveKey] || [];
  const hasData = Array.isArray(curve) && curve.length > 0;

  const dailyDetailsByDate = useMemo(() => {
    if (!hasData) return {};

    const details = {};

    for (let i = 0; i < curve.length; i++) {
      const iso = String(curve[i].date);
      const close = safeNumber(curve[i].value);

      const previousClose =
        i === 0 ? close : safeNumber(curve[i - 1].value);

      const pnl = close - previousClose;
      const roi = previousClose !== 0 ? (pnl / previousClose) * 100 : 0;

      details[iso] = {
        type: "day",
        date: iso,
        label: prettyDate(iso),
        open: previousClose,
        close,
        pnl,
        roi,
      };
    }

    return details;
  }, [curve, hasData]);

  const dailyPnlByDate = useMemo(() => {
    const pnl = {};

    for (const iso in dailyDetailsByDate) {
      pnl[iso] = Number(dailyDetailsByDate[iso]?.pnl || 0);
    }

    return pnl;
  }, [dailyDetailsByDate]);

  const monthlyDetailsByKey = useMemo(() => {
    const months = {};

    for (const iso in dailyDetailsByDate) {
      const mk = iso.slice(0, 7);
      const day = dailyDetailsByDate[iso];

      if (!months[mk]) {
        months[mk] = {
          type: "month",
          monthKey: mk,
          label: prettyMonth(mk),
          startDate: iso,
          endDate: iso,
          open: day.open,
          close: day.close,
          pnl: 0,
          tradingDays: 0,
          winningDays: 0,
          losingDays: 0,
          flatDays: 0,
        };
      }

      const month = months[mk];

      month.endDate = iso;
      month.close = day.close;
      month.pnl += day.pnl;
      month.tradingDays += 1;

      if (day.pnl > 0) month.winningDays += 1;
      else if (day.pnl < 0) month.losingDays += 1;
      else month.flatDays += 1;
    }

    for (const mk in months) {
      const month = months[mk];
      month.roi = month.open !== 0 ? (month.pnl / month.open) * 100 : 0;
    }

    return months;
  }, [dailyDetailsByDate]);

  const monthlyPnl = useMemo(() => {
    const m = {};

    for (const mk in monthlyDetailsByKey) {
      m[mk] = Number(monthlyDetailsByKey[mk]?.pnl || 0);
    }

    return m;
  }, [monthlyDetailsByKey]);

  const yearlyDetailsByKey = useMemo(() => {
    const years = {};

    for (const mk in monthlyDetailsByKey) {
      const yk = mk.slice(0, 4);
      const month = monthlyDetailsByKey[mk];

      if (!years[yk]) {
        years[yk] = {
          type: "year",
          yearKey: yk,
          label: yk,
          startDate: month.startDate,
          endDate: month.endDate,
          open: month.open,
          close: month.close,
          pnl: 0,
          months: 0,
          winningDays: 0,
          losingDays: 0,
          flatDays: 0,
          tradingDays: 0,
        };
      }

      const year = years[yk];

      year.endDate = month.endDate;
      year.close = month.close;
      year.pnl += month.pnl;
      year.months += 1;
      year.winningDays += month.winningDays;
      year.losingDays += month.losingDays;
      year.flatDays += month.flatDays;
      year.tradingDays += month.tradingDays;
    }

    for (const yk in years) {
      const year = years[yk];
      year.roi = year.open !== 0 ? (year.pnl / year.open) * 100 : 0;
    }

    return years;
  }, [monthlyDetailsByKey]);

  const yearlyPnl = useMemo(() => {
    const y = {};

    for (const yk in yearlyDetailsByKey) {
      y[yk] = Number(yearlyDetailsByKey[yk]?.pnl || 0);
    }

    return y;
  }, [yearlyDetailsByKey]);

  const maxAbsDaily = useMemo(() => {
    const vals = Object.values(dailyPnlByDate).map((n) =>
      Math.abs(Number(n || 0))
    );
    return vals.length ? Math.max(...vals) : 0;
  }, [dailyPnlByDate]);

  const maxAbsMonthly = useMemo(() => {
    const vals = Object.values(monthlyPnl).map((n) =>
      Math.abs(Number(n || 0))
    );
    return vals.length ? Math.max(...vals) : 0;
  }, [monthlyPnl]);

  const maxAbsYearly = useMemo(() => {
    const vals = Object.values(yearlyPnl).map((n) =>
      Math.abs(Number(n || 0))
    );
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

  const openDayModal = (date) => {
    const iso = isoFromDate(date);
    const details = dailyDetailsByDate[iso];

    if (!details) return;

    setDetailModal(details);
  };

  const openMonthModal = (date) => {
    const mk = monthKeyFromDate(date);
    const details = monthlyDetailsByKey[mk];

    if (!details) return;

    setDetailModal(details);
  };

  const openYearModal = (date) => {
    const yk = yearKeyFromDate(date);
    const details = yearlyDetailsByKey[yk];

    if (!details) return;

    setDetailModal(details);
  };

  const closeDetailModal = () => {
    setDetailModal(null);
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

  const modalTitle =
    detailModal?.type === "day"
      ? `Daily PnL — ${detailModal.label}`
      : detailModal?.type === "month"
        ? `Monthly PnL — ${detailModal.label}`
        : detailModal?.type === "year"
          ? `Yearly PnL — ${detailModal.label}`
          : "PnL Details";

  return (
    <div className="calendar-container">
      <Calendar
        value={selectedDate}
        onChange={setSelectedDate}
        onClickDay={openDayModal}
        onClickMonth={openMonthModal}
        onClickYear={openYearModal}
        tileContent={tileContent}
        tileClassName={tileClassName}
      />

      <Modal
        isOpen={!!detailModal}
        title={modalTitle}
        onClose={closeDetailModal}
      >
        {detailModal?.type === "day" && (
          <div className="calendar-detail">
            <div className="calendar-detail-grid">
              <div className="calendar-detail-metric">
                <span className="label">Open</span>
                <span className="value">{formatCurrency(detailModal.open)}</span>
              </div>

              <div className="calendar-detail-metric">
                <span className="label">Close</span>
                <span className="value">{formatCurrency(detailModal.close)}</span>
              </div>

              <div className="calendar-detail-metric">
                <span className="label">PNL</span>
                <span
                  className={`value ${
                    detailModal.pnl >= 0 ? "positive" : "negative"
                  }`}
                >
                  {formatCurrency(detailModal.pnl)}
                </span>
              </div>

              <div className="calendar-detail-metric">
                <span className="label">ROI</span>
                <span
                  className={`value ${
                    detailModal.roi >= 0 ? "positive" : "negative"
                  }`}
                >
                  {formatPercent(detailModal.roi)}
                </span>
              </div>
            </div>

            <p className="calendar-detail-note">
              This day is based on the normalized performance curve, so deposits
              and withdrawals do not count as trading profit or loss.
            </p>
          </div>
        )}

        {detailModal?.type === "month" && (
          <div className="calendar-detail">
            <div className="calendar-detail-grid">
              <div className="calendar-detail-metric">
                <span className="label">Start</span>
                <span className="value">{formatCurrency(detailModal.open)}</span>
              </div>

              <div className="calendar-detail-metric">
                <span className="label">End</span>
                <span className="value">{formatCurrency(detailModal.close)}</span>
              </div>

              <div className="calendar-detail-metric">
                <span className="label">PNL</span>
                <span
                  className={`value ${
                    detailModal.pnl >= 0 ? "positive" : "negative"
                  }`}
                >
                  {formatCurrency(detailModal.pnl)}
                </span>
              </div>

              <div className="calendar-detail-metric">
                <span className="label">ROI</span>
                <span
                  className={`value ${
                    detailModal.roi >= 0 ? "positive" : "negative"
                  }`}
                >
                  {formatPercent(detailModal.roi)}
                </span>
              </div>

              <div className="calendar-detail-metric">
                <span className="label">Winning Days</span>
                <span className="value">{detailModal.winningDays}</span>
              </div>

              <div className="calendar-detail-metric">
                <span className="label">Losing Days</span>
                <span className="value">{detailModal.losingDays}</span>
              </div>
            </div>

            <p className="calendar-detail-note">
              Range: {prettyDate(detailModal.startDate)} —{" "}
              {prettyDate(detailModal.endDate)}
            </p>
          </div>
        )}

        {detailModal?.type === "year" && (
          <div className="calendar-detail">
            <div className="calendar-detail-grid">
              <div className="calendar-detail-metric">
                <span className="label">Start</span>
                <span className="value">{formatCurrency(detailModal.open)}</span>
              </div>

              <div className="calendar-detail-metric">
                <span className="label">End</span>
                <span className="value">{formatCurrency(detailModal.close)}</span>
              </div>

              <div className="calendar-detail-metric">
                <span className="label">PNL</span>
                <span
                  className={`value ${
                    detailModal.pnl >= 0 ? "positive" : "negative"
                  }`}
                >
                  {formatCurrency(detailModal.pnl)}
                </span>
              </div>

              <div className="calendar-detail-metric">
                <span className="label">ROI</span>
                <span
                  className={`value ${
                    detailModal.roi >= 0 ? "positive" : "negative"
                  }`}
                >
                  {formatPercent(detailModal.roi)}
                </span>
              </div>

              <div className="calendar-detail-metric">
                <span className="label">Winning Days</span>
                <span className="value">{detailModal.winningDays}</span>
              </div>

              <div className="calendar-detail-metric">
                <span className="label">Losing Days</span>
                <span className="value">{detailModal.losingDays}</span>
              </div>
            </div>

            <p className="calendar-detail-note">
              Range: {prettyDate(detailModal.startDate)} —{" "}
              {prettyDate(detailModal.endDate)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PortfolioCalendar;

// // src/components/calendar/PortfolioCalendar.jsx

// import React, { useMemo, useState } from "react";
// import Calendar from "react-calendar";
// import { formatCurrency } from "../../func/formatters";

// const isoFromDate = (d) => d.toISOString().split("T")[0];
// const monthKeyFromDate = (d) =>
//   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
// const yearKeyFromDate = (d) => String(d.getFullYear());

// const PortfolioCalendar = ({
//   charts = null,
//   curveKey = "normalized_equity_curve",
// }) => {
//   const [selectedDate, setSelectedDate] = useState(new Date());

//   const curve = charts?.[curveKey] || [];
//   const hasData = Array.isArray(curve) && curve.length > 0;

//   // Build daily pnl map from equity curve
//   const dailyPnlByDate = useMemo(() => {
//     if (!hasData) return {};

//     const pnl = {};
//     for (let i = 0; i < curve.length; i++) {
//       const iso = String(curve[i].date);
//       const v = Number(curve[i].value ?? 0);

//       if (i === 0) pnl[iso] = 0;
//       else {
//         const prevV = Number(curve[i - 1].value ?? 0);
//         pnl[iso] = v - prevV;
//       }
//     }
//     return pnl;
//   }, [curve, hasData]);

//   // Aggregate daily -> monthly
//   const monthlyPnl = useMemo(() => {
//     const m = {};
//     for (const iso in dailyPnlByDate) {
//       const mk = iso.slice(0, 7);
//       m[mk] = (m[mk] || 0) + Number(dailyPnlByDate[iso] || 0);
//     }
//     return m;
//   }, [dailyPnlByDate]);

//   // Aggregate monthly -> yearly
//   const yearlyPnl = useMemo(() => {
//     const y = {};
//     for (const mk in monthlyPnl) {
//       const yk = mk.slice(0, 4);
//       y[yk] = (y[yk] || 0) + Number(monthlyPnl[mk] || 0);
//     }
//     return y;
//   }, [monthlyPnl]);

//   const maxAbsDaily = useMemo(() => {
//     const vals = Object.values(dailyPnlByDate).map((n) => Math.abs(Number(n || 0)));
//     return vals.length ? Math.max(...vals) : 0;
//   }, [dailyPnlByDate]);

//   const maxAbsMonthly = useMemo(() => {
//     const vals = Object.values(monthlyPnl).map((n) => Math.abs(Number(n || 0)));
//     return vals.length ? Math.max(...vals) : 0;
//   }, [monthlyPnl]);

//   const maxAbsYearly = useMemo(() => {
//     const vals = Object.values(yearlyPnl).map((n) => Math.abs(Number(n || 0)));
//     return vals.length ? Math.max(...vals) : 0;
//   }, [yearlyPnl]);

//   const levelFor = (pnl, maxAbs) => {
//     const v = Number(pnl || 0);
//     if (!Number.isFinite(v) || v === 0 || !maxAbs) return 0;
//     const t = Math.abs(v) / maxAbs;
//     if (t <= 0.2) return 1;
//     if (t <= 0.4) return 2;
//     if (t <= 0.6) return 3;
//     if (t <= 0.8) return 4;
//     return 5;
//   };

//   const tileContent = ({ date, view }) => {
//     if (!hasData) return null;

//     if (view === "month") {
//       const iso = isoFromDate(date);
//       if (!(iso in dailyPnlByDate)) return null;

//       const pnl = Number(dailyPnlByDate[iso] || 0);

//       return (
//         <div className="pnl-tile">
//           <div className={`pnl-value ${pnl >= 0 ? "positive" : "negative"}`}>
//             {formatCurrency(pnl)}
//           </div>
//         </div>
//       );
//     }

//     if (view === "year") {
//       const mk = monthKeyFromDate(date);
//       if (!(mk in monthlyPnl)) return null;

//       const pnl = Number(monthlyPnl[mk] || 0);

//       return (
//         <div className="pnl-tile">
//           <div className={`pnl-value ${pnl >= 0 ? "positive" : "negative"}`}>
//             {formatCurrency(pnl)}
//           </div>
//         </div>
//       );
//     }

//     if (view === "decade") {
//       const yk = yearKeyFromDate(date);
//       if (!(yk in yearlyPnl)) return null;

//       const pnl = Number(yearlyPnl[yk] || 0);

//       return (
//         <div className="pnl-tile">
//           <div className={`pnl-value ${pnl >= 0 ? "positive" : "negative"}`}>
//             {formatCurrency(pnl)}
//           </div>
//         </div>
//       );
//     }

//     return null;
//   };

//   const tileClassName = ({ date, view }) => {
//     if (!hasData) return "cal-tile-empty";

//     if (view === "month") {
//       const iso = isoFromDate(date);
//       if (!(iso in dailyPnlByDate)) return "cal-tile-empty";

//       const pnl = Number(dailyPnlByDate[iso] || 0);
//       const lvl = levelFor(pnl, maxAbsDaily);
//       const sign = pnl > 0 ? "pos" : pnl < 0 ? "neg" : "flat";
//       return `cal-tile has-point ${sign}-${lvl}`;
//     }

//     if (view === "year") {
//       const mk = monthKeyFromDate(date);
//       if (!(mk in monthlyPnl)) return "cal-tile-empty";

//       const pnl = Number(monthlyPnl[mk] || 0);
//       const lvl = levelFor(pnl, maxAbsMonthly);
//       const sign = pnl > 0 ? "pos" : pnl < 0 ? "neg" : "flat";
//       return `cal-tile has-point ${sign}-${lvl}`;
//     }

//     if (view === "decade") {
//       const yk = yearKeyFromDate(date);
//       if (!(yk in yearlyPnl)) return "cal-tile-empty";

//       const pnl = Number(yearlyPnl[yk] || 0);
//       const lvl = levelFor(pnl, maxAbsYearly);
//       const sign = pnl > 0 ? "pos" : pnl < 0 ? "neg" : "flat";
//       return `cal-tile has-point ${sign}-${lvl}`;
//     }

//     return "cal-tile-empty";
//   };

//   return (
//     <div className="calendar-container">
//       <Calendar
//         value={selectedDate}
//         onChange={setSelectedDate}
//         tileContent={tileContent}
//         tileClassName={tileClassName}
//       />
//     </div>
//   );
// };

// export default PortfolioCalendar;


