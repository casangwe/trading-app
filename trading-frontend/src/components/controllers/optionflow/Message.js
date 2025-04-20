import React from "react";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return "N/A";
  const [hour, minute, second] = timeStr.split(":");
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
};

const Message = ({ data }) => {
  if (!data || !data.market_sentiment) {
    return <p className="error-message">No data available.</p>;
  }

  const { scenario, details } = data.market_sentiment;
  const lastUpdate = data.last_update;

  return (
    <div className="message-wrapper">
      <div className="message-content">
        <div className="scenario">
          <p>{scenario || "N/A"}</p>{" "}
        </div>
        <div>
          <p className="message">
            {details?.message || "No sentiment message available."}
          </p>{" "}
        </div>
        <div className="date">
          <p>
            {lastUpdate
              ? `${formatDate(lastUpdate.date)} ${formatTime(lastUpdate.time)}`
              : "N/A"}
          </p>
        </div>
      </div>{" "}
      {data.market_sentiment.vs_metrics && (
        <div className="vs-view">
          <div className="vs-comparison">
            {" "}
            <div className="vs-column">
              {Object.entries(data.market_sentiment.vs_metrics.left).map(
                ([label, value]) => (
                  <p key={label}>
                    <p className="label">{label}:</p>
                    <p className="value">${value.toLocaleString()}</p>
                  </p>
                )
              )}
            </div>
            <div className="vs-column">
              {Object.entries(data.market_sentiment.vs_metrics.right).map(
                ([label, value]) => (
                  <p key={label}>
                    <p className="label">{label}:</p>{" "}
                    <p className="value">${value.toLocaleString()}</p>
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;
