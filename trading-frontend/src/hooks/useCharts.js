// src/hooks/useCharts.js

import { useEffect, useState, useCallback, useRef } from "react";
import { getDashboardCharts } from "../api/dashboard.api";

export default function useCharts() {
  const [charts, setCharts] = useState(null);

  // request in-flight, but keep old data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const didInitFetch = useRef(false);

  const refreshCharts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getDashboardCharts();
      setCharts(res);
    } catch (e) {
      setError("Failed to load charts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prevent StrictMode dev double-mount from double-fetching
    if (didInitFetch.current) return;
    didInitFetch.current = true;

    refreshCharts();
  }, [refreshCharts]);

  return { charts, loading, error, refreshCharts };
}



// // src/hooks/useCharts.js

// import { useEffect, useState, useCallback } from "react";
// import { getDashboardCharts } from "../api/dashboard.api";

// export default function useCharts() {
//   const [charts, setCharts] = useState(null);

//   // Like dashboard: loading means "in-flight" but we keep old data on screen.
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const refreshCharts = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const res = await getDashboardCharts();
//       setCharts(res);
//     } catch (e) {
//       // Don't nuke charts — keep last known good data to avoid blanking/flicker.
//       setError("Failed to load charts.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     refreshCharts();
//   }, [refreshCharts]);

//   return { charts, loading, error, refreshCharts };
// }


// // // src/hooks/useCharts.js
// // import { useEffect, useState, useCallback } from "react";
// // import { getDashboardCharts } from "../api/dashboard.api";

// // export default function useCharts() {
// //   const [charts, setCharts] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   const refreshCharts = useCallback(async () => {
// //     setLoading(true);
// //     setError(null);

// //     try {
// //       const res = await getDashboardCharts();
// //       setCharts(res);
// //     } catch (e) {
// //       setError("Failed to load charts.");
// //       setCharts(null);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     refreshCharts();
// //   }, [refreshCharts]);

// //   return { charts, loading, error, refreshCharts };
// // }
