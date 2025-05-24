import React, { useState, useEffect, useMemo, useRef } from "react";
import { fetchGlobalSetups, uploadOptionFlow } from "../api/OptionFlowAPI";
import FlowSummary from "./FlowSummary";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";

const tabs = [
  { label: "Live", value: 0 },
  { label: "1D", value: 1 },
  { label: "2D", value: 2 },
  { label: "3D", value: 3 },
];

const Setups = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [setups, setSetups] = useState([]);
  const [componentLoading, setComponentLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fadeInTable, setFadeInTable] = useState(false);
  const [fadeOutTable, setFadeOutTable] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFadeInTable(false);
    loadSetups();
  }, [activeTab]);

  const loadSetups = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchGlobalSetups(activeTab, 100);
      setSetups(data);
    } catch (err) {
      console.error("Error fetching global setups:", err);
      setError("Could not load setups.");
    } finally {
      setLoading(false);
      setComponentLoading(false);
      setTimeout(() => setFadeInTable(true), 300);
    }
  };

  const handleOpenFileExplorer = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setUploadMessage(`Ready to upload ${selected.name}`);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadMessage("Please select a CSV file first.");
      return;
    }

    setUploading(true);
    setUploadMessage(`Uploading ${file.name}...`);

    try {
      const response = await uploadOptionFlow(file);
      setUploadMessage(response.message || "Upload successful!");
      setFile(null);
      setFadeInTable(false);
      setFadeOutTable(true);
      setTimeout(async () => {
        await loadSetups();
        setFadeOutTable(false);
        setFadeInTable(true);
      }, 1000);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadMessage(err.message || "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenModal = (symbol) => {
    setSelectedSymbol(symbol);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSymbol(null);
  };

  const chartData = useMemo(() => {
    if (!setups.length) return [];

    const radii = setups.map((s) => 10 * Math.abs(s.score) + 20);
    const centerRadius = radii[0];
    const maxChildRadius = Math.max(...radii.slice(1), 0);
    const ringDistance = centerRadius + maxChildRadius + 20;

    const data = [{ x: 0, y: 0, radius: centerRadius, item: setups[0] }];

    const others = setups.slice(1);
    const N = others.length;
    others.forEach((item, i) => {
      const angle = (2 * Math.PI * i) / N;
      data.push({
        x: ringDistance * Math.cos(angle),
        y: ringDistance * Math.sin(angle),
        radius: 10 * Math.abs(item.score) + 20,
        item,
      });
    });

    return data;
  }, [setups]);

  const renderShape = (props) => {
    const { cx, cy, payload } = props;
    const {
      radius,
      item: { symbol, score },
    } = payload;
    const positive = score > 0;
    const hoverFill = positive ? "#e6f7ff" : "#fdecea";
    const hoverStroke = positive ? "#4a90e2" : "#e74c3c";
    const dropShadow = positive
      ? `drop-shadow(0 8px 16px rgba(72,144,226,0.3)) drop-shadow(0 14px 28px rgba(72,144,226,0.2))`
      : `drop-shadow(0 8px 16px rgba(231,76,60,0.3)) drop-shadow(0 14px 28px rgba(231,76,60,0.2))`;

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="transparent"
          stroke={positive ? "#4a90e2" : "#e74c3c"}
          strokeWidth={1}
          style={{ cursor: "pointer", transition: "all 0.3s ease" }}
          onClick={() => handleOpenModal(symbol)}
          onMouseEnter={(e) => {
            e.currentTarget.setAttribute("fill", hoverFill);
            e.currentTarget.setAttribute("stroke", hoverStroke);
            e.currentTarget.style.filter = dropShadow;
            e.currentTarget.setAttribute(
              "transform",
              `translate(${cx},${cy - 8}) translate(${-cx},${-cy + 8})`
            );
          }}
          onMouseLeave={(e) => {
            e.currentTarget.setAttribute("fill", "transparent");
            e.currentTarget.setAttribute(
              "stroke",
              positive ? "#4a90e2" : "#e74c3c"
            );
            e.currentTarget.style.filter = "none";
            e.currentTarget.setAttribute("transform", "");
          }}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            pointerEvents: "none",
            fontSize: "11px",
            fill: "#666",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          {symbol}
        </text>
      </g>
    );
  };

  const domainExtent = useMemo(() => {
    if (!chartData.length) return [-100, 100];
    const maxCoord = Math.max(
      ...chartData.map((d) => Math.abs(d.x) + d.radius),
      ...chartData.map((d) => Math.abs(d.y) + d.radius)
    );
    return [-maxCoord, maxCoord];
  }, [chartData]);

  return (
    <div className="setups-wrapper">
      {componentLoading && (
        <div className="spinner-wrapper">
          <div className="spinner"></div>
        </div>
      )}

      <div
        className={`setups-container ${
          !componentLoading ? "fade-in visible" : ""
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
              <div className="error-message">{error}</div>
            ) : (
              <>
                <div className="header-card">
                  <p className="title"></p>
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

                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />

                <div className={`fade-in ${fadeInTable ? "visible" : ""}`}>
                  <ResponsiveContainer width="100%" height={800}>
                    <ScatterChart
                      // margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <XAxis
                        type="number"
                        dataKey="x"
                        domain={domainExtent}
                        hide
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        domain={domainExtent}
                        hide
                      />
                      <Scatter data={chartData} shape={renderShape} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div className="flow-tabs">
                  <div className="tab-container">
                    {tabs.map(({ label, value }) => (
                      <button
                        key={value}
                        className={`tab-button ${
                          activeTab === value ? "active" : ""
                        }`}
                        onClick={() => setActiveTab(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {showModal && (
                  <FlowSummary
                    symbol={selectedSymbol}
                    dateRange={activeTab}
                    onClose={handleCloseModal}
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

export default Setups;
