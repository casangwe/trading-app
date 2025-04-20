import React, { useState, useEffect } from "react";
import { formatDate, formatCash } from "../func/functions";
import { fetchWatchlistAnalysis } from "../api/OptionFlowAPI";

const UpdateWatchlist = ({ watchlist, onClose, onSave, handleDelete }) => {
  const [formData, setFormData] = useState({
    target_hit: watchlist.target_hit,
  });
  const [showUpdateButton, setShowUpdateButton] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  const [analysis1d, setAnalysis1d] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchWatchlistAnalysis(watchlist.symbol)
      .then((data) => mounted && setAnalysis1d(data["1D"] || null))
      .catch((err) => console.error("Error fetching 1D analysis:", err));
    return () => void (mounted = false);
  }, [watchlist.symbol]);

  const handleToggle = () => {
    setFormData((prev) => ({ ...prev, target_hit: !prev.target_hit }));
    setShowUpdateButton(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setShowUpdateButton(false);
    setIsEditable(false);
  };

  const toggleEdit = () => {
    setIsEditable(true);
    setShowUpdateButton(true);
  };

  const formatVolume = (n) => `${(n / 1e6).toFixed(1)}M`;
  const formatPercent = (v) =>
    typeof v === "number" ? `${v > 0 ? "+" : ""}${v.toFixed(2)}%` : "N/A";

  const sessionDate = analysis1d?.price_action?.date;

  const analysisRows = analysis1d
    ? [
        {
          leftLabel: "Scenario",
          rightLabel: "Open",
          leftValue: analysis1d.scenario ?? "N/A",
          rightValue:
            analysis1d.price_action?.open != null
              ? `$${analysis1d.price_action.open.toFixed(2)}`
              : "N/A",
        },
        {
          leftLabel: "MFI",
          rightLabel: "High",
          leftValue:
            typeof analysis1d.indicators?.mfi === "number"
              ? analysis1d.indicators.mfi.toFixed(2)
              : "N/A",
          rightValue:
            analysis1d.price_action?.high != null
              ? `$${analysis1d.price_action.high.toFixed(2)}`
              : "N/A",
        },
        {
          leftLabel: "MA(5)",
          rightLabel: "Low",
          leftValue:
            typeof analysis1d.indicators?.ma_5 === "number"
              ? analysis1d.indicators.ma_5.toFixed(2)
              : "N/A",
          rightValue:
            analysis1d.price_action?.low != null
              ? `$${analysis1d.price_action.low.toFixed(2)}`
              : "N/A",
        },
        {
          leftLabel: "MA(9)",
          rightLabel: "Close",
          leftValue:
            typeof analysis1d.indicators?.ma_9 === "number"
              ? analysis1d.indicators.ma_9.toFixed(2)
              : "N/A",
          rightValue:
            analysis1d.price_action?.close != null
              ? `$${analysis1d.price_action.close.toFixed(2)}`
              : "N/A",
        },
        {
          leftLabel: "Volume",
          rightLabel: "% Change",
          leftValue:
            analysis1d.price_action?.volume != null
              ? formatVolume(analysis1d.price_action.volume)
              : "N/A",
          rightValue:
            analysis1d.price_action?.percent_change != null
              ? formatPercent(analysis1d.price_action.percent_change)
              : "N/A",
        },
      ]
    : [];

  return (
    <div className="modal-container">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{watchlist.symbol}</h3>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="watchlist-header">
            <p className="no-id">
              N<sup>o</sup>: {`000${watchlist.id}`.slice(-5)}
            </p>
            <p className="entry-date">{formatDate(watchlist.entry_date)}</p>
          </div>
          <hr />

          <div className="upd-watch-details">
            <div className="watch-price">
              <span className="label">Price</span>
              <span className="value">${watchlist.price.toFixed(2)}</span>
            </div>
            <div className="watch-target">
              <span className="label">Target</span>
              <span className="value">
                ${watchlist.target_price.toFixed(2)}
              </span>
            </div>
            <div className="watch-target-hit">
              <label
                className="toggle-switch"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={formData.target_hit}
                  onChange={handleToggle}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="analysis-section">
            <div className="analysis-header">
              <span>1D</span>
              <span>{formatDate(sessionDate)}</span>
            </div>
            <hr />
            {analysisRows.length > 0 && (
              <table className="analysis-table">
                <tbody>
                  {analysisRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="analysis-cell">
                        <div className="cell-label">{row.leftLabel}</div>
                        <div className="cell-value">{row.leftValue}</div>
                      </td>
                      <td className="analysis-cell">
                        <div className="cell-label">{row.rightLabel}</div>
                        <div className="cell-value">{row.rightValue}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="icon-container">
            <span
              className="delete-icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(watchlist.id);
              }}
            >
              <i className="fa-solid fa-trash"></i>
            </span>
            <span
              className="settings-icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleEdit();
              }}
            >
              <i className="fa-solid fa-cog"></i>
            </span>
          </div>
          <div className="update-container">
            {showUpdateButton && (
              <button onClick={handleSubmit} className="update-button">
                Update
              </button>
            )}{" "}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateWatchlist;
