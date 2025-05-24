import React, { useState, useEffect } from "react";
import { fetchOptionFlowAnalysis } from "../api/OptionFlowAPI";
import SummaryStats from "./SummaryStats";
import Expirations from "./Expirations";
import LargestTrade from "./LargestTrade";
import Message from "./Message";
import SentimentGauge from "./SentimentGauge";
import FlowTimeline from "./FlowTimeline";

const FlowSummary = ({
  symbol: propSymbol,
  dateRange: initialDateRange,
  onClose,
}) => {
  const [symbol, setSymbol] = useState(propSymbol || "");
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [analysisData, setAnalysisData] = useState(null);
  const [componentLoading, setComponentLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    if (!symbol) {
      setError("No stock symbol provided.");
      setComponentLoading(false);
      return;
    }

    setComponentLoading(true);
    setError("");
    setAnalysisData(null);
    setHasLoaded(false);

    try {
      const flowData = await fetchOptionFlowAnalysis(symbol, dateRange);

      if (!flowData || Object.keys(flowData).length === 0 || flowData.message) {
        throw new Error(`No option flow data found for ${symbol}`);
      }

      setAnalysisData(flowData);
      setError("");
    } catch (err) {
      console.error("Fetching data failed:", err.message);
      setError(err.message);
    } finally {
      setTimeout(() => {
        setComponentLoading(false);
        setTimeout(() => setHasLoaded(true), 100);
      }, 100);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol, dateRange]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="flow-modal-container" onClick={onClose}>
      <div className="flow-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flow-modal-header">
          <h3>{symbol}</h3>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="flow-modal-body flow-summary-wrapper">
          {componentLoading && (
            <div className="component-loading-spinner-wrapper">
              <div className="spinner"></div>
            </div>
          )}

          <div
            className={`flow-summary-container ${
              !componentLoading ? "fade-in" : "loading"
            }`}
          >
            {!componentLoading && (
              <>
                <div className="flow-message">
                  {analysisData?.market_sentiment && (
                    <Message data={analysisData} />
                  )}
                </div>
                <div className="flow-sentiment-guage">
                  {analysisData?.market_sentiment?.score !== undefined && (
                    <SentimentGauge
                      score={analysisData.market_sentiment.score}
                    />
                  )}
                </div>

                <div className="flow-tabs">
                  <div className="tab-container">
                    {[
                      { label: "Live", value: 0 },
                      { label: "1D", value: 1 },
                      { label: "2D", value: 2 },
                      { label: "3D", value: 3 },
                      { label: "5D", value: 5 },
                      { label: "All", value: 30 },
                    ].map((option) => (
                      <button
                        key={option.value}
                        className={`tab-button ${
                          dateRange === option.value ? "active" : ""
                        }`}
                        onClick={() => setDateRange(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flow-summary-and-largest-trade-container">
                  <div className="flow-summary">
                    {analysisData && <SummaryStats data={analysisData} />}
                  </div>
                  <div className="largest-trade">
                    {analysisData?.largest_trade && (
                      <LargestTrade trade={analysisData.largest_trade} />
                    )}
                  </div>
                </div>

                <div className="expirations">
                  {analysisData?.most_active_expirations && (
                    <Expirations
                      expirations={analysisData.most_active_expirations}
                    />
                  )}
                </div>

                <div className={`fade-in ${hasLoaded ? "visible" : ""}`}>
                  {error && <div className="error-message">{error}</div>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowSummary;

// import React, { useState, useEffect, useRef } from "react";
// import { useLocation } from "react-router-dom";
// import {
//   fetchOptionFlowAnalysis,
//   fetchWatchlistAnalysis,
//   uploadOptionFlow,
// } from "../api/OptionFlowAPI";
// import SummaryStats from "./SummaryStats";
// import Expirations from "./Expirations";
// import MetricFlow from "./MetricFlow";
// import LargestTrade from "./LargestTrade";
// import Message from "./Message";
// import SentimentGauge from "./SentimentGauge";
// import FlowTimeline from "./FlowTimeline";

// const FlowSummary = () => {
//   const location = useLocation();
//   const [symbol, setSymbol] = useState(location.state?.symbol || "");
//   const [analysisData, setAnalysisData] = useState(null);
//   const [componentLoading, setComponentLoading] = useState(false);
//   const [hasLoaded, setHasLoaded] = useState(false);
//   const [error, setError] = useState("");
//   const [file, setFile] = useState(null);
//   const [uploadMessage, setUploadMessage] = useState("");
//   const [uploading, setUploading] = useState(false);
//   const fileInputRef = useRef(null);
//   const [dateRange, setDateRange] = useState(1);
//   const [watchlistAnalysisData, setWatchlistAnalysisData] = useState(null);

//   const fetchData = async () => {
//     if (!symbol) {
//       setError("No stock symbol provided.");
//       setComponentLoading(false);
//       return;
//     }

//     setComponentLoading(true);
//     setError("");
//     setAnalysisData(null);
//     setWatchlistAnalysisData(null);
//     setHasLoaded(false);

//     try {
//       const [flowData, enrichedData] = await Promise.all([
//         fetchOptionFlowAnalysis(symbol, dateRange),
//         fetchWatchlistAnalysis(symbol),
//       ]);

//       if (!flowData || Object.keys(flowData).length === 0 || flowData.message) {
//         throw new Error(`No option flow data found for ${symbol}`);
//       }

//       setAnalysisData(flowData);
//       setWatchlistAnalysisData(enrichedData);
//       setError("");
//     } catch (err) {
//       console.error("Fetching data failed:", err.message);
//       setError(err.message);
//     } finally {
//       setTimeout(() => {
//         setComponentLoading(false);
//         setTimeout(() => setHasLoaded(true), 100);
//       }, 100);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [symbol, dateRange]);

//   useEffect(() => {
//     setSymbol(location.state?.symbol || "");
//     setError("");
//   }, [location]);

//   const handleOpenFileExplorer = () => {
//     fileInputRef.current.click();
//   };

//   const handleFileChange = (event) => {
//     const selectedFile = event.target.files[0];
//     if (selectedFile) {
//       setFile(selectedFile);
//       setUploadMessage(`Ready to upload ${selectedFile.name}`);
//     }
//   };

//   const handleUpload = async () => {
//     if (!file) {
//       console.warn("No file selected for upload.");
//       setUploadMessage("Please select a file first.");
//       return;
//     }

//     setUploading(true);
//     setUploadMessage(`Uploading ${file.name}...`);

//     try {
//       const response = await uploadOptionFlow(file);
//       setUploadMessage(`${response.message}`);
//       setFile(null);
//     } catch (error) {
//       console.error("Upload failed:", error.message);
//       setUploadMessage(`${error.message}`);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div className="flow-summary-wrapper">
//       {componentLoading && (
//         <div className="component-loading-spinner-wrapper">
//           <div className="spinner"></div>
//         </div>
//       )}

//       <div
//         className={`flow-summary-container ${
//           !componentLoading ? "fade-in" : "loading"
//         }`}
//       >
//         {!componentLoading && (
//           <>
//             <div className="header-card">
//               <p className="title">{symbol}</p>
//               <div className="tooltip">
//                 <i
//                   className={`btn btn-primary fa-solid ${
//                     file ? "fa-check" : "fa-plus"
//                   } upload-btn`}
//                   id="flow-upload-btn"
//                   onClick={file ? handleUpload : handleOpenFileExplorer}
//                 ></i>
//                 <span className="tooltiptext">
//                   {uploadMessage ||
//                     (file ? `Upload ${file.name}` : "Select File")}
//                 </span>
//               </div>
//             </div>

//             <div className="flow-message">
//               {analysisData?.market_sentiment && (
//                 <Message data={analysisData} />
//               )}
//             </div>
//             <div className="flow-sentiment-guage">
//               {analysisData?.market_sentiment?.score !== undefined && (
//                 <SentimentGauge score={analysisData.market_sentiment.score} />
//               )}{" "}
//             </div>
//             <div className="flow-tabs">
//               <div className="tab-container">
//                 {[
//                   { label: "Live", value: 0 },
//                   { label: "1D", value: 1 },
//                   { label: "2D", value: 2 },
//                   { label: "3D", value: 3 },
//                   { label: "5D", value: 5 },
//                   { label: "All", value: 30 },
//                 ].map((option) => (
//                   <button
//                     key={option.label}
//                     className={`tab-button ${
//                       dateRange === option.value ? "active" : ""
//                     }`}
//                     onClick={() => setDateRange(option.value)}
//                   >
//                     {option.label}
//                   </button>
//                 ))}
//               </div>{" "}
//             </div>

//             <div className="flow-summary-and-largest-trade-container">
//               <div className="flow-summary">
//                 {analysisData && <SummaryStats data={analysisData} />}
//               </div>
//               <div className="largest-trade">
//                 {analysisData?.largest_trade && (
//                   <LargestTrade trade={analysisData.largest_trade} />
//                 )}
//               </div>
//             </div>

//             {/* <div className="metrics">
//               {watchlistAnalysisData && (
//                 <MetricFlow data={watchlistAnalysisData} />
//               )}
//             </div> */}

//             <div className="expirations">
//               {analysisData?.most_active_expirations && (
//                 <Expirations
//                   expirations={analysisData.most_active_expirations}
//                 />
//               )}
//             </div>
//             <div className="Flow-Timeline">
//               {analysisData?.time_analysis && (
//                 <FlowTimeline snapshots={analysisData.time_analysis} />
//               )}
//             </div>

//             <div className={`fade-in ${hasLoaded ? "visible" : ""}`}>
//               {error && <div className="error-message">{error}</div>}
//               <input
//                 type="file"
//                 accept=".csv"
//                 ref={fileInputRef}
//                 style={{ display: "none" }}
//                 onChange={handleFileChange}
//               />
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default FlowSummary;
