import React from "react";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
};

const Expirations = ({ expirations }) => {
  if (!expirations || expirations.length === 0) {
    return <p className="error-message">No expiration data available.</p>;
  }

  return (
    <div className="expirations-wrapper">
      <h3 className="expirations-title">Active Expirations</h3>
      <div className="expirations-scroll-container">
        <div className="expirations-grid">
          {expirations.map((exp, index) => (
            <React.Fragment key={index}>
              <div className="expiration-card">
                <div className="expiration-header">
                  <p className="expiration-date">{formatDate(exp.expiry)}</p>
                  <p className="expiration-days">{exp.days_to_expiry} Days</p>
                </div>
                <hr className="expiration-divider" />
                <div className="expiration-details">
                  <div className="exp-detail">
                    <p className="exp-title">Contracts:</p>
                    <p className="exp-value">
                      {exp.total_contracts.toLocaleString()}
                    </p>
                  </div>
                  <div className="exp-detail">
                    <p className="exp-title">Strike:</p>
                    <p className="exp-value">
                      {exp.strike !== null ? exp.strike : "N/A"}
                    </p>
                  </div>
                  <div className="vs-exp-view">
                    <div className="vs-exp-comparison">
                      <div className="vs-exp-column">
                        {exp.metrics?.left &&
                          Object.entries(exp.metrics.left).map(
                            ([label, value]) => (
                              <div key={label} className="metric">
                                <p className="label">{label}:</p>
                                <p className="value">
                                  ${value.toLocaleString()}
                                </p>
                              </div>
                            )
                          )}
                      </div>
                      <div className="vs-exp-column">
                        {exp.metrics?.right &&
                          Object.entries(exp.metrics.right).map(
                            ([label, value]) => (
                              <div key={label} className="metric">
                                <p className="label">{label}:</p>
                                <p className="value">
                                  ${value.toLocaleString()}
                                </p>
                              </div>
                            )
                          )}
                      </div>
                    </div>
                  </div>
                  <hr className="expiration-divider" />
                  <div className="exp-detail">
                    <p className="exp-value-scenario">{exp.scenario}</p>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Expirations;
