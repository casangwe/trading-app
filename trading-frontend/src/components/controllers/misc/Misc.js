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

  // For updating
  const [selectedMisc, setSelectedMisc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    console.log("Component is loading...");
    setTimeout(() => {
      setComponentLoading(false);
      console.log("Component loaded");
    }, 1500);
    fetchMiscData();
  }, []);

  // const fetchMiscData = async () => {
  //   console.log("Fetching misc data...");
  //   setLoading(true);
  //   setError(null);
  //   setFadeInTable(false);

  //   setTimeout(async () => {
  //     try {
  //       const data = await fetchMiscEntries();
  //       setMiscEntries(data.sort((a, b) => b.id - a.id));
  //       console.log("Fetched misc entries:", data);
  //     } catch (err) {
  //       setError("Error fetching misc entries");
  //       console.error(err);
  //     } finally {
  //       setLoading(false);
  //       console.log("Data fetch complete");
  //       setTimeout(() => {
  //         setFadeInTable(true);
  //         console.log("Fade-in animation complete");
  //       }, 1000);
  //     }
  //   }, 1000);
  // };

  const fetchMiscData = async () => {
    console.log("Fetching misc data...");
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

        console.log("Fetched misc entries:", sortedData);
      } catch (err) {
        setError("Error fetching misc entries");
        console.error(err);
      } finally {
        setLoading(false);
        console.log("Data fetch complete");
        setTimeout(() => {
          setFadeInTable(true);
          console.log("Fade-in animation complete");
        }, 1000);
      }
    }, 1000);
  };

  const handleNewMiscEntry = async (newMisc) => {
    console.log("Adding new misc entry...");
    setShowModal(false);
    if (onNewMisc) onNewMisc(newMisc);

    setMiscEntries([]);
    setLoading(true);
    setFadeInTable(false);

    await fetchMiscData();
  };

  const handleUpdateMiscEntry = async (updatedMisc) => {
    console.log("Updating misc entry...");
    const { id, ...miscData } = updatedMisc;
    try {
      await updateMiscEntry(id, miscData);
      console.log("Misc entry updated:", updatedMisc);
      setFadeInTable(false);
      setLoading(true);
      setSelectedMisc(null);
      setIsEditing(false);
      setShowModal(false);

      await fetchMiscData();
    } catch (error) {
      console.error("Error updating misc entry:", error);
    }
  };

  const handleOpenNewModal = () => {
    console.log("Opening NewMisc modal...");
    setIsEditing(false);
    setSelectedMisc(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    console.log("Closing modal...");
    setShowModal(false);
    setIsEditing(false);
    setSelectedMisc(null);
    console.log("Modal closed");
  };

  const handleEditMisc = (misc) => {
    console.log("Editing misc entry:", misc);
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
                    {/* Left Panel - Date List */}
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

                    {/* Right Panel - Misc List */}
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

// import React, { useState, useEffect } from "react";
// import { fetchMiscEntries, updateMiscEntry } from "../api/MiscAPI";
// import NewMisc from "./NewMisc";
// import UpdateMisc from "./UpdateMisc";
// import { formatDate, splitText } from "../func/functions";

// const Misc = ({ onNewMisc }) => {
//   const [miscEntries, setMiscEntries] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [componentLoading, setComponentLoading] = useState(true);
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [filteredEntries, setFilteredEntries] = useState([]);

//   // For updating
//   const [selectedMisc, setSelectedMisc] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);

//   useEffect(() => {
//     console.log("Component is loading...");
//     setTimeout(() => {
//       setComponentLoading(false);
//       console.log("Component loaded");
//     }, 1500);
//     fetchMiscData();
//   }, []);

//   const fetchMiscData = async () => {
//     console.log("Fetching misc data...");
//     setLoading(true);
//     setError(null);

//     setTimeout(async () => {
//       try {
//         const data = await fetchMiscEntries();
//         const sortedData = data.sort(
//           (a, b) => new Date(b.entry_date) - new Date(a.entry_date)
//         );
//         setMiscEntries(sortedData);
//         console.log("Fetched misc entries:", sortedData);

//         // Default to first date in list
//         if (sortedData.length > 0) {
//           setSelectedDate(formatDate(sortedData[0].entry_date));
//           setFilteredEntries(
//             sortedData.filter(
//               (entry) =>
//                 formatDate(entry.entry_date) ===
//                 formatDate(sortedData[0].entry_date)
//             )
//           );
//         }
//       } catch (err) {
//         setError("Error fetching misc entries");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     }, 1000);
//   };

//   const handleDateClick = (date) => {
//     setSelectedDate(date);
//     setFilteredEntries(
//       miscEntries.filter((entry) => formatDate(entry.entry_date) === date)
//     );
//   };

//   const handleNewMiscEntry = async (newMisc) => {
//     console.log("Adding new misc entry...");
//     setShowModal(false);
//     if (onNewMisc) onNewMisc(newMisc);
//     await fetchMiscData();
//   };

//   const handleUpdateMiscEntry = async (updatedMisc) => {
//     console.log("Updating misc entry...");
//     try {
//       await updateMiscEntry(updatedMisc);
//       console.log("Misc entry updated:", updatedMisc);
//       setSelectedMisc(null);
//       setIsEditing(false);
//       setShowModal(false);
//       await fetchMiscData();
//     } catch (error) {
//       console.error("Error updating misc entry:", error);
//     }
//   };

//   const handleOpenNewModal = () => {
//     setIsEditing(false);
//     setSelectedMisc(null);
//     setShowModal(true);
//   };

//   const handleEditMisc = (misc) => {
//     setSelectedMisc(misc);
//     setIsEditing(true);
//     setShowModal(true);
//   };

//   // Get unique dates from miscEntries
//   const uniqueDates = [
//     ...new Set(miscEntries.map((entry) => formatDate(entry.entry_date))),
//   ];

//   return (
//     <div className="misc-wrapper">
//       {componentLoading ? (
//         <div className="component-loading-spinner-wrapper">
//           <div className="spinner"></div>
//         </div>
//       ) : (
//         <div className="misc-container">
//           <div className="header-card">
//             <p className="title">{selectedDate}</p>
//             <div className="tooltip">
//               <i
//                 className="btn btn-primary fa-solid fa-plus"
//                 id="misc-new-btn"
//                 onClick={handleOpenNewModal}
//               ></i>
//               <span className="tooltiptext">New Plan</span>
//             </div>
//           </div>
//           <hr />
//           <div className="left-panel">
//             {/* <h3 className="date-header">Dates</h3> */}
//             <div className="date-list">
//               {uniqueDates.map((date) => (
//                 <div
//                   key={date}
//                   className={`date-item ${
//                     selectedDate === date ? "active" : ""
//                   }`}
//                   onClick={() => handleDateClick(date)}
//                 >
//                   {date}
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="right-panel">
//             <div className="misc-list-container">
//               {filteredEntries.map((entry) => (
//                 <div
//                   className="misc-item"
//                   key={entry.id}
//                   onClick={() => handleEditMisc(entry)}
//                 >
//                   <div className="misc-header">
//                     <p className="no-id">
//                       N<sup>o</sup>: {`000${entry.id}`.slice(-5)}
//                     </p>
//                     <p className="entry-date">{formatDate(entry.entry_date)}</p>
//                   </div>
//                   <div className="misc-item-body">
//                     <span className="misc-item-description">
//                       {splitText(entry.description)}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {showModal && isEditing && selectedMisc && (
//         <UpdateMisc
//           misc={selectedMisc}
//           onClose={() => setShowModal(false)}
//           onSave={handleUpdateMiscEntry}
//         />
//       )}

//       {showModal && !isEditing && (
//         <NewMisc
//           onClose={() => setShowModal(false)}
//           onNewMisc={handleNewMiscEntry}
//         />
//       )}
//     </div>
//   );
// };

// export default Misc;
