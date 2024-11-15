import React, { useState, useEffect } from "react";
import {
  fetchMiscEntries,
  updateMiscEntry,
  createMiscEntry,
  deleteMiscEntry,
} from "../api/MiscAPI";
import NewMisc from "./NewMisc";
import UpdateMisc from "./UpdateMisc";
import { formatDate, splitText } from "../func/functions";

const Misc = () => {
  const [miscEntries, setMiscEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMisc, setSelectedMisc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("plan");

  useEffect(() => {
    const getMiscEntries = async () => {
      try {
        const data = await fetchMiscEntries();
        setMiscEntries(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    getMiscEntries();
  }, []);

  // Filter entries based on active tab
  const filteredEntries = miscEntries
    .filter((entry) =>
      activeTab === "plan"
        ? entry.category.toLowerCase() === "plan"
        : activeTab === "summary"
        ? entry.category.toLowerCase() === "summary"
        : entry.category.toLowerCase() === "metrics"
    )
    .sort((a, b) => b.id - a.id);

  const handleOpenModal = (misc = null) => {
    setSelectedMisc(misc);
    setIsEditing(!!misc);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedMisc(null);
    setIsEditing(false);
    setShowModal(false);
  };

  const handleSaveChanges = async (updatedData) => {
    if (isEditing) {
      try {
        await updateMiscEntry(selectedMisc.id, updatedData);
        setMiscEntries((prevEntries) =>
          prevEntries.map((entry) =>
            entry.id === selectedMisc.id ? { ...entry, ...updatedData } : entry
          )
        );
      } catch (error) {
        console.error("Error updating misc entry:", error);
      }
    } else {
      try {
        const newEntry = await createMiscEntry(updatedData);
        setMiscEntries((prevEntries) => [...prevEntries, newEntry]);
      } catch (error) {
        console.error("Error creating misc entry:", error);
      }
    }
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    try {
      await deleteMiscEntry(id);
      setMiscEntries((prevEntries) =>
        prevEntries.filter((entry) => entry.id !== id)
      );
    } catch (error) {
      console.error("Error deleting misc entry:", error);
    }
  };

  if (loading) {
    return <div>Loading entries...</div>;
  }

  if (error) {
    return <div>Error fetching entries: {error}</div>;
  }

  return (
    <div className="misc-main-container">
      <div className="header-card">
        <div className="tab-container">
          <button
            className={`tab-button ${activeTab === "plan" ? "active" : ""}`}
            onClick={() => setActiveTab("plan")}
          >
            Plan
          </button>
          <button
            className={`tab-button ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            Summary
          </button>
          <button
            className={`tab-button ${activeTab === "metrics" ? "active" : ""}`}
            onClick={() => setActiveTab("metrics")}
          >
            Metrics
          </button>
        </div>

        <div className="tooltip">
          <i
            className="btn btn-primary fa-solid fa-plus"
            id="misc-new-btn"
            onClick={() => handleOpenModal()}
          ></i>
          <span className="tooltiptext">New Misc.</span>
        </div>
      </div>

      <hr />
      <div className="misc-list-container">
        {filteredEntries.map((entry) => (
          <div
            className="misc-item"
            key={entry.id}
            onClick={() => handleOpenModal(entry)}
          >
            <div className="misc-header">
              <p className="no-id">
                N<sup>o</sup>: {`000${entry.id}`.slice(-5)}
              </p>
              <p className="entry-date">{formatDate(entry.entry_date)}</p>
            </div>
            <div className="misc-item-body">
              <span className="misc-item-description">
                {splitText(entry.description)}
              </span>
            </div>
            <div className="misc-item-footer">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(entry.id);
                }}
                className="delete-icon"
              >
                <i className="fa-solid fa-trash"></i>
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && isEditing && selectedMisc && (
        <UpdateMisc
          misc={selectedMisc}
          onClose={handleCloseModal}
          onSave={handleSaveChanges}
        />
      )}

      {showModal && !isEditing && (
        <NewMisc onClose={handleCloseModal} onSave={handleSaveChanges} />
      )}
    </div>
  );
};

export default Misc;
