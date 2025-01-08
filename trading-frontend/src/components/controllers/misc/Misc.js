import React, { useState, useEffect } from "react";
import { fetchMiscEntries, updateMiscEntry } from "../api/MiscAPI";
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
  const [componentLoading, setComponentLoading] = useState(true);
  const [fadeInTable, setFadeInTable] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => setComponentLoading(false), 1200);
    fetchMiscData();
  }, []);

  const fetchMiscData = async () => {
    setLoading(true);
    setFadeInTable(false);

    try {
      const data = await fetchMiscEntries();
      setMiscEntries(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      setError("Error fetching Plan");
    } finally {
      setLoading(false);
      setTimeout(() => setFadeInTable(true), 1500);
    }
  };

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
        setItemsLoading(true);
        await updateMiscEntry(selectedMisc.id, updatedData);
        setMiscEntries((prevMisc) =>
          prevMisc.map((ms) =>
            ms.id === selectedMisc.id ? { ...ms, ...updatedData } : ms
          )
        );
      } catch (error) {
        console.error("Error updating watchlist:", error);
      } finally {
        setItemsLoading(false);
      }
    } else {
      fetchMiscData();
    }
    handleCloseModal();
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
                  <p className="title">Plan</p>
                  <div className="tooltip">
                    <i
                      className="btn btn-primary fa-solid fa-plus"
                      id="misc-new-btn"
                      onClick={() => handleOpenModal()}
                    ></i>
                    <span className="tooltiptext">New Plan.</span>
                  </div>
                </div>

                <hr />
                <div
                  className={`fade-in ${fadeInTable ? "visible" : "hidden"}`}
                >
                  <div className="misc-list-container">
                    {itemsLoading ? (
                      <div className="items-spinner-wrapper">
                        <div className="items-spinner"></div>
                      </div>
                    ) : (
                      miscEntries.map((entry) => (
                        <div
                          className="misc-item"
                          key={entry.id}
                          onClick={() => handleOpenModal(entry)}
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
                          <div className="misc-item-footer">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                // handleDelete(entry.id);
                              }}
                              className="delete-icon"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {showModal && isEditing && selectedMisc && (
                  <UpdateMisc
                    misc={selectedMisc}
                    onClose={handleCloseModal}
                    onSave={handleSaveChanges}
                  />
                )}

                {showModal && !isEditing && (
                  <NewMisc
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

export default Misc;

// import React, { useState, useEffect } from "react";
// import {
//   fetchMiscEntries,
//   updateMiscEntry,
//   createMiscEntry,
//   deleteMiscEntry,
// } from "../api/MiscAPI";
// import NewMisc from "./NewMisc";
// import UpdateMisc from "./UpdateMisc";
// import { formatDate, splitText } from "../func/functions";

// const Misc = () => {
//   const [miscEntries, setMiscEntries] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedMisc, setSelectedMisc] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [fadeInItems, setFadeInItems] = useState(false);
//   const [componentLoading, setComponentLoading] = useState(true);
//   const [itemsLoading, setItemsLoading] = useState(false);

//   useEffect(() => {
//     const getMiscEntries = async () => {
//       setFadeInItems(false); // Fade out items
//       try {
//         const data = await fetchMiscEntries();
//         // Sort entries so the most recent (highest id) comes first
//         setMiscEntries(data.sort((a, b) => b.id - a.id));
//       } catch (error) {
//         setError("Error fetching entries");
//       } finally {
//         setLoading(false);
//         setTimeout(() => setFadeInItems(true), 300); // Fade in items
//       }
//     };

//     // Initial load
//     setTimeout(() => setComponentLoading(false), 1500);
//     getMiscEntries();
//   }, []);

//   const handleOpenModal = (misc = null) => {
//     setSelectedMisc(misc);
//     setIsEditing(!!misc);
//     setShowModal(true);
//   };

//   const handleCloseModal = () => {
//     setSelectedMisc(null);
//     setIsEditing(false);
//     setShowModal(false);
//   };

//   const reloadItems = async () => {
//     setItemsLoading(true); // Show loading spinner for items
//     setFadeInItems(false); // Fade out items
//     try {
//       const data = await fetchMiscEntries();
//       setMiscEntries(data.sort((a, b) => b.id - a.id));
//     } catch (error) {
//       console.error("Error reloading items:", error);
//     } finally {
//       setTimeout(() => {
//         setItemsLoading(false);
//         setFadeInItems(true); // Fade in items
//       }, 300);
//     }
//   };

//   const handleSaveChanges = async (updatedData) => {
//     try {
//       if (isEditing) {
//         await updateMiscEntry(selectedMisc.id, updatedData);
//       } else {
//         await createMiscEntry(updatedData);
//       }
//       handleCloseModal();
//       reloadItems();
//     } catch (error) {
//       console.error("Error saving misc entry:", error);
//     }
//   };

//   const handleDelete = async (id) => {
//     try {
//       await deleteMiscEntry(id);
//       reloadItems();
//     } catch (error) {
//       console.error("Error deleting misc entry:", error);
//     }
//   };

//   return (
//     <div className="misc-wrapper">
//       {componentLoading && (
//         <div className="component-loading-spinner-wrapper">
//           <div className="spinner"></div>
//         </div>
//       )}

//       <div
//         className={`misc-container ${
//           !componentLoading ? "fade-in visible" : "loading"
//         }`}
//       >
//         {!componentLoading && (
//           <>
//             {loading && (
//               <div className="spinner-wrapper">
//                 <div className="spinner"></div>
//               </div>
//             )}

//             {!loading && error ? (
//               <div>Error: {error}</div>
//             ) : (
//               <>
//                 <div className="header-card">
//                   <p className="title">Plan</p>
//                   <div className="tooltip">
//                     <i
//                       className="btn btn-primary fa-solid fa-plus"
//                       id="misc-new-btn"
//                       onClick={() => handleOpenModal()}
//                     ></i>
//                     <span className="tooltiptext">New Plan.</span>
//                   </div>
//                 </div>

//                 <hr />
//                 <div className="misc-list-container">
//                   {itemsLoading ? (
//                     <div className="items-spinner-wrapper">
//                       <div className="spinner"></div>
//                     </div>
//                   ) : (
//                     <div
//                       className={`fade-in-items ${
//                         fadeInItems ? "visible" : "hidden"
//                       }`}
//                     >
//                       {miscEntries.map((entry) => (
//                         <div
//                           className="misc-item"
//                           key={entry.id}
//                           onClick={() => handleOpenModal(entry)}
//                         >
//                           <div className="misc-header">
//                             <p className="no-id">
//                               N<sup>o</sup>: {`000${entry.id}`.slice(-5)}
//                             </p>
//                             <p className="entry-date">
//                               {formatDate(entry.entry_date)}
//                             </p>
//                           </div>
//                           <div className="misc-item-body">
//                             <span className="misc-item-description">
//                               {splitText(entry.description)}
//                             </span>
//                           </div>
//                           <div className="misc-item-footer">
//                             <span
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 handleDelete(entry.id);
//                               }}
//                               className="delete-icon"
//                             >
//                               <i className="fa-solid fa-trash"></i>
//                             </span>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 {showModal && isEditing && selectedMisc && (
//                   <UpdateMisc
//                     misc={selectedMisc}
//                     onClose={handleCloseModal}
//                     onSave={handleSaveChanges}
//                   />
//                 )}

//                 {showModal && !isEditing && (
//                   <NewMisc
//                     onClose={handleCloseModal}
//                     onSave={handleSaveChanges}
//                   />
//                 )}
//               </>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Misc;

// import React, { useState, useEffect } from "react";
// import {
//   fetchMiscEntries,
//   updateMiscEntry,
//   createMiscEntry,
//   deleteMiscEntry,
// } from "../api/MiscAPI";
// import NewMisc from "./NewMisc";
// import UpdateMisc from "./UpdateMisc";
// import { formatDate, splitText } from "../func/functions";

// const Misc = () => {
//   const [miscEntries, setMiscEntries] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedMisc, setSelectedMisc] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [fadeInTable, setFadeInTable] = useState(false);
//   const [componentLoading, setComponentLoading] = useState(true);
//   const [itemsLoading, setItemsLoading] = useState(false);

//   useEffect(() => {
//     const getMiscEntries = async () => {
//       setFadeInTable(false); // Start fade-out
//       try {
//         setLoading(true);
//         const data = await fetchMiscEntries();
//         // Sort entries so the most recent (highest id) comes first
//         setMiscEntries(data.sort((a, b) => b.id - a.id));
//       } catch (error) {
//         setError("Error fetching entries");
//       } finally {
//         setLoading(false);
//         setTimeout(() => setFadeInTable(true), 1000); // Start fade-in
//       }
//     };

//     // Initial load
//     setTimeout(() => setComponentLoading(false), 1500);
//     getMiscEntries();
//   }, []);

//   const handleOpenModal = (misc = null) => {
//     setSelectedMisc(misc);
//     setIsEditing(!!misc);
//     setShowModal(true);
//   };

//   const handleCloseModal = () => {
//     setSelectedMisc(null);
//     setIsEditing(false);
//     setShowModal(false);
//   };

//   const handleSaveChanges = async (updatedData) => {
//     setItemsLoading(true);
//     setFadeInTable(false); // Fade out table
//     try {
//       if (isEditing) {
//         await updateMiscEntry(selectedMisc.id, updatedData);
//         setMiscEntries((prevEntries) =>
//           prevEntries
//             .map((entry) =>
//               entry.id === selectedMisc.id
//                 ? { ...entry, ...updatedData }
//                 : entry
//             )
//             .sort((a, b) => b.id - a.id)
//         );
//       } else {
//         const newEntry = await createMiscEntry(updatedData);
//         setMiscEntries((prevEntries) =>
//           [newEntry, ...prevEntries].sort((a, b) => b.id - a.id)
//         );
//       }
//     } catch (error) {
//       console.error("Error saving misc entry:", error);
//     } finally {
//       setItemsLoading(false);
//       setFadeInTable(true); // Fade in table
//       handleCloseModal();
//     }
//   };

//   const handleDelete = async (id) => {
//     setItemsLoading(true);
//     setFadeInTable(false); // Fade out table
//     try {
//       await deleteMiscEntry(id);
//       setMiscEntries((prevEntries) =>
//         prevEntries.filter((entry) => entry.id !== id)
//       );
//     } catch (error) {
//       console.error("Error deleting misc entry:", error);
//     } finally {
//       setItemsLoading(false);
//       setFadeInTable(true); // Fade in table
//     }
//   };

//   return (
//     <div className="misc-wrapper">
//       {componentLoading && (
//         <div className="component-loading-spinner-wrapper">
//           <div className="spinner"></div>
//         </div>
//       )}

//       <div
//         className={`misc-container ${
//           !componentLoading ? "fade-in visible" : "loading"
//         }`}
//       >
//         {!componentLoading && (
//           <>
//             {loading || itemsLoading ? (
//               <div className="spinner-wrapper">
//                 <div className="spinner"></div>
//               </div>
//             ) : error ? (
//               <div>Error: {error}</div>
//             ) : (
//               <>
//                 <div className="header-card">
//                   <p className="title">Plan</p>
//                   <div className="tooltip">
//                     <i
//                       className="btn btn-primary fa-solid fa-plus"
//                       id="misc-new-btn"
//                       onClick={() => handleOpenModal()}
//                     ></i>
//                     <span className="tooltiptext">New Misc.</span>
//                   </div>
//                 </div>

//                 <hr />
//                 <div
//                   className={`fade-in ${fadeInTable ? "visible" : "hidden"}`}
//                 >
//                   <div className="misc-list-container">
//                     {miscEntries.map((entry) => (
//                       <div
//                         className="misc-item"
//                         key={entry.id}
//                         onClick={() => handleOpenModal(entry)}
//                       >
//                         <div className="misc-header">
//                           <p className="no-id">
//                             N<sup>o</sup>: {`000${entry.id}`.slice(-5)}
//                           </p>
//                           <p className="entry-date">
//                             {formatDate(entry.entry_date)}
//                           </p>
//                         </div>
//                         <div className="misc-item-body">
//                           <span className="misc-item-description">
//                             {splitText(entry.description)}
//                           </span>
//                         </div>
//                         <div className="misc-item-footer">
//                           <span
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               handleDelete(entry.id);
//                             }}
//                             className="delete-icon"
//                           >
//                             <i className="fa-solid fa-trash"></i>
//                           </span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {showModal && isEditing && selectedMisc && (
//                   <UpdateMisc
//                     misc={selectedMisc}
//                     onClose={handleCloseModal}
//                     onSave={handleSaveChanges}
//                   />
//                 )}

//                 {showModal && !isEditing && (
//                   <NewMisc
//                     onClose={handleCloseModal}
//                     onSave={handleSaveChanges}
//                   />
//                 )}
//               </>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Misc;

// // import React, { useState, useEffect } from "react";
// // import {
// //   fetchMiscEntries,
// //   updateMiscEntry,
// //   createMiscEntry,
// //   deleteMiscEntry,
// // } from "../api/MiscAPI";
// // import NewMisc from "./NewMisc";
// // import UpdateMisc from "./UpdateMisc";
// // import { formatDate, splitText } from "../func/functions";

// // const Misc = () => {
// //   const [miscEntries, setMiscEntries] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [showModal, setShowModal] = useState(false);
// //   const [selectedMisc, setSelectedMisc] = useState(null);
// //   const [isEditing, setIsEditing] = useState(false);
// //   const [fadeInTable, setFadeInTable] = useState(false);

// //   const [componentLoading, setComponentLoading] = useState(true);
// //   const [itemsLoading, setItemsLoading] = useState(false);

// //   useEffect(() => {
// //     setTimeout(() => setComponentLoading(false), 1500);
// //     const getMiscEntries = async () => {
// //       setFadeInTable(false);

// //       try {
// //         setLoading(true);
// //         const data = await fetchMiscEntries();
// //         // Sort entries so the most recent (highest id) comes first
// //         setMiscEntries(data.sort((a, b) => b.id - a.id));
// //       } catch (error) {
// //         setError("Error fetching entries");
// //       } finally {
// //         setLoading(false);
// //         setTimeout(() => setFadeInTable(true), 1000);
// //       }
// //     };

// //     getMiscEntries();
// //   }, []);

// //   const handleOpenModal = (misc = null) => {
// //     setSelectedMisc(misc);
// //     setIsEditing(!!misc);
// //     setShowModal(true);
// //   };

// //   const handleCloseModal = () => {
// //     setSelectedMisc(null);
// //     setIsEditing(false);
// //     setShowModal(false);
// //   };

// //   const handleSaveChanges = async (updatedData) => {
// //     setItemsLoading(true);
// //     try {
// //       if (isEditing) {
// //         await updateMiscEntry(selectedMisc.id, updatedData);
// //         setMiscEntries(
// //           (prevEntries) =>
// //             prevEntries
// //               .map((entry) =>
// //                 entry.id === selectedMisc.id
// //                   ? { ...entry, ...updatedData }
// //                   : entry
// //               )
// //               .sort((a, b) => b.id - a.id) // Re-sort after update
// //         );
// //       } else {
// //         const newEntry = await createMiscEntry(updatedData);
// //         setMiscEntries((prevEntries) =>
// //           [newEntry, ...prevEntries].sort((a, b) => b.id - a.id)
// //         );
// //       }
// //     } catch (error) {
// //       console.error("Error saving misc entry:", error);
// //     } finally {
// //       setItemsLoading(false);
// //       handleCloseModal();
// //     }
// //   };

// //   const handleDelete = async (id) => {
// //     setItemsLoading(true);
// //     try {
// //       await deleteMiscEntry(id);
// //       setMiscEntries((prevEntries) =>
// //         prevEntries.filter((entry) => entry.id !== id)
// //       );
// //     } catch (error) {
// //       console.error("Error deleting misc entry:", error);
// //     } finally {
// //       setItemsLoading(false);
// //     }
// //   };

// //   return (
// //     <div className="misc-wrapper">
// //       {componentLoading && (
// //         <div className="component-loading-spinner-wrapper">
// //           <div className="spinner"></div>
// //         </div>
// //       )}

// //       <div
// //         className={`misc-container ${
// //           !componentLoading ? "fade-in visible" : "loading"
// //         }`}
// //       >
// //         {!componentLoading && (
// //           <>
// //             {loading && (
// //               <div className="spinner-wrapper">
// //                 <div className="spinner"></div>
// //               </div>
// //             )}

// //             {!loading && error ? (
// //               <div>Error: {error}</div>
// //             ) : (
// //               <>
// //                 <div className="header-card">
// //                   <p className="title">Plan</p>
// //                   <div className="tooltip">
// //                     <i
// //                       className="btn btn-primary fa-solid fa-plus"
// //                       id="misc-new-btn"
// //                       onClick={() => handleOpenModal()}
// //                     ></i>
// //                     <span className="tooltiptext">New Misc.</span>
// //                   </div>
// //                 </div>

// //                 <hr />
// //                 <div
// //                   className={`fade-in ${fadeInTable ? "visible" : "hidden"}`}
// //                 >
// //                   <div className="misc-list-container">
// //                     {itemsLoading ? (
// //                       <div className="items-spinner-wrapper">
// //                         <div className="items-spinner"></div>
// //                       </div>
// //                     ) : (
// //                       miscEntries.map((entry) => (
// //                         <div
// //                           className="misc-item"
// //                           key={entry.id}
// //                           onClick={() => handleOpenModal(entry)}
// //                         >
// //                           <div className="misc-header">
// //                             <p className="no-id">
// //                               N<sup>o</sup>: {`000${entry.id}`.slice(-5)}
// //                             </p>
// //                             <p className="entry-date">
// //                               {formatDate(entry.entry_date)}
// //                             </p>
// //                           </div>
// //                           <div className="misc-item-body">
// //                             <span className="misc-item-description">
// //                               {splitText(entry.description)}
// //                             </span>
// //                           </div>
// //                           <div className="misc-item-footer">
// //                             <span
// //                               onClick={(e) => {
// //                                 e.stopPropagation();
// //                                 handleDelete(entry.id);
// //                               }}
// //                               className="delete-icon"
// //                             >
// //                               <i className="fa-solid fa-trash"></i>
// //                             </span>
// //                           </div>
// //                         </div>
// //                       ))
// //                     )}
// //                   </div>
// //                 </div>

// //                 {showModal && isEditing && selectedMisc && (
// //                   <UpdateMisc
// //                     misc={selectedMisc}
// //                     onClose={handleCloseModal}
// //                     onSave={handleSaveChanges}
// //                   />
// //                 )}

// //                 {showModal && !isEditing && (
// //                   <NewMisc
// //                     onClose={handleCloseModal}
// //                     onSave={handleSaveChanges}
// //                   />
// //                 )}
// //               </>
// //             )}
// //           </>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default Misc;
