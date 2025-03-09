import React, { useState, useEffect } from "react";
import { fetchMiscEntries, updateMiscEntry } from "../api/MiscAPI";
import NewMisc from "./NewMisc";
import UpdateMisc from "./UpdateMisc";
import { formatDate, splitText } from "../func/functions";

const Misc = ({ onNewMisc }) => {
  const [miscEntries, setMiscEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [fadeInTable, setFadeInTable] = useState(false);
  const [componentLoading, setComponentLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMisc, setSelectedMisc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setComponentLoading(false);
    }, 1500);
    fetchMiscData();
  }, []);

  const fetchMiscData = async () => {
    setLoading(true);
    setError(null);
    setFadeInTable(false);

    setTimeout(async () => {
      try {
        const data = await fetchMiscEntries();
        const sortedData = data.sort(
          (a, b) => new Date(b.entry_date) - new Date(a.entry_date)
        );
        setMiscEntries(sortedData);

        if (sortedData.length > 0) {
          setSelectedDate(formatDate(sortedData[0].entry_date));
        }
      } catch (err) {
        setError("Error fetching misc entries");
        console.error(err);
      } finally {
        setLoading(false);
        setTimeout(() => {
          setFadeInTable(true);
        }, 1000);
      }
    }, 1000);
  };

  const handleNewMiscEntry = async (newMisc) => {
    setShowModal(false);
    if (onNewMisc) onNewMisc(newMisc);

    setMiscEntries([]);
    setLoading(true);
    setFadeInTable(false);

    await fetchMiscData();
  };

  const handleUpdateMiscEntry = async (updatedMisc) => {
    const { id, ...miscData } = updatedMisc;
    try {
      setShowModal(false);
      setFadeInTable(false);
      await updateMiscEntry(id, miscData);
      setLoading(true);
      setSelectedMisc(null);
      setIsEditing(false);

      await fetchMiscData();
    } catch (error) {
      console.error("Error updating misc entry:", error);
    }
  };

  const handleOpenNewModal = () => {
    setIsEditing(false);
    setSelectedMisc(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedMisc(null);
  };

  const handleEditMisc = (misc) => {
    setSelectedMisc(misc);
    setIsEditing(true);
    setShowModal(true);
  };

  return (
    <div className="misc-wrapper">
      {componentLoading && (
        <div className="component-loading-spinner-wrapper">
          <div className="spinner"></div>
        </div>
      )}

      <div
        className={`misc-container ${
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
              <div>{error}</div>
            ) : (
              <>
                <div className="header-card">
                  <p className="title">Plan</p>
                  <div className="tooltip">
                    <i
                      className="btn btn-primary fa-solid fa-plus"
                      id="misc-new-btn"
                      onClick={handleOpenNewModal}
                    ></i>
                    <span className="tooltiptext">New Plan</span>
                  </div>
                </div>

                <hr />
                <div className={`fade-in ${fadeInTable ? "visible" : ""}`}>
                  <div className="misc-content-wrapper">
                    <div className="misc-datelist-container">
                      {Array.from(
                        new Set(
                          miscEntries.map((entry) =>
                            formatDate(entry.entry_date)
                          )
                        )
                      )
                        .sort((a, b) => new Date(b) - new Date(a))
                        .map((date) => (
                          <div
                            key={date}
                            className={`date-item ${
                              selectedDate === date ? "active" : ""
                            }`}
                            onClick={() => setSelectedDate(date)}
                          >
                            {date}
                          </div>
                        ))}
                    </div>

                    <div className="misc-list-container">
                      {miscEntries
                        .filter(
                          (entry) =>
                            formatDate(entry.entry_date) === selectedDate
                        )
                        .map((entry) => (
                          <div
                            className="misc-item"
                            key={entry.id}
                            onClick={() => handleEditMisc(entry)}
                          >
                            <div className="misc-header">
                              <p className="no-id">
                                N<sup>o</sup>: {`000${entry.id}`.slice(-5)}
                              </p>
                              <p className="entry-date">
                                {formatDate(entry.entry_date)}
                              </p>
                            </div>
                            <div className="misc-item-body">
                              <span className="misc-item-description">
                                {splitText(entry.description)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {showModal && isEditing && selectedMisc && (
                  <UpdateMisc
                    misc={selectedMisc}
                    onClose={handleCloseModal}
                    onSave={handleUpdateMiscEntry}
                  />
                )}

                {showModal && !isEditing && (
                  <NewMisc
                    onClose={handleCloseModal}
                    onNewMisc={handleNewMiscEntry}
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

export default Misc;
