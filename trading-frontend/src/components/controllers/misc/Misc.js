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

  const fetchMiscData = async () => {
    console.log("Fetching misc data...");
    setLoading(true);
    setError(null);
    setFadeInTable(false);

    setTimeout(async () => {
      try {
        const data = await fetchMiscEntries();
        setMiscEntries(data.sort((a, b) => b.id - a.id));
        console.log("Fetched misc entries:", data);
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
    const { id, ...miscData } = updatedMisc; // Separate ID from miscData
    try {
      await updateMiscEntry(id, miscData); // Pass id and miscData correctly
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
                  <div className="misc-list-container">
                    {miscEntries.map((entry) => (
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
//   const [fadeInTable, setFadeInTable] = useState(false);
//   // const [itemsLoading, setItemsLoading] = useState(false);

//   //For updating
//   const [selectedMisc, setSelectedMisc] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);

//   useEffect(() => {
//     setTimeout(() => {
//       setComponentLoading(false);
//     }, 1500);
//     fetchMiscData();
//   }, []);

//   const fetchMiscData = async () => {
//     setLoading(true);
//     setError(null);
//     setFadeInTable(false);

//     setTimeout(async () => {
//       try {
//         const data = await fetchMiscEntries();
//         setMiscEntries(data.sort((a, b) => b.id - a.id));
//       } catch (err) {
//         setError("Error fetching trades");
//         console.error(err);
//       } finally {
//         setLoading(false);
//         setTimeout(() => setFadeInTable(true), 1000);
//       }
//     }, 1000);
//   };

//   const handleNewMiscEntry = async (newMisc) => {
//     setShowModal(false);
//     if (onNewMisc) onNewMisc(newMisc);

//     setMiscEntries([]);
//     setLoading(true);
//     setFadeInTable(false);

//     await fetchMiscData();
//   };

//   const handleOpenModal = () => setShowModal(true);
//   const handleCloseModal = () => setShowModal(false);

//   return (
//     <div className="misc-wrapper">
//       {componentLoading && (
//         <div className="component-loading-spinner-wrapper">
//           <div className="spinner"></div>
//         </div>
//       )}

//       {/* Fade-in the misc-container only after componentLoading */}
//       <div
//         className={`misc-container ${
//           !componentLoading ? "fade-in" : "loading"
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
//               <div>{error}</div>
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
//                     <span className="tooltiptext">New Plan</span>
//                   </div>
//                 </div>

//                 <hr />
//                 <div className={`fade-in ${fadeInTable ? "visible" : ""}`}>
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
//                               // handleDelete(entry.id);
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
//                   <UpdateMisc misc={selectedMisc} onClose={handleCloseModal} />
//                 )}

//                 {showModal && (
//                   <NewMisc
//                     onClose={handleCloseModal}
//                     onNewMisc={handleNewMiscEntry}
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
// //   const [fadeInItems, setFadeInItems] = useState(false);
// //   const [componentLoading, setComponentLoading] = useState(true);
// //   const [itemsLoading, setItemsLoading] = useState(false);

// //   useEffect(() => {
// //     const getMiscEntries = async () => {
// //       setFadeInItems(false); // Fade out items
// //       try {
// //         const data = await fetchMiscEntries();
// //         // Sort entries so the most recent (highest id) comes first
// //         setMiscEntries(data.sort((a, b) => b.id - a.id));
// //       } catch (error) {
// //         setError("Error fetching entries");
// //       } finally {
// //         setLoading(false);
// //         setTimeout(() => setFadeInItems(true), 300); // Fade in items
// //       }
// //     };

// //     // Initial load
// //     setTimeout(() => setComponentLoading(false), 1500);
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

// //   const reloadItems = async () => {
// //     setItemsLoading(true); // Show loading spinner for items
// //     setFadeInItems(false); // Fade out items
// //     try {
// //       const data = await fetchMiscEntries();
// //       setMiscEntries(data.sort((a, b) => b.id - a.id));
// //     } catch (error) {
// //       console.error("Error reloading items:", error);
// //     } finally {
// //       setTimeout(() => {
// //         setItemsLoading(false);
// //         setFadeInItems(true); // Fade in items
// //       }, 300);
// //     }
// //   };

// //   const handleSaveChanges = async (updatedData) => {
// //     try {
// //       if (isEditing) {
// //         await updateMiscEntry(selectedMisc.id, updatedData);
// //       } else {
// //         await createMiscEntry(updatedData);
// //       }
// //       handleCloseModal();
// //       reloadItems();
// //     } catch (error) {
// //       console.error("Error saving misc entry:", error);
// //     }
// //   };

// //   const handleDelete = async (id) => {
// //     try {
// //       await deleteMiscEntry(id);
// //       reloadItems();
// //     } catch (error) {
// //       console.error("Error deleting misc entry:", error);
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
// //                     <span className="tooltiptext">New Plan.</span>
// //                   </div>
// //                 </div>

// //                 <hr />
// //                 <div className="misc-list-container">
// //                   {itemsLoading ? (
// //                     <div className="items-spinner-wrapper">
// //                       <div className="spinner"></div>
// //                     </div>
// //                   ) : (
// //                     <div
// //                       className={`fade-in-items ${
// //                         fadeInItems ? "visible" : "hidden"
// //                       }`}
// //                     >
// //                       {miscEntries.map((entry) => (
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
// //                       ))}
// //                     </div>
// //                   )}
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
// //     const getMiscEntries = async () => {
// //       setFadeInTable(false); // Start fade-out
// //       try {
// //         setLoading(true);
// //         const data = await fetchMiscEntries();
// //         // Sort entries so the most recent (highest id) comes first
// //         setMiscEntries(data.sort((a, b) => b.id - a.id));
// //       } catch (error) {
// //         setError("Error fetching entries");
// //       } finally {
// //         setLoading(false);
// //         setTimeout(() => setFadeInTable(true), 1000); // Start fade-in
// //       }
// //     };

// //     // Initial load
// //     setTimeout(() => setComponentLoading(false), 1500);
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
// //     setFadeInTable(false); // Fade out table
// //     try {
// //       if (isEditing) {
// //         await updateMiscEntry(selectedMisc.id, updatedData);
// //         setMiscEntries((prevEntries) =>
// //           prevEntries
// //             .map((entry) =>
// //               entry.id === selectedMisc.id
// //                 ? { ...entry, ...updatedData }
// //                 : entry
// //             )
// //             .sort((a, b) => b.id - a.id)
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
// //       setFadeInTable(true); // Fade in table
// //       handleCloseModal();
// //     }
// //   };

// //   const handleDelete = async (id) => {
// //     setItemsLoading(true);
// //     setFadeInTable(false); // Fade out table
// //     try {
// //       await deleteMiscEntry(id);
// //       setMiscEntries((prevEntries) =>
// //         prevEntries.filter((entry) => entry.id !== id)
// //       );
// //     } catch (error) {
// //       console.error("Error deleting misc entry:", error);
// //     } finally {
// //       setItemsLoading(false);
// //       setFadeInTable(true); // Fade in table
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
// //             {loading || itemsLoading ? (
// //               <div className="spinner-wrapper">
// //                 <div className="spinner"></div>
// //               </div>
// //             ) : error ? (
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
// //                     {miscEntries.map((entry) => (
// //                       <div
// //                         className="misc-item"
// //                         key={entry.id}
// //                         onClick={() => handleOpenModal(entry)}
// //                       >
// //                         <div className="misc-header">
// //                           <p className="no-id">
// //                             N<sup>o</sup>: {`000${entry.id}`.slice(-5)}
// //                           </p>
// //                           <p className="entry-date">
// //                             {formatDate(entry.entry_date)}
// //                           </p>
// //                         </div>
// //                         <div className="misc-item-body">
// //                           <span className="misc-item-description">
// //                             {splitText(entry.description)}
// //                           </span>
// //                         </div>
// //                         <div className="misc-item-footer">
// //                           <span
// //                             onClick={(e) => {
// //                               e.stopPropagation();
// //                               handleDelete(entry.id);
// //                             }}
// //                             className="delete-icon"
// //                           >
// //                             <i className="fa-solid fa-trash"></i>
// //                           </span>
// //                         </div>
// //                       </div>
// //                     ))}
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

// // // import React, { useState, useEffect } from "react";
// // // import {
// // //   fetchMiscEntries,
// // //   updateMiscEntry,
// // //   createMiscEntry,
// // //   deleteMiscEntry,
// // // } from "../api/MiscAPI";
// // // import NewMisc from "./NewMisc";
// // // import UpdateMisc from "./UpdateMisc";
// // // import { formatDate, splitText } from "../func/functions";

// // // const Misc = () => {
// // //   const [miscEntries, setMiscEntries] = useState([]);
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState(null);
// // //   const [showModal, setShowModal] = useState(false);
// // //   const [selectedMisc, setSelectedMisc] = useState(null);
// // //   const [isEditing, setIsEditing] = useState(false);
// // //   const [fadeInTable, setFadeInTable] = useState(false);

// // //   const [componentLoading, setComponentLoading] = useState(true);
// // //   const [itemsLoading, setItemsLoading] = useState(false);

// // //   useEffect(() => {
// // //     setTimeout(() => setComponentLoading(false), 1500);
// // //     const getMiscEntries = async () => {
// // //       setFadeInTable(false);

// // //       try {
// // //         setLoading(true);
// // //         const data = await fetchMiscEntries();
// // //         // Sort entries so the most recent (highest id) comes first
// // //         setMiscEntries(data.sort((a, b) => b.id - a.id));
// // //       } catch (error) {
// // //         setError("Error fetching entries");
// // //       } finally {
// // //         setLoading(false);
// // //         setTimeout(() => setFadeInTable(true), 1000);
// // //       }
// // //     };

// // //     getMiscEntries();
// // //   }, []);

// // //   const handleOpenModal = (misc = null) => {
// // //     setSelectedMisc(misc);
// // //     setIsEditing(!!misc);
// // //     setShowModal(true);
// // //   };

// // //   const handleCloseModal = () => {
// // //     setSelectedMisc(null);
// // //     setIsEditing(false);
// // //     setShowModal(false);
// // //   };

// // //   const handleSaveChanges = async (updatedData) => {
// // //     setItemsLoading(true);
// // //     try {
// // //       if (isEditing) {
// // //         await updateMiscEntry(selectedMisc.id, updatedData);
// // //         setMiscEntries(
// // //           (prevEntries) =>
// // //             prevEntries
// // //               .map((entry) =>
// // //                 entry.id === selectedMisc.id
// // //                   ? { ...entry, ...updatedData }
// // //                   : entry
// // //               )
// // //               .sort((a, b) => b.id - a.id) // Re-sort after update
// // //         );
// // //       } else {
// // //         const newEntry = await createMiscEntry(updatedData);
// // //         setMiscEntries((prevEntries) =>
// // //           [newEntry, ...prevEntries].sort((a, b) => b.id - a.id)
// // //         );
// // //       }
// // //     } catch (error) {
// // //       console.error("Error saving misc entry:", error);
// // //     } finally {
// // //       setItemsLoading(false);
// // //       handleCloseModal();
// // //     }
// // //   };

// // //   const handleDelete = async (id) => {
// // //     setItemsLoading(true);
// // //     try {
// // //       await deleteMiscEntry(id);
// // //       setMiscEntries((prevEntries) =>
// // //         prevEntries.filter((entry) => entry.id !== id)
// // //       );
// // //     } catch (error) {
// // //       console.error("Error deleting misc entry:", error);
// // //     } finally {
// // //       setItemsLoading(false);
// // //     }
// // //   };

// // //   return (
// // //     <div className="misc-wrapper">
// // //       {componentLoading && (
// // //         <div className="component-loading-spinner-wrapper">
// // //           <div className="spinner"></div>
// // //         </div>
// // //       )}

// // //       <div
// // //         className={`misc-container ${
// // //           !componentLoading ? "fade-in visible" : "loading"
// // //         }`}
// // //       >
// // //         {!componentLoading && (
// // //           <>
// // //             {loading && (
// // //               <div className="spinner-wrapper">
// // //                 <div className="spinner"></div>
// // //               </div>
// // //             )}

// // //             {!loading && error ? (
// // //               <div>Error: {error}</div>
// // //             ) : (
// // //               <>
// // //                 <div className="header-card">
// // //                   <p className="title">Plan</p>
// // //                   <div className="tooltip">
// // //                     <i
// // //                       className="btn btn-primary fa-solid fa-plus"
// // //                       id="misc-new-btn"
// // //                       onClick={() => handleOpenModal()}
// // //                     ></i>
// // //                     <span className="tooltiptext">New Misc.</span>
// // //                   </div>
// // //                 </div>

// // //                 <hr />
// // //                 <div
// // //                   className={`fade-in ${fadeInTable ? "visible" : "hidden"}`}
// // //                 >
// // //                   <div className="misc-list-container">
// // //                     {itemsLoading ? (
// // //                       <div className="items-spinner-wrapper">
// // //                         <div className="items-spinner"></div>
// // //                       </div>
// // //                     ) : (
// // //                       miscEntries.map((entry) => (
// // //                         <div
// // //                           className="misc-item"
// // //                           key={entry.id}
// // //                           onClick={() => handleOpenModal(entry)}
// // //                         >
// // //                           <div className="misc-header">
// // //                             <p className="no-id">
// // //                               N<sup>o</sup>: {`000${entry.id}`.slice(-5)}
// // //                             </p>
// // //                             <p className="entry-date">
// // //                               {formatDate(entry.entry_date)}
// // //                             </p>
// // //                           </div>
// // //                           <div className="misc-item-body">
// // //                             <span className="misc-item-description">
// // //                               {splitText(entry.description)}
// // //                             </span>
// // //                           </div>
// // //                           <div className="misc-item-footer">
// // //                             <span
// // //                               onClick={(e) => {
// // //                                 e.stopPropagation();
// // //                                 handleDelete(entry.id);
// // //                               }}
// // //                               className="delete-icon"
// // //                             >
// // //                               <i className="fa-solid fa-trash"></i>
// // //                             </span>
// // //                           </div>
// // //                         </div>
// // //                       ))
// // //                     )}
// // //                   </div>
// // //                 </div>

// // //                 {showModal && isEditing && selectedMisc && (
// // //                   <UpdateMisc
// // //                     misc={selectedMisc}
// // //                     onClose={handleCloseModal}
// // //                     onSave={handleSaveChanges}
// // //                   />
// // //                 )}

// // //                 {showModal && !isEditing && (
// // //                   <NewMisc
// // //                     onClose={handleCloseModal}
// // //                     onSave={handleSaveChanges}
// // //                   />
// // //                 )}
// // //               </>
// // //             )}
// // //           </>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default Misc;
