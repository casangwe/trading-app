import React, { useState, useEffect } from "react";
import { fetchWatchlists, updateWatchlist } from "../api/WatchlistApi";
import NewWatchlist from "./NewWatchlist";
import UpdateWatchlist from "./UpdateWatchlist";
import { formatDate, splitText } from "../func/functions";

const Watchlist = () => {
  const [watchlists, setWatchlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [componentLoading, setComponentLoading] = useState(true);
  const [fadeInTable, setFadeInTable] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => setComponentLoading(false), 1000);
    fetchWatchlistData();
  }, []);

  const fetchWatchlistData = async () => {
    setLoading(true);
    setFadeInTable(false);

    try {
      const data = await fetchWatchlists();
      setWatchlists(data);
    } catch (error) {
      setError("Error fetching watchlists");
    } finally {
      setLoading(false);
      setTimeout(() => setFadeInTable(true), 1000);
    }
  };

  const handleOpenModal = (watchlist = null) => {
    setSelectedWatchlist(watchlist);
    setIsEditing(!!watchlist);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedWatchlist(null);
    setIsEditing(false);
  };

  const handleSaveChanges = async (updatedData) => {
    if (isEditing) {
      try {
        setShowModal(false);
        setFadeInTable(false);

        await updateWatchlist(selectedWatchlist.id, updatedData);

        setWatchlists((prevWatchlists) =>
          prevWatchlists.map((wl) =>
            wl.id === selectedWatchlist.id ? { ...wl, ...updatedData } : wl
          )
        );
        setItemsLoading(true);
      } catch (error) {
        console.error("Error updating watchlist:", error);
      } finally {
        setTimeout(() => {
          setItemsLoading(false);
          setFadeInTable(true);
        }, 1000);
      }
    } else {
      fetchWatchlistData();
    }
  };

  const handleToggleHit = async (id, currentStatus) => {
    const updatedStatus = !currentStatus;

    try {
      await updateWatchlist(id, { target_hit: updatedStatus });
      setWatchlists((prevWatchlists) =>
        prevWatchlists.map((wl) =>
          wl.id === id ? { ...wl, target_hit: updatedStatus } : wl
        )
      );
    } catch (error) {
      console.error("Error updating target hit status:", error);
    }
  };

  return (
    <div className="watchlist-wrapper">
      {componentLoading && (
        <div className="component-loading-spinner-wrapper">
          <div className="spinner"></div>
        </div>
      )}

      <div
        className={`watchlist-container ${
          !componentLoading ? "fade-in visible" : "loading"
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
              <div>Error: {error}</div>
            ) : (
              <>
                <div className="header-card">
                  <p className="title">Watchlist</p>
                  <div className="tooltip">
                    <i
                      className="btn btn-primary fa-solid fa-plus"
                      id="watchlist-new-btn"
                      onClick={() => handleOpenModal()}
                    ></i>
                    <span className="tooltiptext">New Item</span>
                  </div>
                </div>

                <hr />
                <div className={`fade-in ${fadeInTable ? "visible" : ""}`}>
                  <div className="watch-container">
                    {itemsLoading ? (
                      <div className="items-spinner-wrapper">
                        <div className="items-spinner"></div>
                      </div>
                    ) : (
                      watchlists.map((watchlist) => (
                        <div
                          className="watch-item"
                          key={watchlist.id}
                          onClick={() => handleOpenModal(watchlist)}
                        >
                          <p className="no-id">
                            N<sup>o</sup>: {`000${watchlist.id}`.slice(-5)}
                          </p>
                          <p className="watch-item-symbol">
                            {watchlist.symbol}
                          </p>
                          <div className="watch-details">
                            <div className="watch-row">
                              <div className="watch-price">
                                <div className="watch-price-icon-label">
                                  <span className="label">Price:</span>
                                </div>
                                <span className="value">
                                  ${watchlist.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="watch-row">
                              <div className="watch-target">
                                <div className="watch-target-icon-label">
                                  <span className="label">Target:</span>
                                </div>
                                <span className="value">
                                  ${watchlist.target_price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="watch-row">
                              <div className="watch-target-hit">
                                <div className="watch-target-hit-icon-label"></div>
                                <label
                                  className="toggle-switch"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={watchlist.target_hit}
                                    onChange={() =>
                                      handleToggleHit(
                                        watchlist.id,
                                        watchlist.target_hit
                                      )
                                    }
                                  />
                                  <span className="slider"></span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {showModal && isEditing && selectedWatchlist && (
                  <UpdateWatchlist
                    watchlist={selectedWatchlist}
                    onClose={handleCloseModal}
                    onSave={handleSaveChanges}
                  />
                )}

                {showModal && !isEditing && (
                  <NewWatchlist
                    onClose={handleCloseModal}
                    onSave={handleSaveChanges}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
