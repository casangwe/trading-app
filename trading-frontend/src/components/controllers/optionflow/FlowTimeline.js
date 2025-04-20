import React from "react";

const FlowTimeline = ({ snapshots }) => {
  if (!snapshots || Object.keys(snapshots).length === 0) {
    return <p className="error-message">No snapshot data available.</p>;
  }

  const snapshotKeys = Object.keys(snapshots);

  return (
    <div className="flow-timeline-wrapper">
      <h3 className="timeline-title">Intraday Flow</h3>
      <div className="flow-timeline-scroll-container">
        <div className="flow-timeline-grid">
          {snapshotKeys.map((time, index) => {
            const snap = snapshots[time];
            return (
              <div className="flow-timeline-card" key={index}>
                <div className="flow-timeline-header">
                  <p className="timeline-time">{time}</p>
                  <p className="timeline-scenario">{snap.scenario}</p>
                </div>
                <hr className="timeline-divider" />
                <div className="timeline-message">
                  <p>{snap.message}</p>
                </div>
                <div className="vs-exp-view">
                  <div className="vs-exp-comparison">
                    <div className="vs-exp-column">
                      {snap.metrics?.left &&
                        Object.entries(snap.metrics.left).map(
                          ([label, value]) => (
                            <div key={label} className="metric">
                              <p className="label">{label}:</p>
                              <p className="value">${value.toLocaleString()}</p>
                            </div>
                          )
                        )}
                    </div>
                    <div className="vs-exp-column">
                      {snap.metrics?.right &&
                        Object.entries(snap.metrics.right).map(
                          ([label, value]) => (
                            <div key={label} className="metric">
                              <p className="label">{label}:</p>
                              <p className="value">${value.toLocaleString()}</p>
                            </div>
                          )
                        )}
                    </div>
                  </div>
                </div>
                <hr className="timeline-divider" />
                <div className="exp-detail">
                  <p className="exp-title">Expiry:</p>
                  <p className="exp-value">
                    {snap.most_active_expiration || "N/A"}
                  </p>
                </div>
                <div className="exp-detail">
                  <p className="exp-title">Strike:</p>
                  <p className="exp-value">
                    {snap.most_active_strike !== null
                      ? snap.most_active_strike
                      : "N/A"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FlowTimeline;
