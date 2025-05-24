import React, { useState, useEffect, useMemo } from "react";
import {
  fetchWatchlists,
  updateWatchlist,
  fetchSetups,
} from "../api/WatchlistApi";
import NewWatchlist from "./NewWatchlist";
import UpdateWatchlist from "./UpdateWatchlist";
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
  // { label: "5D", value: 5 },
  // { label: "All", value: 30 },
];

const Watchlist = () => {
  const [watchlists, setWatchlists] = useState([]);
  const [setups, setSetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [componentLoading, setComponentLoading] = useState(true);
  const [fadeInTable, setFadeInTable] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [dateRange, setDateRange] = useState(1);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const watchlistData = await fetchWatchlists();
        setWatchlists(watchlistData);

        const setupData = await fetchSetups(dateRange);
        setSetups(setupData);

        localStorage.setItem(
          "cached_setups",
          JSON.stringify({ dateRange, data: setupData })
        );
      } catch (err) {
        console.error("Failed to fetch:", err);
        setError("Could not load watchlists or setups.");
      } finally {
        setLoading(false);
        setComponentLoading(false);
        setTimeout(() => setFadeInTable(true), 300);
      }
    };

    const cached = localStorage.getItem("cached_setups");
    if (cached) {
      try {
        const { dateRange: dR, data } = JSON.parse(cached);
        if (dR === dateRange && Array.isArray(data)) {
          fetchWatchlists()
            .then(setWatchlists)
            .catch((err) =>
              console.error("Watchlists cache-fetch failed:", err)
            );

          setSetups(data);
          setTimeout(() => {
            setLoading(false);
            setComponentLoading(false);
          }, 1000);
          setTimeout(() => setFadeInTable(true), 1300);

          return;
        }
      } catch {}
    }

    fetchAll();
  }, [dateRange]);

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
    try {
      setShowModal(false);
      setFadeInTable(false);

      if (isEditing) {
        await updateWatchlist(selectedWatchlist.id, updatedData);
        setWatchlists((prev) =>
          prev.map((wl) =>
            wl.id === selectedWatchlist.id ? { ...wl, ...updatedData } : wl
          )
        );
      } else {
        setWatchlists((prev) => [...prev, updatedData]);
      }

      setItemsLoading(true);
    } catch (err) {
      console.error("Error updating or adding watchlist:", err);
    } finally {
      setTimeout(() => {
        setItemsLoading(false);
        setFadeInTable(true);
      }, 1000);
    }
  };

  const handleToggleHit = async (id, currentStatus) => {
    const updatedStatus = !currentStatus;

    try {
      await updateWatchlist(id, { target_hit: updatedStatus });
      setWatchlists((prev) =>
        prev.map((wl) =>
          wl.id === id ? { ...wl, target_hit: updatedStatus } : wl
        )
      );
    } catch (err) {
      console.error("Error updating target hit status:", err);
    }
  };

  // Prepare chart data based on setups and scores
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

  // Custom SVG shape for each circle + label with updated hover styling
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
          onClick={() => {
            const wl = watchlists.find(
              (w) => w.symbol.toUpperCase() === symbol.toUpperCase()
            );
            if (wl) handleOpenModal(wl);
          }}
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

  // Domain to fit all circles within chart bounds
  const domainExtent = useMemo(() => {
    if (!chartData.length) return [-100, 100];
    const maxCoord = Math.max(
      ...chartData.map((d) => Math.abs(d.x) + d.radius),
      ...chartData.map((d) => Math.abs(d.y) + d.radius)
    );
    return [-maxCoord, maxCoord];
  }, [chartData]);

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
              <div className="error-message">{error}</div>
            ) : (
              <>
                <div className="header-card">
                  <p className="title"></p>
                  <div className="tooltip">
                    <i
                      className="btn btn-primary fa-solid fa-plus"
                      id="watchlist-new-btn"
                      onClick={() => handleOpenModal()}
                    ></i>
                    <span className="tooltiptext">New Item</span>
                  </div>
                </div>

                <div className={`fade-in ${fadeInTable ? "visible" : ""}`}>
                  {itemsLoading ? (
                    <div className="items-spinner-wrapper">
                      <div className="items-spinner"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={450}>
                      <ScatterChart
                        margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
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
                  )}
                </div>
                <div className="flow-tabs">
                  {tabs.map(({ label, value }) => (
                    <button
                      key={value}
                      className={`tab-button ${
                        dateRange === value ? "active" : ""
                      }`}
                      onClick={() => {
                        setFadeInTable(false);
                        setDateRange(value);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {showModal && isEditing && selectedWatchlist && (
                  <UpdateWatchlist
                    watchlist={selectedWatchlist}
                    dateRange={dateRange}
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
