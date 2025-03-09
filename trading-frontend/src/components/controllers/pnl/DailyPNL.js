import React, { useEffect, useState } from "react";
import { fetchDailyPnls } from "../api/DailyPNLApi";
import { formatCash } from "../func/functions";
import NewDailyPNL from "./NewDailyPNL";

const DailyPNL = ({ onNewPNL }) => {
  const [dailyPNLData, setDailyPNLData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [componentLoading, setComponentLoading] = useState(true);
  const [fadeInTable, setFadeInTable] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setComponentLoading(false);
    }, 1500);
    fetchDailyPNLData();
  }, []);

  const fetchDailyPNLData = async () => {
    setLoading(true);
    setError(null);
    setFadeInTable(false);
    setTimeout(async () => {
      try {
        const data = await fetchDailyPnls();
        const sortedData = Array.isArray(data)
          ? data.sort((a, b) => b.id - a.id)
          : [];
        setDailyPNLData(sortedData);
      } catch (err) {
        console.error("Error fetching PNL data:", error);
        setError("Error fetching PNL");
      } finally {
        setLoading(false);
        setTimeout(() => setFadeInTable(true), 1000);
      }
    }, 1000);
  };

  const handleNewPNLEntry = async (newPNL) => {
    setShowModal(false);
    if (onNewPNL) onNewPNL(newPNL);

    setDailyPNLData([]);
    setLoading(true);
    setFadeInTable(false);

    await fetchDailyPNLData();
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const latestPNL = dailyPNLData.length > 0 ? dailyPNLData[0] : null;

  return (
    <div className="dailypnl-wrapper">
      {componentLoading && (
        <div className="component-loading-spinner-wrapper">
          <div className="spinner"></div>
        </div>
      )}

      <div
        className={`dailypnl-container ${
          !componentLoading ? "fade-in" : "loading"
        }`}
      >
        {!componentLoading && (
          <>
            {loading && (
              <div className="spinner-wrapper">
                <div className="spinner"></div>
              </div>
            )}

            {!loading && error ? (
              <p>{error}</p>
            ) : (
              <>
                <div className="header-card">
                  <p className="title"></p>
                  <div className="tooltip">
                    <i
                      className="btn btn-primary fa-solid fa-plus"
                      id="new-pnl-btn"
                      onClick={handleOpenModal}
                    ></i>
                    <span className="tooltiptext">New P/L</span>
                  </div>
                </div>

                <div className={`fade-in ${fadeInTable ? "visible" : ""}`}>
                  <div className="daily-pnl-section">
                    <div className="daily-pnl-card-container">
                      <div className="daily-pnl-card">
                        <div className="card-content">
                          <div className="icon-label">
                            <span className="label">Open Cash:</span>
                          </div>
                          <span className="value">
                            {formatCash(latestPNL?.open_cash || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="daily-pnl-card">
                        <div className="card-content">
                          <div className="icon-label">
                            <span className="label">Close Cash:</span>
                          </div>
                          <span className="value">
                            {formatCash(latestPNL?.close_cash || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <hr className="divider" />

                    <div className="daily-pnl-card-container">
                      <div className="daily-pnl-card">
                        <div className="card-content">
                          <div className="icon-label">
                            <span className="label">P/L:</span>
                          </div>
                          <span className="value">
                            {formatCash(latestPNL?.balance || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="daily-pnl-card">
                        <div className="card-content">
                          <div className="icon-label">
                            <span className="label">RoI:</span>
                          </div>
                          <span className="value">
                            {`${latestPNL?.roi || 0}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {showModal && (
          <NewDailyPNL
            onClose={handleCloseModal}
            onNewPNL={handleNewPNLEntry}
          />
        )}
      </div>
    </div>
  );
};

export default DailyPNL;
