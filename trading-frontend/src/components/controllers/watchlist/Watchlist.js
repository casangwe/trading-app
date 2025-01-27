import React, { useState, useEffect } from "react";
import { fetchWatchlists, updateWatchlist } from "../api/WatchlistApi";
import NewWatchlist from "./NewWatchlist";
import UpdateWatchlist from "./UpdateWatchlist";
import { formatDate } from "../func/functions";

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
        setItemsLoading(true);
        await updateWatchlist(selectedWatchlist.id, updatedData);
        setWatchlists((prevWatchlists) =>
          prevWatchlists.map((wl) =>
            wl.id === selectedWatchlist.id ? { ...wl, ...updatedData } : wl
          )
        );
      } catch (error) {
        console.error("Error updating watchlist:", error);
      } finally {
        setShowModal(false);
        setItemsLoading(false);
      }
    } else {
      fetchWatchlistData();
    }
    // handleCloseModal();
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
                  <p className="title">Watchlists</p>
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
                {/* <div className={`fade-in ${fadeInTable ? "visible" : ""}`}> */}
                <div
                  className={`fade-in ${fadeInTable ? "visible" : "hidden"}`}
                >
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
                          style={{
                            borderLeft:
                              watchlist.target_price > watchlist.price
                                ? "2px solid #4a90e2"
                                : "2px solid red",
                          }}
                          onClick={() => handleOpenModal(watchlist)}
                        >
                          <span className="watch-item-symbol">
                            {watchlist.symbol}
                          </span>
                          <span className="watch-item-price">
                            ${watchlist.price.toFixed(2)}
                          </span>
                          <span className="watch-item-target-price">
                            ${watchlist.target_price.toFixed(2)}
                          </span>
                          <span className="watch-item-exp-date">
                            {formatDate(watchlist.exp_date)}
                          </span>
                          <span className="watch-item-target-hit">
                            {watchlist.target_hit ? "Yes" : "No"}
                          </span>
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
