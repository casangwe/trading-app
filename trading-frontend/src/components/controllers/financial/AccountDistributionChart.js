import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fetchFinancials } from "../api/FinancialAPI";
import { formatCash } from "../func/functions";

const AccountDistributionChart = () => {
  const [accountData, setAccountData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const financials = await fetchFinancials();

        // Find the most recent entry based on entry_date
        const latestEntry = financials.reduce((latest, current) =>
          new Date(current.entry_date) > new Date(latest.entry_date)
            ? current
            : latest
        );

        const data = [
          { name: "NEC", value: parseFloat(latestEntry.NEC), color: "#4a90e2" },
          { name: "FFA", value: parseFloat(latestEntry.FFA), color: "#50e3c2" },
          {
            name: "PLAY",
            value: parseFloat(latestEntry.PLAY),
            color: "#f8e71c",
          },
          {
            name: "LTSS",
            value: parseFloat(latestEntry.LTSS),
            color: "#f5a623",
          },
          {
            name: "GIVE",
            value: parseFloat(latestEntry.GIVE),
            color: "#d0021b",
          },
        ];

        setAccountData(data);
      } catch (err) {
        console.error("Error fetching account data:", err);
        setError("Error fetching account data");
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="account-distribution-chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={accountData}
            dataKey="value"
            nameKey="name"
            // stroke="none"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            startAngle={90}
            endAngle={-270}
          >
            {accountData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{
                  transition: "filter 0.3s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = `drop-shadow(0 0 5px ${entry.color})`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "none";
                }}
              />
            ))}
          </Pie>
          <Tooltip
            cursor={false}
            content={({ payload }) => {
              if (payload && payload.length) {
                const { name, value } = payload[0].payload;
                return (
                  <div className="tooltip-content">
                    <p>{name}</p>
                    <p className="amount">{formatCash(value)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AccountDistributionChart;

// import React, { useState, useEffect } from "react";
// import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
// import { fetchFinancials } from "../api/FinancialAPI";
// import { formatCash } from "../func/functions";

// const AccountDistributionChart = () => {
//   const [accountData, setAccountData] = useState([]);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const financials = await fetchFinancials();
//         const latestEntry = financials[financials.length - 1];

//         const data = [
//           { name: "NEC", value: parseFloat(latestEntry.NEC), color: "#4a90e2" },
//           { name: "FFA", value: parseFloat(latestEntry.FFA), color: "#50e3c2" },
//           {
//             name: "PLAY",
//             value: parseFloat(latestEntry.PLAY),
//             color: "#f8e71c",
//           },
//           {
//             name: "LTSS",
//             value: parseFloat(latestEntry.LTSS),
//             color: "#f5a623",
//           },
//           {
//             name: "GIVE",
//             value: parseFloat(latestEntry.GIVE),
//             color: "#d0021b",
//           },
//         ];

//         setAccountData(data);
//       } catch (err) {
//         console.error("Error fetching account data:", err);
//         setError("Error fetching account data");
//       }
//     };

//     fetchData();
//   }, []);

//   if (error) {
//     return <div>{error}</div>;
//   }

//   return (
//     <div className="account-distribution-chart-container">
//       <ResponsiveContainer width="100%" height={300}>
//         <PieChart>
//           <Pie
//             data={accountData}
//             dataKey="value"
//             nameKey="name"
//             cx="50%"
//             cy="50%"
//             innerRadius={60}
//             outerRadius={80}
//             paddingAngle={5}
//             startAngle={90}
//             endAngle={-270}
//           >
//             {accountData.map((entry, index) => (
//               <Cell
//                 key={`cell-${index}`}
//                 fill={entry.color}
//                 style={{
//                   transition: "filter 0.3s",
//                   cursor: "pointer",
//                 }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.filter = `drop-shadow(0 0 5px ${entry.color})`;
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.filter = "none";
//                 }}
//               />
//             ))}
//           </Pie>
//           <Tooltip
//             cursor={false}
//             content={({ payload }) => {
//               if (payload && payload.length) {
//                 const { name, value } = payload[0].payload;
//                 return (
//                   <div className="tooltip-content">
//                     <p>{name}</p>
//                     <p className="amount">{formatCash(value)}</p>
//                   </div>
//                 );
//               }
//               return null;
//             }}
//           />
//         </PieChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default AccountDistributionChart;
