// src/pages/Analysis/Analysis.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";

import Section from "../../components/layout/Section";
import Card from "../../components/layout/Card";
import EmptyState from "../../components/layout/EmptyState";
import Spinner from "../../components/layout/Spinner";

// charts
import AnalysisEquityArea from "../../components/charts/AnalysisEquityArea";
import AnalysisEdgeRadar from "../../components/charts/AnalysisEdgeRadar";
import AnalysisWeekdayLine from "../../components/charts/AnalysisWeekdayLine";
import AnalysisHoldTimeBoxPlot from "../../components/charts/AnalysisHoldTimeBoxPlot";

// calendar
import PortfolioCalendar from "../../components/calendar/PortfolioCalendar";

import useTradeStats from "../../hooks/useTradeStats";
import useCharts from "../../hooks/useCharts";

const MIN_READY_DELAY_MS = 1000;

const Analysis = () => {
  const { stats, loading: statsLoading, error: statsError } = useTradeStats();
  const { charts, loading: chartsLoading, error: chartsError } = useCharts();

  // phases: "loading" | "pre" | "visible"
  const [equityPhase, setEquityPhase] = useState("loading");
  const [edgePhase, setEdgePhase] = useState("loading");
  const [calendarPhase, setCalendarPhase] = useState("loading");
  const [weekdayPhase, setWeekdayPhase] = useState("loading");
  const [holdPhase, setHoldPhase] = useState("loading");

  // ready gates
  const [edgeReady, setEdgeReady] = useState(false);
  const [calendarReady, setCalendarReady] = useState(false);
  const [weekdayReady, setWeekdayReady] = useState(false);
  const [holdReady, setHoldReady] = useState(false);

  const hasStats = !!stats;
  const hasCharts = !!charts;

  const hasWeekday =
    !!stats?.pnl_by_weekday && Object.keys(stats.pnl_by_weekday).length > 0;

  const hasEdge = !!stats;

  const hasHoldBuckets =
    Array.isArray(stats?.pnl_by_hold_buckets) &&
    stats.pnl_by_hold_buckets.length > 0;

  const hasCalendarCurve = useMemo(() => {
    const curve = charts?.normalized_equity_curve || [];
    return Array.isArray(curve) && curve.length > 0;
  }, [charts]);

  const fatal = Boolean((statsError && !hasStats) || (chartsError && !hasCharts));

  const phaseToClass = useCallback((phase) => {
    if (phase === "visible") return "is-visible";
    if (phase === "pre") return "is-pre";
    return "";
  }, []);

  const equityAnalysis = charts?.equity_analysis || null;

  // =========================
  // Equity fade-in
  // =========================
  useEffect(() => {
    if (chartsLoading) {
      setEquityPhase("loading");
      return;
    }
    if (!hasCharts) return;

    setEquityPhase("pre");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEquityPhase("visible"));
    });
  }, [chartsLoading, hasCharts]);

  // =========================
  // Edge ready delay + fade
  // =========================
  useEffect(() => {
    let t = null;
    setEdgeReady(false);

    if (statsLoading) {
      setEdgePhase("loading");
      return;
    }

    if (!hasStats) return;

    t = setTimeout(() => {
      setEdgeReady(true);

      setEdgePhase("pre");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEdgePhase("visible"));
      });
    }, MIN_READY_DELAY_MS);

    return () => {
      if (t) clearTimeout(t);
    };
  }, [statsLoading, hasStats]);

  // =========================
  // Calendar ready delay + fade
  // =========================
  useEffect(() => {
    let t = null;
    setCalendarReady(false);

    if (chartsLoading) {
      setCalendarPhase("loading");
      return;
    }

    if (!hasCharts) return;

    t = setTimeout(() => {
      setCalendarReady(true);

      setCalendarPhase("pre");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setCalendarPhase("visible"));
      });
    }, MIN_READY_DELAY_MS);

    return () => {
      if (t) clearTimeout(t);
    };
  }, [chartsLoading, hasCharts]);

  // =========================
  // Weekday ready delay + fade
  // =========================
  useEffect(() => {
    let t = null;
    setWeekdayReady(false);

    if (statsLoading) {
      setWeekdayPhase("loading");
      return;
    }

    t = setTimeout(() => {
      setWeekdayReady(true);

      if (hasStats && hasWeekday) {
        setWeekdayPhase("pre");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setWeekdayPhase("visible"));
        });
      } else {
        setWeekdayPhase("visible");
      }
    }, MIN_READY_DELAY_MS);

    return () => {
      if (t) clearTimeout(t);
    };
  }, [statsLoading, hasStats, hasWeekday]);

  // =========================
  // Hold-time ready delay + fade
  // =========================
  useEffect(() => {
    let t = null;
    setHoldReady(false);

    if (statsLoading) {
      setHoldPhase("loading");
      return;
    }

    t = setTimeout(() => {
      setHoldReady(true);

      if (hasStats && hasHoldBuckets) {
        setHoldPhase("pre");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setHoldPhase("visible"));
        });
      } else {
        setHoldPhase("visible");
      }
    }, MIN_READY_DELAY_MS);

    return () => {
      if (t) clearTimeout(t);
    };
  }, [statsLoading, hasStats, hasHoldBuckets]);

  // classes
  const equityClass = useMemo(() => phaseToClass(equityPhase), [equityPhase, phaseToClass]);
  const edgeClass = useMemo(() => phaseToClass(edgePhase), [edgePhase, phaseToClass]);
  const calendarClass = useMemo(
    () => phaseToClass(calendarPhase),
    [calendarPhase, phaseToClass]
  );
  const weekdayClass = useMemo(
    () => phaseToClass(weekdayPhase),
    [weekdayPhase, phaseToClass]
  );
  const holdClass = useMemo(() => phaseToClass(holdPhase), [holdPhase, phaseToClass]);

  // overlays
  const equityOverlayVisible = equityPhase === "loading";
  const edgeOverlayVisible = !edgeReady || statsLoading;
  const calendarOverlayVisible = !calendarReady || chartsLoading;
  const weekdayOverlayVisible = statsLoading || !weekdayReady;
  const holdOverlayVisible = statsLoading || !holdReady;

  if (fatal) {
    return (
      <Section>
        <EmptyState
          title="Unable to load analysis"
          description="Something went wrong while loading analytics."
        />
      </Section>
    );
  }

  return (
    <>
      {/* =========================
         Top Dashboard Grid
      ========================= */}
      <Section>
        <div className="dashboard-container">
          <div className="dashboard-grid">
            {/* Left: Equity vs Ideal */}
            <div className="dashboard-left">
              <div className="fixed">
                <Card>
                  <div className="bars-shell">
                    {hasCharts && equityAnalysis?.equity?.length && equityAnalysis?.ideal_line?.length ? (
                      <div className={`bars-content ${equityClass}`}>
                        <AnalysisEquityArea analysis={equityAnalysis} height={300} />
                      </div>
                    ) : (
                      !chartsLoading && (
                        <div className="chart-fallback">
                          <EmptyState
                            title="Equity curve"
                            description="Add your first trade to begin tracking performance."
                          />
                        </div>
                      )
                    )}

                    {(equityOverlayVisible || chartsLoading) && (
                      <div className="bars-overlay is-visible">
                        <Spinner />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Right: Edge Map */}
            <div className="dashboard-right">
              <div className="fixed">
                <Card>
                  <div className="profile-chart-shell">
                    <div className={`profile-chart-content ${edgeClass}`}>
                      {edgeReady && hasStats ? (
                        hasEdge ? (
                          <AnalysisEdgeRadar stats={stats} height={320} />
                        ) : (
                          <EmptyState
                            title="Edge map"
                            description={statsError || "No edge data found."}
                          />
                        )
                      ) : null}
                    </div>

                    {edgeOverlayVisible && (
                      <div className="profile-chart-overlay is-visible">
                        <Spinner />
                      </div>
                    )}

                    {!statsLoading && edgeReady && !hasStats && (
                      <div className="kpi-fallback">
                        <EmptyState
                          title="Edge map unavailable"
                          description={statsError || "No stats data found."}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* =========================
         Calendar + Weekday (50/50)
      ========================= */}
      <Section>
        <div className="dashboard-container">
          <div className="dashboard-grid dashboard-grid-50">
            {/* Left: Calendar */}
            <div className="dashboard-left dashboard-half">
              <div className="fixed">
                <Card>
                  <div className="profile-chart-shell calendar-shell">
                    <div className={`profile-chart-content ${calendarClass}`}>
                      {calendarReady && hasCharts ? (
                        <PortfolioCalendar
                          charts={charts}
                          curveKey="normalized_equity_curve"
                        />
                      ) : null}
                    </div>

                    {calendarOverlayVisible && (
                      <div className="profile-chart-overlay is-visible">
                        <Spinner />
                      </div>
                    )}

                    {!chartsLoading && calendarReady && !hasCharts && (
                      <div className="kpi-fallback">
                        <EmptyState
                          title="Calendar unavailable"
                          description={chartsError || "No chart data found."}
                        />
                      </div>
                    )}

                    {!chartsLoading && calendarReady && hasCharts && !hasCalendarCurve && (
                      <div className="kpi-fallback">
                        <EmptyState
                          title="Calendar unavailable"
                          description="No equity curve data found yet."
                        />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Right: Weekday Line */}
            <div className="dashboard-right dashboard-half">
              <div className="fixed">
                <Card>
                  <div className="bars-shell">
                    {weekdayReady ? (
                      hasStats && hasWeekday ? (
                        <div className={`bars-content ${weekdayClass}`}>
                          <AnalysisWeekdayLine
                            pnlByWeekday={stats.pnl_by_weekday}
                            height={260}
                          />
                        </div>
                      ) : (
                        <div className="chart-fallback">
                          <EmptyState
                            title="Weekday performance"
                            description="Add your first trade to begin tracking weekday performance."
                          />
                        </div>
                      )
                    ) : null}

                    {weekdayOverlayVisible && (
                      <div className="bars-overlay is-visible">
                        <Spinner />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* =========================
         Hold time box plot (full width)
      ========================= */}
      <Section>
        <Card>
          <div className="bars-shell">
            {holdReady ? (
              hasStats && hasHoldBuckets ? (
                <div className={`bars-content ${holdClass}`}>
                  <AnalysisHoldTimeBoxPlot
                    buckets={stats?.pnl_by_hold_buckets || []}
                    height={450}
                  />
                </div>
              ) : (
                <div className="chart-fallback">
                  <EmptyState
                    title="Hold time"
                    description="Enter first trade to view hold-time bucket."
                  />
                </div>
              )
            ) : null}

            {holdOverlayVisible && (
              <div className="bars-overlay is-visible">
                <Spinner />
              </div>
            )}
          </div>
        </Card>
      </Section>
    </>
  );
};

export default Analysis;



// // src/pages/Analysis/Analysis.jsx

// import React, { useCallback, useEffect, useMemo, useState } from "react";

// import Section from "../../components/layout/Section";
// import Card from "../../components/layout/Card";
// import EmptyState from "../../components/layout/EmptyState";
// import Spinner from "../../components/layout/Spinner";

// // charts
// import AnalysisEquityArea from "../../components/charts/AnalysisEquityArea";
// import AnalysisEdgeRadar from "../../components/charts/AnalysisEdgeRadar";
// import AnalysisWeekdayLine from "../../components/charts/AnalysisWeekdayLine";
// import AnalysisSymbolBubbles from "../../components/charts/AnalysisSymbolBubbles";
// import AnalysisHoldTimeBoxPlot from "../../components/charts/AnalysisHoldTimeBoxPlot";
// import TradePnlBars from "../../components/charts/TradePnlBars";

// // calendar
// import PortfolioCalendar from "../../components/calendar/PortfolioCalendar";

// import useTradeStats from "../../hooks/useTradeStats";
// import useCharts from "../../hooks/useCharts";

// const MIN_READY_DELAY_MS = 1000;

// const Analysis = () => {
//   const { stats, loading: statsLoading, error: statsError } = useTradeStats();
//   const { charts, loading: chartsLoading, error: chartsError } = useCharts();

//   // phases: "loading" | "pre" | "visible"
//   const [equityPhase, setEquityPhase] = useState("loading");
//   const [edgePhase, setEdgePhase] = useState("loading");
//   const [calendarPhase, setCalendarPhase] = useState("loading");
//   const [weekdayPhase, setWeekdayPhase] = useState("loading");
//   const [barsPhase, setBarsPhase] = useState("loading");
//   const [bubblesPhase, setBubblesPhase] = useState("loading");
//   const [holdPhase, setHoldPhase] = useState("loading");

//   // ready gates
//   const [edgeReady, setEdgeReady] = useState(false);
//   const [calendarReady, setCalendarReady] = useState(false);
//   const [weekdayReady, setWeekdayReady] = useState(false);
//   const [barsReady, setBarsReady] = useState(false);
//   const [bubblesReady, setBubblesReady] = useState(false);
//   const [holdReady, setHoldReady] = useState(false);

//   const hasStats = !!stats;
//   const hasCharts = !!charts;

//   const hasWeekday =
//     !!stats?.pnl_by_weekday && Object.keys(stats.pnl_by_weekday).length > 0;

//   const hasEdge = !!stats;

//   const hasBubbles =
//     !!stats?.pnl_by_symbol_detail &&
//     Object.keys(stats.pnl_by_symbol_detail).length > 0;

//   const hasHoldBuckets =
//     Array.isArray(stats?.pnl_by_hold_buckets) &&
//     stats.pnl_by_hold_buckets.length > 0;

//   const hasCalendarCurve = useMemo(() => {
//     const curve = charts?.normalized_equity_curve || [];
//     return Array.isArray(curve) && curve.length > 0;
//   }, [charts]);

//   const hasTradesForBars = Number(stats?.total_trades ?? 0) > 0;

//   const chartSummary = useMemo(() => {
//     if (!stats) return null;
//     return {
//       tradeCount: stats.total_trades ?? 0,
//       wins: stats.wins ?? 0,
//       losses: stats.losses ?? 0,
//       winRate: stats.win_rate ?? 0,
//     };
//   }, [stats]);

//   const fatal = Boolean((statsError && !hasStats) || (chartsError && !hasCharts));

//   const phaseToClass = useCallback((phase) => {
//     if (phase === "visible") return "is-visible";
//     if (phase === "pre") return "is-pre";
//     return "";
//   }, []);

//   const equityAnalysis = charts?.equity_analysis || null;

//   // =========================
//   // Equity fade-in
//   // =========================
//   useEffect(() => {
//     if (chartsLoading) {
//       setEquityPhase("loading");
//       return;
//     }
//     if (!hasCharts) return;

//     setEquityPhase("pre");
//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => setEquityPhase("visible"));
//     });
//   }, [chartsLoading, hasCharts]);

//   // =========================
//   // Edge ready delay + fade
//   // =========================
//   useEffect(() => {
//     let t = null;
//     setEdgeReady(false);

//     if (statsLoading) {
//       setEdgePhase("loading");
//       return;
//     }

//     if (!hasStats) return;

//     t = setTimeout(() => {
//       setEdgeReady(true);

//       setEdgePhase("pre");
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => setEdgePhase("visible"));
//       });
//     }, MIN_READY_DELAY_MS);

//     return () => {
//       if (t) clearTimeout(t);
//     };
//   }, [statsLoading, hasStats]);

//   // =========================
//   // Calendar ready delay + fade
//   // =========================
//   useEffect(() => {
//     let t = null;
//     setCalendarReady(false);

//     if (chartsLoading) {
//       setCalendarPhase("loading");
//       return;
//     }

//     if (!hasCharts) return;

//     t = setTimeout(() => {
//       setCalendarReady(true);

//       setCalendarPhase("pre");
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => setCalendarPhase("visible"));
//       });
//     }, MIN_READY_DELAY_MS);

//     return () => {
//       if (t) clearTimeout(t);
//     };
//   }, [chartsLoading, hasCharts]);

//   // =========================
//   // Weekday ready delay + fade
//   // =========================
//   useEffect(() => {
//   let t = null;
//   setWeekdayReady(false);

//   if (statsLoading) {
//     setWeekdayPhase("loading");
//     return;
//   }

//   t = setTimeout(() => {
//     setWeekdayReady(true);

//     if (hasStats && hasWeekday) {
//       setWeekdayPhase("pre");
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => setWeekdayPhase("visible"));
//       });
//     } else {
//       setWeekdayPhase("visible");
//     }
//   }, MIN_READY_DELAY_MS);

//   return () => {
//     if (t) clearTimeout(t);
//   };
// }, [statsLoading, hasStats, hasWeekday]);

//   // =========================
//   // Trade PnL Bars ready delay + fade
//   // =========================
// useEffect(() => {
//   let t = null;
//   setBarsReady(false);

//   if (statsLoading) {
//     setBarsPhase("loading");
//     return;
//   }

//   t = setTimeout(() => {
//     setBarsReady(true);

//     if (hasStats && hasTradesForBars) {
//       setBarsPhase("pre");
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => setBarsPhase("visible"));
//       });
//     } else {
//       setBarsPhase("visible");
//     }
//   }, MIN_READY_DELAY_MS);

//   return () => {
//     if (t) clearTimeout(t);
//   };
// }, [statsLoading, hasStats, hasTradesForBars]);

//   // =========================
//   // Bubbles ready delay + fade
//   // =========================
//   useEffect(() => {
//     let t = null;
//     setBubblesReady(false);

//     if (statsLoading) {
//       setBubblesPhase("loading");
//       return;
//     }

//     if (!hasStats) return;

//     t = setTimeout(() => {
//       setBubblesReady(true);

//       setBubblesPhase("pre");
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => setBubblesPhase("visible"));
//       });
//     }, MIN_READY_DELAY_MS);

//     return () => {
//       if (t) clearTimeout(t);
//     };
//   }, [statsLoading, hasStats]);

//   // =========================
//   // Hold-time ready delay + fade
//   // =========================
//   useEffect(() => {
//     let t = null;
//     setHoldReady(false);

//     if (statsLoading) {
//       setHoldPhase("loading");
//       return;
//     }

//     if (!hasStats) return;

//     t = setTimeout(() => {
//       setHoldReady(true);

//       setHoldPhase("pre");
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => setHoldPhase("visible"));
//       });
//     }, MIN_READY_DELAY_MS);

//     return () => {
//       if (t) clearTimeout(t);
//     };
//   }, [statsLoading, hasStats]);

//   // classes
//   const equityClass = useMemo(() => phaseToClass(equityPhase), [equityPhase, phaseToClass]);
//   const edgeClass = useMemo(() => phaseToClass(edgePhase), [edgePhase, phaseToClass]);
//   const calendarClass = useMemo(
//     () => phaseToClass(calendarPhase),
//     [calendarPhase, phaseToClass]
//   );
//   const weekdayClass = useMemo(
//     () => phaseToClass(weekdayPhase),
//     [weekdayPhase, phaseToClass]
//   );
//   const barsClass = useMemo(() => phaseToClass(barsPhase), [barsPhase, phaseToClass]);
//   const bubblesClass = useMemo(
//     () => phaseToClass(bubblesPhase),
//     [bubblesPhase, phaseToClass]
//   );
//   const holdClass = useMemo(() => phaseToClass(holdPhase), [holdPhase, phaseToClass]);

//   // overlays
//   const equityOverlayVisible = equityPhase === "loading";
//   const edgeOverlayVisible = !edgeReady || statsLoading;
//   const calendarOverlayVisible = !calendarReady || chartsLoading;
//   const weekdayOverlayVisible = statsLoading || !weekdayReady;
//   const barsOverlayVisible = statsLoading || !barsReady;
//   const bubblesOverlayVisible = !bubblesReady || statsLoading;
//   const holdOverlayVisible = !holdReady || statsLoading;

//   if (fatal) {
//     return (
//       <Section>
//         <EmptyState
//           title="Unable to load analysis"
//           description="Something went wrong while loading analytics."
//         />
//       </Section>
//     );
//   }

//   return (
//     <>
//       {/* =========================
//          Top Dashboard Grid
//       ========================= */}
//       <Section>
//         <div className="dashboard-container">
//           <div className="dashboard-grid">
//             {/* Left: Equity vs Ideal */}
//               <div className="dashboard-left">
//                 <div className="fixed">
//                   <Card>
//                     <div className="bars-shell">
//                       {hasCharts && equityAnalysis?.equity?.length && equityAnalysis?.ideal_line?.length ? (
//                         <div className={`bars-content ${equityClass}`}>
//                           <AnalysisEquityArea analysis={equityAnalysis} height={300} />
//                         </div>
//                       ) : (
//                         !chartsLoading && (
//                           <div className="chart-fallback">
//                             <EmptyState 
//                               title="Equity curve"
//                               description="Add your first trade to begin tracking performance." />
//                           </div>
//                         )
//                       )}

//                       {(equityOverlayVisible || chartsLoading) && (
//                         <div className="bars-overlay is-visible">
//                           <Spinner />
//                         </div>
//                       )}
//                     </div>
//                   </Card>
//                 </div>
//               </div>

//             {/* Right: Edge Map */}
//             <div className="dashboard-right">
//               <div className="fixed">
//                 <Card>
//                   <div className="profile-chart-shell">
//                     <div className={`profile-chart-content ${edgeClass}`}>
//                       {edgeReady && hasStats ? (
//                         hasEdge ? (
//                           <AnalysisEdgeRadar stats={stats} height={320} />
//                         ) : (
//                           <EmptyState
//                             title="Edge map"
//                             description={statsError || "No edge data found."}
//                           />
//                         )
//                       ) : null}
//                     </div>

//                     {edgeOverlayVisible && (
//                       <div className="profile-chart-overlay is-visible">
//                         <Spinner />
//                       </div>
//                     )}

//                     {!statsLoading && edgeReady && !hasStats && (
//                       <div className="kpi-fallback">
//                         <EmptyState
//                           title="Edge map unavailable"
//                           description={statsError || "No stats data found."}
//                         />
//                       </div>
//                     )}
//                   </div>
//                 </Card>
//               </div>
//             </div>
//           </div>
//         </div>
//       </Section>

//       {/* =========================
//          Calendar + Weekday (50/50)
//       ========================= */}
//       <Section>
//         <div className="dashboard-container">
//           <div className="dashboard-grid dashboard-grid-50">
//             {/* Left: Calendar */}
//             <div className="dashboard-left dashboard-half">
//               <div className="fixed">
//                 <Card>
//                   <div className="profile-chart-shell calendar-shell">
//                     <div className={`profile-chart-content ${calendarClass}`}>
//                       {calendarReady && hasCharts ? (
//                         <PortfolioCalendar
//                           charts={charts}
//                           curveKey="normalized_equity_curve"
//                         />
//                       ) : null}
//                     </div>

//                     {calendarOverlayVisible && (
//                       <div className="profile-chart-overlay is-visible">
//                         <Spinner />
//                       </div>
//                     )}

//                     {!chartsLoading && calendarReady && !hasCharts && (
//                       <div className="kpi-fallback">
//                         <EmptyState
//                           title="Calendar unavailable"
//                           description={chartsError || "No chart data found."}
//                         />
//                       </div>
//                     )}

//                     {!chartsLoading && calendarReady && hasCharts && !hasCalendarCurve && (
//                       <div className="kpi-fallback">
//                         <EmptyState
//                           title="Calendar unavailable"
//                           description="No equity curve data found yet."
//                         />
//                       </div>
//                     )}
//                   </div>
//                 </Card>
//               </div>
//             </div>
//             {/* Right: Weekday Line */}
//             <div className="dashboard-right dashboard-half">
//               <div className="fixed">
//                 <Card>
//                   <div className="bars-shell">
//                     {weekdayReady ? (
//                       hasStats && hasWeekday ? (
//                         <div className={`bars-content ${weekdayClass}`}>
//                           <AnalysisWeekdayLine
//                             pnlByWeekday={stats.pnl_by_weekday}
//                             height={260}
//                           />
//                         </div>
//                       ) : (
//                         <div className="chart-fallback">
//                           <EmptyState
//                             title="Weekday performance"
//                             description="Add your first trade to begin tracking weekday performance." />
//                         </div>
//                       )
//                     ) : null}

//                     {weekdayOverlayVisible && (
//                       <div className="bars-overlay is-visible">
//                         <Spinner />
//                       </div>
//                     )}
//                   </div>
//                 </Card>
//               </div>
//             </div>
//           </div>
//         </div>
//       </Section>

//       {/* =========================
//         Trade PnL Bars (full width)
//       ========================= */}
//       <Section>
//         <Card>
//           <div className="bars-shell">
//             {barsReady ? (
//               hasStats && hasTradesForBars ? (
//                 <div className={`bars-content ${barsClass}`}>
//                   <TradePnlBars summary={chartSummary} />
//                 </div>
//               ) : (
//                 <div className="chart-fallback">
//                   <EmptyState
//                     title="Realized P&L"
//                     description="Enter your first trade to track P&L performance."
//                   />
//                 </div>
//               )
//             ) : null}

//             {barsOverlayVisible && (
//               <div className="bars-overlay is-visible">
//                 <Spinner />
//               </div>
//             )}
//           </div>
//         </Card>
//       </Section>
      
//       {/* =========================
//          Bubbles + Hold Time (50/50)
//       ========================= */}
//       <Section>
//         <div className="dashboard-container">
//           <div className="dashboard-grid dashboard-grid-50">
//             {/* Left: Bubbles */}
//             <div className="dashboard-left dashboard-half">
//               <div className="fixed">
//                 <Card>
//                   <div className="bars-shell">
//                     <div className={`bars-content ${bubblesClass}`}>
//                       {bubblesReady && hasStats ? (
//                         hasBubbles ? (
//                           <AnalysisSymbolBubbles stats={stats} height={450} limit={18} />
//                         ) : (
//                           <EmptyState
//                             title="Symbols unavailable"
//                             description="No symbol PnL data found."
//                           />
//                         )
//                       ) : null}
//                     </div>

//                     {bubblesOverlayVisible && (
//                       <div className="bars-overlay is-visible">
//                         <Spinner />
//                       </div>
//                     )}

//                     {!statsLoading && bubblesReady && !hasStats && (
//                       <EmptyState
//                         title="Symbols unavailable"
//                         description={statsError || "No stats data found."}
//                       />
//                     )}
//                   </div>
//                 </Card>
//               </div>
//             </div>

//             {/* Right: Hold time box plot */}
//             <div className="dashboard-right dashboard-half">
//               <div className="fixed">
//                 <Card>
//                   <div className="bars-shell">
//                     <div className={`bars-content ${holdClass}`}>
//                       {holdReady && hasStats ? (
//                         hasHoldBuckets ? (
//                           <AnalysisHoldTimeBoxPlot
//                             buckets={stats?.pnl_by_hold_buckets || []}
//                             height={450}
//                           />
//                         ) : (
//                           <EmptyState
//                             title="Hold time unavailable"
//                             description="No hold-time bucket data found."
//                           />
//                         )
//                       ) : null}
//                     </div>

//                     {holdOverlayVisible && (
//                       <div className="bars-overlay is-visible">
//                         <Spinner />
//                       </div>
//                     )}

//                     {!statsLoading && holdReady && !hasStats && (
//                       <EmptyState
//                         title="Hold time unavailable"
//                         description={statsError || "No stats data found."}
//                       />
//                     )}
//                   </div>
//                 </Card>
//               </div>
//             </div>
//           </div>
//         </div>
//       </Section>
//     </>
//   );
// };

// export default Analysis;

