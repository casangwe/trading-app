import React, { useState, useEffect } from "react";
import { formatDate, formatCash } from "../func/functions";
import { fetchOptionFlowAnalysis } from "../api/OptionFlowAPI";

const UpdateWatchlist = ({
  watchlist,
  dateRange,
  onClose,
  onSave,
  handleDelete,
}) => {
  const [formData, setFormData] = useState({
    target_hit: watchlist.target_hit,
  });
  const [showUpdateButton, setShowUpdateButton] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!watchlist.symbol) return;

    setIsLoading(true);
    setError(null);
    setAnalysisData(null);

    fetchOptionFlowAnalysis(watchlist.symbol, dateRange)
      .then((data) => {
        setAnalysisData(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load analysis");
      })
      .finally(() => {
        setIsLoading(false);
      });
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
          <div className="flow-section">
            {isLoading && <p>Loading analysis…</p>}
            {error && <p className="error-message">{error}</p>}
            {analysisData && (
              <>
                {/* 1) Destructure only what we need */}
                {(() => {
                  const { scenario, vs_metrics } =
                    analysisData.market_sentiment;
                  return (
                    <div className="sentiment-report">
                      <p>
                        <strong>{scenario}</strong>
                      </p>
                      <hr />
                      {vs_metrics && (
                        <div className="vs-container">
                          <div className="vs-left">
                            {Object.entries(vs_metrics.left).map(
                              ([label, value]) => (
                                <div key={label} className="vs-row">
                                  <span className="label">{label}:</span>
                                  <span className="value">
                                    {formatCash(value)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>

                          {/* <div className="vs-divider" /> */}

                          <div className="vs-right">
                            {Object.entries(vs_metrics.right).map(
                              ([label, value]) => (
                                <div key={label} className="vs-row">
                                  <span className="label">{label}:</span>
                                  <span className="value">
                                    {formatCash(value)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
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

// import React, { useState, useEffect } from "react";
// import { formatDate } from "../func/functions";

// const UpdateWatchlist = ({ watchlist, onClose, onSave, handleDelete }) => {
//   const [formData, setFormData] = useState({
//     target_hit: watchlist.target_hit,
//   });
//   const [showUpdateButton, setShowUpdateButton] = useState(false);
//   const [isEditable, setIsEditable] = useState(false);

//   const handleToggle = () => {
//     setFormData((prev) => ({ ...prev, target_hit: !prev.target_hit }));
//     setShowUpdateButton(true);
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSave(formData);
//     setShowUpdateButton(false);
//     setIsEditable(false);
//   };

//   const toggleEdit = () => {
//     setIsEditable(true);
//     setShowUpdateButton(true);
//   };

//   const formatVolume = (n) => `${(n / 1e6).toFixed(1)}M`;
//   const formatPercent = (v) =>
//     typeof v === "number" ? `${v > 0 ? "+" : ""}${v.toFixed(2)}%` : "N/A";

//   return (
//     <div className="modal-container">
//       <div className="modal-content">
//         <div className="modal-header">
//           <h3>{watchlist.symbol}</h3>
//           <button className="close-button" onClick={onClose}>
//             &times;
//           </button>
//         </div>

//         <div className="modal-body">
//           <div className="watchlist-header">
//             <p className="no-id">
//               N<sup>o</sup>: {`000${watchlist.id}`.slice(-5)}
//             </p>
//             <p className="entry-date">{formatDate(watchlist.entry_date)}</p>
//           </div>
//           <hr />

//           <div className="upd-watch-details">
//             <div className="watch-price">
//               <span className="label">Price</span>
//               <span className="value">${watchlist.price.toFixed(2)}</span>
//             </div>
//             <div className="watch-target">
//               <span className="label">Target</span>
//               <span className="value">
//                 ${watchlist.target_price.toFixed(2)}
//               </span>
//             </div>
//             <div className="watch-target-hit">
//               <label
//                 className="toggle-switch"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 <input
//                   type="checkbox"
//                   checked={formData.target_hit}
//                   onChange={handleToggle}
//                 />
//                 <span className="slider"></span>
//               </label>
//             </div>
//           </div>
//         </div>

//         <div className="modal-footer">
//           <div className="icon-container">
//             <span
//               className="delete-icon"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleDelete(watchlist.id);
//               }}
//             >
//               <i className="fa-solid fa-trash"></i>
//             </span>
//             <span
//               className="settings-icon"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 toggleEdit();
//               }}
//             >
//               <i className="fa-solid fa-cog"></i>
//             </span>
//           </div>
//           <div className="update-container">
//             {showUpdateButton && (
//               <button onClick={handleSubmit} className="update-button">
//                 Update
//               </button>
//             )}{" "}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UpdateWatchlist;
