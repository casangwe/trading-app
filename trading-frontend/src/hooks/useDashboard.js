// src/hooks/useDashboard.js

import { useCallback, useEffect, useRef, useState } from "react";
import { getDashboard } from "../api/dashboard.api";

export const useDashboard = () => {
  const [data, setData] = useState(null);

  // request in-flight, but keep existing data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const didInitFetch = useRef(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dashboardRes = await getDashboard();
      setData(dashboardRes);
    } catch (err) {
      if (
        err.response?.status === 400 &&
        err.response?.data?.detail === "No portfolio data available."
      ) {
        setData({ account: null, portfolio_daily_summary: null });
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prevent StrictMode dev double-mount from double-fetching
    if (didInitFetch.current) return;
    didInitFetch.current = true;

    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    refreshDashboard: fetchDashboard, // still works
  };
};


// // src/hooks/useDashboard.js

// import { useCallback, useEffect, useState } from "react";
// import { getDashboard } from "../api/dashboard.api";

// export const useDashboard = () => {
//   const [data, setData] = useState(null);

//   // Loading should mean "request in-flight", but we do NOT clear existing data.
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchDashboard = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const dashboardRes = await getDashboard();
//       setData(dashboardRes);
//     } catch (err) {
//       if (
//         err.response?.status === 400 &&
//         err.response?.data?.detail === "No portfolio data available."
//       ) {
//         setData({ account: null, portfolio_daily_summary: null });
//       } else {
//         setError(err);
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchDashboard();
//   }, [fetchDashboard]);

//   return {
//     data,
//     loading,
//     error,
//     refreshDashboard: fetchDashboard,
//   };
// };



// // // src/hooks/useDashboard.js

// // import { useCallback, useEffect, useState } from "react";
// // import {
// //   getDashboard,
// //   getDashboardStats,
// //   getDashboardCharts,
// // } from "../api/dashboard.api";

// // export const useDashboard = () => {
// //   const [data, setData] = useState(null);
// //   const [stats, setStats] = useState(null);
// //   const [charts, setCharts] = useState(null);

// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   const fetchDashboard = useCallback(async () => {
// //     setLoading(true);
// //     setError(null);

// //     try {
// //       const dashboardRes = await getDashboard();
// //       setData(dashboardRes);

// //       try {
// //         const statsRes = await getDashboardStats();
// //         setStats(statsRes);
// //       } catch {}

// //       try {
// //         const chartsRes = await getDashboardCharts();
// //         setCharts(chartsRes);
// //       } catch {}

// //     } catch (err) {
// //       if (
// //         err.response?.status === 400 &&
// //         err.response?.data?.detail === "No portfolio data available."
// //       ) {
// //         setData({ account: null });
// //       } else {
// //         setError(err);
// //       }
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     fetchDashboard();
// //   }, [fetchDashboard]);

// //   return {
// //     data,
// //     stats,
// //     charts,
// //     loading,
// //     error,
// //     refreshDashboard: fetchDashboard, // ✅ expose refresh
// //   };
// // };



// // // // src/hooks/useDashboard.js

// // // import { useEffect, useState } from "react";
// // // import {
// // //   getDashboard,
// // //   getDashboardStats,
// // //   getDashboardCharts,
// // // } from "../api/dashboard.api";

// // // export const useDashboard = () => {
// // //   const [data, setData] = useState(null);
// // //   const [stats, setStats] = useState(null);
// // //   const [charts, setCharts] = useState(null);

// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState(null);

// // //   useEffect(() => {
// // //     let mounted = true;

// // //     const fetchDashboard = async () => {
// // //       try {
// // //         // 1️⃣ Core dashboard (required)
// // //         const dashboardRes = await getDashboard();
// // //         if (!mounted) return;

// // //         setData(dashboardRes);

// // //         // 2️⃣ Optional stats (do not fail Home)
// // //         try {
// // //           const statsRes = await getDashboardStats();
// // //           if (mounted) setStats(statsRes);
// // //         } catch {
// // //           // intentionally ignored
// // //         }

// // //         // 3️⃣ Optional charts (do not fail Home)
// // //         try {
// // //           const chartsRes = await getDashboardCharts();
// // //           if (mounted) setCharts(chartsRes);
// // //         } catch {
// // //           // intentionally ignored
// // //         }

// // //       } catch (err) {
// // //         if (!mounted) return;

// // //         // ✅ New user / no portfolio is NOT an error
// // //         if (
// // //           err.response?.status === 400 &&
// // //           err.response?.data?.detail === "No portfolio data available."
// // //         ) {
// // //           setData({ account: null });
// // //           setError(null);
// // //         } else {
// // //           setError(err);
// // //         }
// // //       } finally {
// // //         if (mounted) setLoading(false);
// // //       }
// // //     };

// // //     fetchDashboard();

// // //     return () => {
// // //       mounted = false;
// // //     };
// // //   }, []);

// // //   return {
// // //     data,
// // //     stats,
// // //     charts,
// // //     loading,
// // //     error,
// // //   };
// // // };
