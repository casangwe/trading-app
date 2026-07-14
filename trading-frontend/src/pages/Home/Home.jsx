// src/pages/Home/Home.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDashboard } from "../../hooks/useDashboard";
import useCharts from "../../hooks/useCharts";
import useTradeStats from "../../hooks/useTradeStats";
import useInitialCash from "../../hooks/useInitialCash";

// layout
import Card from "../../components/layout/Card";
import Section from "../../components/layout/Section";
import EmptyState from "../../components/layout/EmptyState";
import Modal from "../../components/layout/Modal";
import Spinner from "../../components/layout/Spinner";

// portfolio
import PortfolioEntryForm from "../../components/portfolio/PortfolioEntry.jsx";
import InitialCashEntry from "../../components/portfolio/InitialCashEntry.jsx";
import PortfolioSummary from "../../components/portfolio/PortfolioSummary";
import PortfolioEditModal from "../../components/portfolio/PortfolioEdit.jsx";

// charts
import InvestmentChart from "../../components/charts/InvestmentsChart.jsx";
import AnalysisEdgeRadar from "../../components/charts/AnalysisEdgeRadar";

// calendar
import PortfolioCalendar from "../../components/calendar/PortfolioCalendar";

const FADE_MS = 220;
const MIN_READY_DELAY_MS = 1000;

const Home = () => {
  const {
    data,
    loading: dashboardLoading,
    refreshDashboard,
  } = useDashboard();

  const {
    charts,
    loading: chartsLoading,
    refreshCharts,
  } = useCharts();

  const {
    stats,
    loading: statsLoading,
  } = useTradeStats();

  const {
    loading: initialCashLoading,
    hasInitialCash,
    refreshInitialCash,
  } = useInitialCash();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showInitialCashModal, setShowInitialCashModal] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // phases: "loading" | "pre" | "visible" | "fading"
  const [summaryPhase, setSummaryPhase] = useState("loading");
  const [chartPhase, setChartPhase] = useState("loading");
  const [chartKey, setChartKey] = useState(0);

  // Edge (min-delay ready gate)
  const [edgeReady, setEdgeReady] = useState(false);
  const [edgePhase, setEdgePhase] = useState("loading");

  // Calendar paint gate
  const [calendarPhase, setCalendarPhase] = useState("loading");
  const [calendarPainted, setCalendarPainted] = useState(false);

  const hasSummary = !!data?.portfolio_daily_summary;

  const chartReady = useMemo(() => !!data && !!data?.account && !!charts, [data, charts]);
  const summaryReady = useMemo(() => !!data?.portfolio_daily_summary, [data]);

  const hasStats = !!stats;

  const hasCalendarCurve = useMemo(() => {
    const curve = charts?.normalized_equity_curve || [];
    return Array.isArray(curve) && curve.length > 0;
  }, [charts]);

  const openPrimaryAddFlow = useCallback(() => {
    if (hasInitialCash) {
      setShowAddModal(true);
    } else {
      setShowInitialCashModal(true);
    }
  }, [hasInitialCash]);

  // -------------------------
  // Initial Summary load
  // -------------------------
  useEffect(() => {
    if (dashboardLoading || data === null) {
      setSummaryPhase("loading");
      return;
    }

    if (summaryReady) {
      setSummaryPhase("pre");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSummaryPhase("visible"));
      });
    } else {
      setSummaryPhase("visible");
    }
  }, [dashboardLoading, data, summaryReady]);

  // -------------------------
  // Initial Chart load
  // -------------------------
  useEffect(() => {
    if (
      dashboardLoading ||
      chartsLoading ||
      initialCashLoading ||
      data === null ||
      charts === null
    ) {
      setChartPhase("loading");
      return;
    }

    if (chartReady) {
      setChartPhase("pre");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setChartPhase("visible"));
      });
    } else {
      setChartPhase("visible");
    }
  }, [
    dashboardLoading,
    chartsLoading,
    initialCashLoading,
    data,
    charts,
    chartReady,
  ]);

  // -------------------------
  // Edge Radar min-delay load
  // -------------------------
  useEffect(() => {
    let t = null;

    setEdgeReady(false);
    setEdgePhase("loading");

    if (statsLoading) return;
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

  // -------------------------
  // Calendar ready + paint gate
  // -------------------------
  useEffect(() => {
    let t = null;
    let raf1 = null;
    let raf2 = null;

    setCalendarPainted(false);
    setCalendarPhase("loading");

    if (chartsLoading) return;
    if (!charts) return;

    if (!hasCalendarCurve) {
      setCalendarPainted(true);
      setCalendarPhase("visible");
      return;
    }

    t = setTimeout(() => {
      setCalendarPhase("pre");

      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setCalendarPhase("visible");
          setCalendarPainted(true);
        });
      });
    }, MIN_READY_DELAY_MS);

    return () => {
      if (t) clearTimeout(t);
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [chartsLoading, charts, hasCalendarCurve]);

  // -------------------------
  // Refresh flow
  // -------------------------
  const runRefreshWithFade = useCallback(async () => {
    setSummaryPhase((p) => (p === "visible" ? "fading" : p));
    setChartPhase((p) => (p === "visible" ? "fading" : p));
    setCalendarPhase((p) => (p === "visible" ? "fading" : p));

    await new Promise((r) => setTimeout(r, FADE_MS));

    setSummaryPhase("loading");
    setChartPhase("loading");
    setCalendarPainted(false);
    setCalendarPhase("loading");

    await Promise.allSettled([
      refreshDashboard(),
      refreshCharts(),
      refreshInitialCash(),
    ]);

    setChartKey((k) => k + 1);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (summaryReady) {
          setSummaryPhase("pre");
          requestAnimationFrame(() => setSummaryPhase("visible"));
        } else {
          setSummaryPhase("visible");
        }

        if (chartReady) {
          setChartPhase("pre");
          requestAnimationFrame(() => setChartPhase("visible"));
        } else {
          setChartPhase("visible");
        }
      });
    });
  }, [
    refreshDashboard,
    refreshCharts,
    refreshInitialCash,
    summaryReady,
    chartReady,
  ]);

  const summaryClass = useMemo(() => {
    if (summaryPhase === "visible") return "is-visible";
    if (summaryPhase === "fading") return "is-fading";
    if (summaryPhase === "pre") return "is-pre";
    return "";
  }, [summaryPhase]);

  const chartClass = useMemo(() => {
    if (chartPhase === "visible") return "is-visible";
    if (chartPhase === "fading") return "is-fading";
    if (chartPhase === "pre") return "is-pre";
    return "";
  }, [chartPhase]);

  const edgeClass = useMemo(() => {
    if (edgePhase === "visible") return "is-visible";
    if (edgePhase === "fading") return "is-fading";
    if (edgePhase === "pre") return "is-pre";
    return "";
  }, [edgePhase]);

  const calendarClass = useMemo(() => {
    if (calendarPhase === "visible") return "is-visible";
    if (calendarPhase === "fading") return "is-fading";
    if (calendarPhase === "pre") return "is-pre";
    return "";
  }, [calendarPhase]);

  const summaryOverlayVisible = summaryPhase === "loading";
  const chartOverlayVisible = chartPhase === "loading";
  const edgeOverlayVisible = edgePhase === "loading" || statsLoading || !edgeReady;

  const calendarOverlayVisible =
    chartsLoading || !charts || (hasCalendarCurve && !calendarPainted);

  return (
    <>
      <Modal
        isOpen={showInitialCashModal}
        onClose={() => setShowInitialCashModal(false)}
      >
        <InitialCashEntry
          onSuccess={async () => {
            setShowInitialCashModal(false);
            await runRefreshWithFade();
          }}
          onCancel={() => setShowInitialCashModal(false)}
        />
      </Modal>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <PortfolioEntryForm
          onSuccess={async () => {
            setShowAddModal(false);
            await runRefreshWithFade();
          }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      <PortfolioEditModal
        isOpen={editOpen}
        summary={data?.portfolio_daily_summary}
        onClose={() => setEditOpen(false)}
        onSaved={async () => {
          setEditOpen(false);
          await runRefreshWithFade();
        }}
        onDeleted={async () => {
          setEditOpen(false);
          await runRefreshWithFade();
        }}
      />

      <Section>
        <div className="dashboard-container">
          <div className="dashboard-grid">
            {/* Left: Chart */}
            <div className="dashboard-left">
              <div className="fixed">
                <Card>
                  <div className="chart-shell">
                    {chartReady ? (
                      <div className={`chart-content ${chartClass}`}>
                        {/* <InvestmentChart
                          key={chartKey}
                          variant="home"
                          dashboard={data}
                          charts={charts}
                        /> */}
                        <InvestmentChart
                          key={chartKey}
                          variant="home"
                          dashboard={data}
                          charts={charts}
                          curveKey="equity_curve"
                        />
                      </div>
                    ) : (
                      !(
                        dashboardLoading ||
                        chartsLoading ||
                        initialCashLoading ||
                        data === null
                      ) && (
                        <div className="chart-fallback">
                          {!hasInitialCash ? (
                            <EmptyState
                              title="Get started"
                              description="Add your initial cash and date to get started"
                              actionLabel="+"
                              onAction={openPrimaryAddFlow}
                            />
                          ) : (
                            <EmptyState
                              title="Investment chart"
                              description="Add Portfolio balance and date to view the chart"
                            />
                          )}
                        </div>
                      )
                    )}

                    {chartOverlayVisible && (
                      <div className="chart-overlay is-visible">
                        <Spinner />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Right: Summary */}
            <div className="dashboard-right">
              <div className="fixed">
                <Card>
                  <div className="summary-shell">
                    <div className={`summary-content ${summaryClass}`}>
                      <PortfolioSummary
                        summary={
                          hasSummary
                            ? data.portfolio_daily_summary
                            : {
                                open: 0,
                                close: 0,
                                pnl: 0,
                                roi: 0,
                                date: null,
                              }
                        }
                        hideAddAction={!hasInitialCash}
                        onEdit={(action) => {
                          if (action === "add") {
                            if (hasInitialCash) setShowAddModal(true);
                            return;
                          }

                          if (hasSummary) setEditOpen(true);
                          else if (hasInitialCash) setShowAddModal(true);
                        }}
                      />
                    </div>

                    {summaryOverlayVisible && (
                      <div className="summary-overlay is-visible">
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

      <Section>
        <div className="dashboard-container">
          <div className="dashboard-grid" style={{ alignItems: "stretch" }}>
            {/* Left 50%: Edge Radar */}
            <div className="dashboard-left" style={{ flex: "0 0 50%", minWidth: 0 }}>
              <div className="fixed">
                <Card>
                  <div className="profile-chart-shell">
                    <div className={`profile-chart-content ${edgeClass}`}>
                      {edgeReady ? <AnalysisEdgeRadar stats={stats} height={320} /> : null}
                    </div>

                    {edgeOverlayVisible && (
                      <div className="profile-chart-overlay is-visible">
                        <Spinner />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Right 50%: Portfolio Calendar */}
            <div className="dashboard-right" style={{ flex: "0 0 50%", minWidth: 0 }}>
              <div className="fixed">
                <Card>
                  <div className="profile-chart-shell calendar-shell">
                    <div className={`profile-chart-content ${calendarClass}`}>
                      {charts ? (
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
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
};

export default Home;
// // src/pages/Home/Home.jsx

// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { useDashboard } from "../../hooks/useDashboard";
// import useCharts from "../../hooks/useCharts";
// import useTradeStats from "../../hooks/useTradeStats";
// import useInitialCash from "../../hooks/useInitialCash";

// // layout
// import Card from "../../components/layout/Card";
// import Section from "../../components/layout/Section";
// import EmptyState from "../../components/layout/EmptyState";
// import Modal from "../../components/layout/Modal";
// import Spinner from "../../components/layout/Spinner";

// // portfolio
// import PortfolioEntryForm from "../../components/portfolio/PortfolioEntry.jsx";
// import InitialCashEntry from "../../components/portfolio/InitialCashEntry.jsx";
// import PortfolioSummary from "../../components/portfolio/PortfolioSummary";
// import PortfolioEditModal from "../../components/portfolio/PortfolioEdit.jsx";

// // charts
// import InvestmentChart from "../../components/charts/InvestmentsChart.jsx";
// import AnalysisEdgeRadar from "../../components/charts/AnalysisEdgeRadar";

// // calendar
// import PortfolioCalendar from "../../components/calendar/PortfolioCalendar";

// const FADE_MS = 220;
// const MIN_READY_DELAY_MS = 1000;

// const Home = () => {
//   const {
//     data,
//     loading: dashboardLoading,
//     refreshDashboard,
//   } = useDashboard();

//   const {
//     charts,
//     loading: chartsLoading,
//     refreshCharts,
//   } = useCharts();

//   const {
//     stats,
//     loading: statsLoading,
//   } = useTradeStats();

//   const {
//     loading: initialCashLoading,
//     hasInitialCash,
//     refreshInitialCash,
//   } = useInitialCash();

//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showInitialCashModal, setShowInitialCashModal] = useState(false);
//   const [editOpen, setEditOpen] = useState(false);

//   // phases: "loading" | "pre" | "visible" | "fading"
//   const [summaryPhase, setSummaryPhase] = useState("loading");
//   const [chartPhase, setChartPhase] = useState("loading");
//   const [chartKey, setChartKey] = useState(0);

//   // Edge (min-delay ready gate)
//   const [edgeReady, setEdgeReady] = useState(false);
//   const [edgePhase, setEdgePhase] = useState("loading");

//   // Calendar paint gate
//   const [calendarPhase, setCalendarPhase] = useState("loading");
//   const [calendarPainted, setCalendarPainted] = useState(false);

//   const hasSummary = !!data?.portfolio_daily_summary;

//   const chartReady = useMemo(() => !!data && !!data?.account && !!charts, [data, charts]);
//   const summaryReady = useMemo(() => !!data?.portfolio_daily_summary, [data]);

//   const hasStats = !!stats;

//   const hasCalendarCurve = useMemo(() => {
//     const curve = charts?.normalized_equity_curve || [];
//     return Array.isArray(curve) && curve.length > 0;
//   }, [charts]);

//   const openPrimaryAddFlow = useCallback(() => {
//     if (hasInitialCash) {
//       setShowAddModal(true);
//     } else {
//       setShowInitialCashModal(true);
//     }
//   }, [hasInitialCash]);

//   // -------------------------
//   // Initial Summary load
//   // -------------------------
//   useEffect(() => {
//     if (dashboardLoading || data === null) {
//       setSummaryPhase("loading");
//       return;
//     }

//     if (summaryReady) {
//       setSummaryPhase("pre");
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => setSummaryPhase("visible"));
//       });
//     } else {
//       setSummaryPhase("visible");
//     }
//   }, [dashboardLoading, data, summaryReady]);

//   // -------------------------
//   // Initial Chart load
//   // -------------------------
//   useEffect(() => {
//     if (
//       dashboardLoading ||
//       chartsLoading ||
//       initialCashLoading ||
//       data === null ||
//       charts === null
//     ) {
//       setChartPhase("loading");
//       return;
//     }

//     if (chartReady) {
//       setChartPhase("pre");
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => setChartPhase("visible"));
//       });
//     } else {
//       setChartPhase("visible");
//     }
//   }, [
//     dashboardLoading,
//     chartsLoading,
//     initialCashLoading,
//     data,
//     charts,
//     chartReady,
//   ]);

//   // -------------------------
//   // Edge Radar min-delay load
//   // -------------------------
//   useEffect(() => {
//     let t = null;

//     setEdgeReady(false);
//     setEdgePhase("loading");

//     if (statsLoading) return;
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

//   // -------------------------
//   // Calendar ready + paint gate
//   // -------------------------
//   useEffect(() => {
//     let t = null;
//     let raf1 = null;
//     let raf2 = null;

//     setCalendarPainted(false);
//     setCalendarPhase("loading");

//     if (chartsLoading) return;
//     if (!charts) return;

//     if (!hasCalendarCurve) {
//       setCalendarPainted(true);
//       setCalendarPhase("visible");
//       return;
//     }

//     t = setTimeout(() => {
//       setCalendarPhase("pre");

//       raf1 = requestAnimationFrame(() => {
//         raf2 = requestAnimationFrame(() => {
//           setCalendarPhase("visible");
//           setCalendarPainted(true);
//         });
//       });
//     }, MIN_READY_DELAY_MS);

//     return () => {
//       if (t) clearTimeout(t);
//       if (raf1) cancelAnimationFrame(raf1);
//       if (raf2) cancelAnimationFrame(raf2);
//     };
//   }, [chartsLoading, charts, hasCalendarCurve]);

//   // -------------------------
//   // Refresh flow
//   // -------------------------
//   const runRefreshWithFade = useCallback(async () => {
//     setSummaryPhase((p) => (p === "visible" ? "fading" : p));
//     setChartPhase((p) => (p === "visible" ? "fading" : p));
//     setCalendarPhase((p) => (p === "visible" ? "fading" : p));

//     await new Promise((r) => setTimeout(r, FADE_MS));

//     setSummaryPhase("loading");
//     setChartPhase("loading");
//     setCalendarPainted(false);
//     setCalendarPhase("loading");

//     await Promise.allSettled([
//       refreshDashboard(),
//       refreshCharts(),
//       refreshInitialCash(),
//     ]);

//     setChartKey((k) => k + 1);

//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => {
//         if (summaryReady) {
//           setSummaryPhase("pre");
//           requestAnimationFrame(() => setSummaryPhase("visible"));
//         } else {
//           setSummaryPhase("visible");
//         }

//         if (chartReady) {
//           setChartPhase("pre");
//           requestAnimationFrame(() => setChartPhase("visible"));
//         } else {
//           setChartPhase("visible");
//         }
//       });
//     });
//   }, [
//     refreshDashboard,
//     refreshCharts,
//     refreshInitialCash,
//     summaryReady,
//     chartReady,
//   ]);

//   const summaryClass = useMemo(() => {
//     if (summaryPhase === "visible") return "is-visible";
//     if (summaryPhase === "fading") return "is-fading";
//     if (summaryPhase === "pre") return "is-pre";
//     return "";
//   }, [summaryPhase]);

//   const chartClass = useMemo(() => {
//     if (chartPhase === "visible") return "is-visible";
//     if (chartPhase === "fading") return "is-fading";
//     if (chartPhase === "pre") return "is-pre";
//     return "";
//   }, [chartPhase]);

//   const edgeClass = useMemo(() => {
//     if (edgePhase === "visible") return "is-visible";
//     if (edgePhase === "fading") return "is-fading";
//     if (edgePhase === "pre") return "is-pre";
//     return "";
//   }, [edgePhase]);

//   const calendarClass = useMemo(() => {
//     if (calendarPhase === "visible") return "is-visible";
//     if (calendarPhase === "fading") return "is-fading";
//     if (calendarPhase === "pre") return "is-pre";
//     return "";
//   }, [calendarPhase]);

//   const summaryOverlayVisible = summaryPhase === "loading";
//   const chartOverlayVisible = chartPhase === "loading";
//   const edgeOverlayVisible = edgePhase === "loading" || statsLoading || !edgeReady;

//   const calendarOverlayVisible =
//     chartsLoading || !charts || (hasCalendarCurve && !calendarPainted);

//   return (
//     <>
//       <Modal
//         isOpen={showInitialCashModal}
//         onClose={() => setShowInitialCashModal(false)}
//       >
//         <InitialCashEntry
//           onSuccess={async () => {
//             setShowInitialCashModal(false);
//             await runRefreshWithFade();
//           }}
//           onCancel={() => setShowInitialCashModal(false)}
//         />
//       </Modal>

//       <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
//         <PortfolioEntryForm
//           onSuccess={async () => {
//             setShowAddModal(false);
//             await runRefreshWithFade();
//           }}
//           onCancel={() => setShowAddModal(false)}
//         />
//       </Modal>

//       <PortfolioEditModal
//         isOpen={editOpen}
//         summary={data?.portfolio_daily_summary}
//         onClose={() => setEditOpen(false)}
//         onSaved={async () => {
//           setEditOpen(false);
//           await runRefreshWithFade();
//         }}
//         onDeleted={async () => {
//           setEditOpen(false);
//           await runRefreshWithFade();
//         }}
//       />

//       <Section>
//         <div className="dashboard-container">
//           <div className="dashboard-grid">
//             {/* Left: Chart */}
//             <div className="dashboard-left">
//               <div className="fixed">
//                 <Card>
//                   <div className="chart-shell">
//                     {chartReady ? (
//                       <div className={`chart-content ${chartClass}`}>
//                         <InvestmentChart
//                           key={chartKey}
//                           variant="home"
//                           dashboard={data}
//                           charts={charts}
//                         />
//                       </div>
//                     ) : (
//                       !(
//                         dashboardLoading ||
//                         chartsLoading ||
//                         initialCashLoading ||
//                         data === null
//                       ) && (
//                         <div className="chart-fallback">
//                           <EmptyState
//                             title="Investment chart"
//                             description={
//                               hasInitialCash
//                                 ? "Add Portfolio balance and date to view the chart"
//                                 : "Add your initial cash and date to get started"
//                             }
//                             actionLabel="+"
//                             onAction={openPrimaryAddFlow}
//                           />
//                         </div>
//                       )
//                     )}

//                     {chartOverlayVisible && (
//                       <div className="chart-overlay is-visible">
//                         <Spinner />
//                       </div>
//                     )}
//                   </div>
//                 </Card>
//               </div>
//             </div>

//             {/* Right: Summary */}
//             <div className="dashboard-right">
//               <div className="fixed">
//                 <Card>
//                   <div className="summary-shell">
//                     <div className={`summary-content ${summaryClass}`}>
//                       <PortfolioSummary
//                         summary={
//                           hasSummary
//                             ? data.portfolio_daily_summary
//                             : {
//                                 open: 0,
//                                 close: 0,
//                                 pnl: 0,
//                                 roi: 0,
//                                 date: null,
//                               }
//                         }
//                         hideAddAction={!hasInitialCash}
//                         onEdit={(action) => {
//                           if (action === "add") {
//                             if (hasInitialCash) setShowAddModal(true);
//                             return;
//                           }

//                           if (hasSummary) setEditOpen(true);
//                           else if (hasInitialCash) setShowAddModal(true);
//                         }}
//                       />
//                     </div>

//                     {summaryOverlayVisible && (
//                       <div className="summary-overlay is-visible">
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

//       <Section>
//         <div className="dashboard-container">
//           <div className="dashboard-grid" style={{ alignItems: "stretch" }}>
//             {/* Left 50%: Edge Radar */}
//             <div className="dashboard-left" style={{ flex: "0 0 50%", minWidth: 0 }}>
//               <div className="fixed">
//                 <Card>
//                   <div className="profile-chart-shell">
//                     <div className={`profile-chart-content ${edgeClass}`}>
//                       {edgeReady ? <AnalysisEdgeRadar stats={stats} height={320} /> : null}
//                     </div>

//                     {edgeOverlayVisible && (
//                       <div className="profile-chart-overlay is-visible">
//                         <Spinner />
//                       </div>
//                     )}
//                   </div>
//                 </Card>
//               </div>
//             </div>

//             {/* Right 50%: Portfolio Calendar */}
//             <div className="dashboard-right" style={{ flex: "0 0 50%", minWidth: 0 }}>
//               <div className="fixed">
//                 <Card>
//                   <div className="profile-chart-shell calendar-shell">
//                     <div className={`profile-chart-content ${calendarClass}`}>
//                       {charts ? (
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

// export default Home;

