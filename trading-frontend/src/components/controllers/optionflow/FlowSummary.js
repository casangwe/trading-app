import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  fetchOptionFlowAnalysis,
  uploadOptionFlow,
} from "../api/OptionFlowAPI";
import SummaryStats from "./SummaryStats";
import Expirations from "./Expirations";
import LargestTrade from "./LargestTrade";

const FlowSummary = () => {
  const location = useLocation();
  const [symbol, setSymbol] = useState(location.state?.symbol || "");
  const [analysisData, setAnalysisData] = useState(null);
  const [componentLoading, setComponentLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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
      const data = await fetchOptionFlowAnalysis(symbol, 30);
      if (!data || Object.keys(data).length === 0 || data.message) {
        throw new Error(`No data found for ${symbol}`);
      }
      setAnalysisData(data);
      setError("");
    } catch (err) {
      console.error("Fetching data failed:", err.message);
      setError(err.message);
    } finally {
      setTimeout(() => {
        setComponentLoading(false);
        setTimeout(() => setHasLoaded(true), 100);
      }, 1000);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol]);

  useEffect(() => {
    setSymbol(location.state?.symbol || "");
    setError("");
  }, [location]);

  const handleOpenFileExplorer = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadMessage(`Ready to upload ${selectedFile.name}`);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      console.warn("No file selected for upload.");
      setUploadMessage("Please select a file first.");
      return;
    }

    setUploading(true);
    setUploadMessage(`Uploading ${file.name}...`);

    try {
      const response = await uploadOptionFlow(file);
      setUploadMessage(`${response.message}`);
      setFile(null);
    } catch (error) {
      console.error("Upload failed:", error.message);
      setUploadMessage(`${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flow-summary-wrapper">
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
            <div className="header-card">
              <p className="title">{symbol}</p>
              <div className="tooltip">
                <i
                  className={`btn btn-primary fa-solid ${
                    file ? "fa-check" : "fa-plus"
                  } upload-btn`}
                  id="flow-upload-btn"
                  onClick={file ? handleUpload : handleOpenFileExplorer}
                ></i>
                <span className="tooltiptext">
                  {uploadMessage ||
                    (file ? `Upload ${file.name}` : "Select File")}
                </span>
              </div>
            </div>

            <div className="flow-summary-and-largest-trade-container">
              <div className="flow-summary-context">
                {analysisData && <SummaryStats data={analysisData} />}
              </div>
              <div className="largest-trade-context">
                {analysisData?.largest_trade && (
                  <LargestTrade trade={analysisData.largest_trade} />
                )}
              </div>
            </div>

            <div className="expirations-context">
              {analysisData?.most_active_expirations && (
                <Expirations
                  expirations={analysisData.most_active_expirations}
                />
              )}
            </div>

            <div className={`fade-in ${hasLoaded ? "visible" : ""}`}>
              {error && <p className="error-message">{error}</p>}
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FlowSummary;
