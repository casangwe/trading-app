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
      <div className="expirations-grid">
        {expirations.slice(0, 5).map((exp, index) => (
          <div className="expiration-card" key={index}>
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
                <p className="exp-title">Total Premium:</p>
                <p className="exp-value">
                  ${exp.total_premium.toLocaleString()}
                </p>
              </div>
              <div className="exp-detail">
                <p className="exp-title">Opening Premium:</p>
                <p className="exp-value">
                  ${exp.opening_premium.toLocaleString()}
                </p>
              </div>
              <div className="exp-detail">
                <p className="exp-title">Opening Count:</p>
                <p className="exp-value">{exp.opening_count}</p>
              </div>
              <div className="exp-detail">
                <p className="exp-title">Calls:</p>
                <p className="exp-value">{exp.total_calls.toLocaleString()}</p>
              </div>
              <div className="exp-detail">
                <p className="exp-title">Puts:</p>
                <p className="exp-value">{exp.total_puts.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Expirations;

// import React from "react";

// const formatDate = (dateStr) => {
//   if (!dateStr) return "N/A";
//   const [year, month, day] = dateStr.split("-");
//   return `${month}/${day}/${year}`;
// };

// const Expirations = ({ expirations }) => {
//   if (!expirations || expirations.length === 0) {
//     return <p className="error-message">No expiration data available.</p>;
//   }

//   return (
//     <div className="expirations-wrapper">
//       <h3 className="expirations-title"></h3>
//       <div className="expirations-grid">
//         {expirations.slice(0, 5).map((exp, index) => (
//           <div className="expiration-column" key={index}>
//             <div className="expiration-header">
//               <p className="expiration-date">{formatDate(exp.expiry)}</p>
//             </div>
//             <hr className="expiration-divider" />
//             <div className="expiration-detail">
//               <p className="exp-title">Contracts:</p>
//               <p className="exp-value">
//                 {exp.total_contracts?.toLocaleString() || "N/A"}
//               </p>
//             </div>
//             <div className="expiration-detail">
//               <p className="exp-title">Days to Expiry:</p>
//               <p className="exp-value">{exp.days_to_expiry || "N/A"}</p>
//             </div>
//             <div className="expiration-detail">
//               <p className="exp-title">Total Premium:</p>
//               <p className="exp-value">
//                 ${exp.total_premium?.toLocaleString() || "N/A"}
//               </p>
//             </div>
//             <div className="expiration-detail">
//               <p className="exp-title">Opening Premium:</p>
//               <p className="exp-value">
//                 ${exp.opening_premium?.toLocaleString() || "N/A"}
//               </p>
//             </div>
//             <div className="expiration-detail">
//               <p className="exp-title">Opening Count:</p>
//               <p className="exp-value">{exp.opening_count || "N/A"}</p>
//             </div>
//             <div className="expiration-detail">
//               <p className="exp-title">Calls:</p>
//               <p className="exp-value">
//                 {exp.total_calls?.toLocaleString() || "N/A"}
//               </p>
//             </div>
//             <div className="expiration-detail">
//               <p className="exp-title">Puts:</p>
//               <p className="exp-value">
//                 {exp.total_puts?.toLocaleString() || "N/A"}
//               </p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Expirations;
