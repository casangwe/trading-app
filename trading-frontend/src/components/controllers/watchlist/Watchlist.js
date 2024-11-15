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

  useEffect(() => {
    const getWatchlists = async () => {
      try {
        const data = await fetchWatchlists();
        setWatchlists(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    getWatchlists();
  }, []);

  const handleOpenModal = (watchlist = null) => {
    setSelectedWatchlist(watchlist);
    setIsEditing(!!watchlist);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedWatchlist(null);
    setIsEditing(false);
    setShowModal(false);
  };

  const handleSaveChanges = async (updatedData) => {
    if (isEditing) {
      try {
        await updateWatchlist(selectedWatchlist.id, updatedData);
        setWatchlists((prevWatchlists) =>
          prevWatchlists.map((wl) =>
            wl.id === selectedWatchlist.id ? { ...wl, ...updatedData } : wl
          )
        );
      } catch (error) {
        console.error("Error updating watchlist:", error);
      }
    } else {
    }
    handleCloseModal();
  };

  if (loading) {
    return <div>Loading watchlists...</div>;
  }

  if (error) {
    return <div>Error fetching watchlists: {error}</div>;
  }

  return (
    <div className="watchlist-container">
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
      <div className="watch-container">
        {watchlists.map((watchlist) => (
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
            <span className="watch-item-symbol">{watchlist.symbol}</span>
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
        ))}
      </div>

      {showModal && isEditing && selectedWatchlist && (
        <UpdateWatchlist
          watchlist={selectedWatchlist}
          onClose={handleCloseModal}
          onSave={handleSaveChanges}
        />
      )}

      {showModal && !isEditing && (
        <NewWatchlist onClose={handleCloseModal} onSave={handleSaveChanges} />
      )}
    </div>
  );
};

export default Watchlist;
