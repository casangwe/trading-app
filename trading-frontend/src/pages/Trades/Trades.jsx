// src/pages/Trades/Trades.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";

import Section from "../../components/layout/Section";
import Card from "../../components/layout/Card";
import EmptyState from "../../components/layout/EmptyState";
import Modal from "../../components/layout/Modal";
import Spinner from "../../components/layout/Spinner";

import TradesTable from "../../components/trades/TradeTable";
import TradeEntryForm from "../../components/trades/TradeEntry";
import TradeEditModal from "../../components/trades/TradeEdit";

import TradePnlBars from "../../components/charts/TradePnlBars";
import TradeKpi from "../../components/analysis/TradeKpi";
import AnalysisSymbolBubbles from "../../components/charts/AnalysisSymbolBubbles";

import { useTrades } from "../../hooks/useTrades";
import useTradeStats from "../../hooks/useTradeStats";
import { useRealizedPnl } from "../../hooks/useRealizedPnl";

const FADE_MS = 220;
const MIN_READY_DELAY_MS = 1000;

const Trades = () => {
  const {
    trades,
    loading: tradesLoading,
    error: tradesError,
    refreshTrades,
  } = useTrades();

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refreshStats,
  } = useTradeStats();

  const {
    range,
    setRange,
    data: realizedPnlData,
    loading: realizedPnlLoading,
    error: realizedPnlError,
    refresh: refreshRealizedPnl,
  } = useRealizedPnl("1M");

  const [showAdd, setShowAdd] = useState(false);
  const [editTrade, setEditTrade] = useState(null);

  // phases: "loading" | "pre" | "visible" | "fading"
  const [tablePhase, setTablePhase] = useState("loading");
  const [kpiPhase, setKpiPhase] = useState("loading");
  const [barsPhase, setBarsPhase] = useState("loading");
  const [bubblesPhase, setBubblesPhase] = useState("loading");

  // ready gates
  const [kpiReady, setKpiReady] = useState(false);
  const [barsReady, setBarsReady] = useState(false);
  const [bubblesReady, setBubblesReady] = useState(false);

  const handleAdd = useCallback(() => setShowAdd(true), []);

  const hasTradesArray = Array.isArray(trades);
  const hasRows = hasTradesArray && trades.length > 0;
  const hasStats = !!stats;

  const chartSummary = useMemo(() => {
    if (!stats) return null;
    return {
      tradeCount: stats.total_trades ?? 0,
      wins: stats.wins ?? 0,
      losses: stats.losses ?? 0,
      winRate: stats.win_rate ?? 0,
    };
  }, [stats]);

  const phaseToClass = useCallback((phase) => {
    if (phase === "visible") return "is-visible";
    if (phase === "fading") return "is-fading";
    if (phase === "pre") return "is-pre";
    return "";
  }, []);

  const tableClass = phaseToClass(tablePhase);
  const kpiClass = phaseToClass(kpiPhase);
  const barsClass = phaseToClass(barsPhase);
  const bubblesClass = phaseToClass(bubblesPhase);

  const tableOverlayVisible = tablePhase === "loading";
  const kpiOverlayVisible = kpiPhase === "loading" || statsLoading || !kpiReady;
  const barsOverlayVisible =
    barsPhase === "loading" ||
    tradesLoading ||
    statsLoading ||
    realizedPnlLoading ||
    !barsReady;
  const bubblesOverlayVisible =
    bubblesPhase === "loading" || statsLoading || !bubblesReady;

  // Table fade-in
  useEffect(() => {
    if (tradesLoading) {
      setTablePhase("loading");
      return;
    }

    if (!hasRows) {
      setTablePhase("visible");
      return;
    }

    setTablePhase("pre");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTablePhase("visible"));
    });
  }, [tradesLoading, hasRows]);

  // KPI ready delay + fade
  useEffect(() => {
    let t = null;
    setKpiReady(false);

    if (statsLoading) {
      setKpiPhase("loading");
      return;
    }

    t = setTimeout(() => {
      setKpiReady(true);

      if (!hasStats) {
        setKpiPhase("visible");
        return;
      }

      setKpiPhase("pre");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setKpiPhase("visible"));
      });
    }, MIN_READY_DELAY_MS);

    return () => {
      if (t) clearTimeout(t);
    };
  }, [statsLoading, hasStats]);

  // Bars ready delay + fade
  useEffect(() => {
    let t = null;
    setBarsReady(false);

    if (tradesLoading || statsLoading || realizedPnlLoading) {
      setBarsPhase("loading");
      return;
    }

    t = setTimeout(() => {
      setBarsReady(true);

      if (!hasRows) {
        setBarsPhase("visible");
        return;
      }

      setBarsPhase("pre");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setBarsPhase("visible"));
      });
    }, MIN_READY_DELAY_MS);

    return () => {
      if (t) clearTimeout(t);
    };
  }, [tradesLoading, statsLoading, realizedPnlLoading, hasRows, range]);

  // Symbol bubbles ready delay + fade
  useEffect(() => {
    let t = null;
    setBubblesReady(false);

    if (statsLoading) {
      setBubblesPhase("loading");
      return;
    }

    t = setTimeout(() => {
      setBubblesReady(true);

      if (!hasStats) {
        setBubblesPhase("visible");
        return;
      }

      setBubblesPhase("pre");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setBubblesPhase("visible"));
      });
    }, MIN_READY_DELAY_MS);

    return () => {
      if (t) clearTimeout(t);
    };
  }, [statsLoading, hasStats]);

  const runRefreshWithFade = useCallback(async () => {
    setTablePhase((p) => (p === "visible" ? "fading" : p));
    setKpiPhase((p) => (p === "visible" ? "fading" : p));
    setBarsPhase((p) => (p === "visible" ? "fading" : p));
    setBubblesPhase((p) => (p === "visible" ? "fading" : p));

    await new Promise((r) => setTimeout(r, FADE_MS));

    setTablePhase("loading");
    setKpiPhase("loading");
    setBarsPhase("loading");
    setBubblesPhase("loading");

    setKpiReady(false);
    setBarsReady(false);
    setBubblesReady(false);

    await Promise.allSettled([
      refreshTrades(),
      refreshStats(),
      refreshRealizedPnl(),
    ]);
  }, [refreshTrades, refreshStats, refreshRealizedPnl]);

  const fatal =
    (!hasTradesArray && tradesError) ||
    (!hasStats && statsError);

  if (fatal) {
    return (
      <Section>
        <EmptyState title="Unable to load trades" description="Something went wrong." />
      </Section>
    );
  }

  return (
    <>
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}>
        <TradeEntryForm
          onSuccess={async () => {
            setShowAdd(false);
            await runRefreshWithFade();
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <TradeEditModal
        trade={editTrade}
        isOpen={Boolean(editTrade)}
        onClose={() => setEditTrade(null)}
        onSaved={async () => {
          setEditTrade(null);
          await runRefreshWithFade();
        }}
        onDeleted={async () => {
          setEditTrade(null);
          await runRefreshWithFade();
        }}
      />

      <Section>
        <div className="dashboard-container">
          <div className="dashboard-grid">
            <div className="dashboard-left">
              <div className="fixed">
                <Card>
                  <div className="bars-shell">
                    {barsReady ? (
                      hasRows ? (
                        <div className={`bars-content ${barsClass}`}>
                          <TradePnlBars
                            summary={chartSummary}
                            range={range}
                            onRangeChange={setRange}
                            data={realizedPnlData}
                            error={realizedPnlError}
                          />
                        </div>
                      ) : (
                        <div className="chart-fallback">
                          <EmptyState
                            title="Realized P&L"
                            description="Enter your first trade to track P&L performance."
                            actionLabel="+"
                            onAction={handleAdd}
                          />
                        </div>
                      )
                    ) : null}

                    {barsOverlayVisible && (
                      <div className="bars-overlay is-visible">
                        <Spinner />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            <div className="dashboard-right">
              <div className="fixed">
                <Card>
                  <div className="kpi-shell">
                    {kpiReady ? (
                      hasStats ? (
                        <div className={`kpi-content ${kpiClass}`}>
                          <TradeKpi stats={stats} />
                        </div>
                      ) : (
                        <div className="kpi-fallback">
                          <EmptyState
                            title="KPI unavailable"
                            description={statsError || "No KPI data found."}
                          />
                        </div>
                      )
                    ) : null}

                    {kpiOverlayVisible && (
                      <div className="kpi-overlay is-visible">
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
        <Card>
          <div className="bars-shell">
            {bubblesReady ? (
              <div className={`bars-content ${bubblesClass}`}>
                {hasStats ? (
                  <AnalysisSymbolBubbles
                    stats={stats}
                    height={450}
                    limit={18}
                  />
                ) : (
                  <EmptyState
                    title="Symbols"
                    description="Enter your first trade to view symbol performance."
                  />
                )}
              </div>
            ) : null}

            {bubblesOverlayVisible && (
              <div className="bars-overlay is-visible">
                <Spinner />
              </div>
            )}
          </div>
        </Card>
      </Section>

      <Section>
        <Card>
          <div className="trade-table-shell">
            <div className={`trade-table-content ${tableClass}`}>
              <TradesTable
                trades={trades || []}
                onAdd={handleAdd}
                onEdit={setEditTrade}
              />
            </div>

            {(tableOverlayVisible || tradesLoading) && (
              <div className="trade-table-overlay is-visible">
                <Spinner />
              </div>
            )}
          </div>
        </Card>
      </Section>
    </>
  );
};

export default Trades;


// // src/pages/Trades/Trades.jsx
// import React, { useCallback, useEffect, useMemo, useState } from "react";

// import Section from "../../components/layout/Section";
// import Card from "../../components/layout/Card";
// import EmptyState from "../../components/layout/EmptyState";
// import Modal from "../../components/layout/Modal";
// import Spinner from "../../components/layout/Spinner";

// import TradesTable from "../../components/trades/TradeTable";
// import TradeEntryForm from "../../components/trades/TradeEntry";
// import TradeEditModal from "../../components/trades/TradeEdit";

// import TradePnlBars from "../../components/charts/TradePnlBars";
// import TradeKpi from "../../components/analysis/TradeKpi";
// import AnalysisSymbolBubbles from "../../components/charts/AnalysisSymbolBubbles";

// import { useTrades } from "../../hooks/useTrades";
// import useTradeStats from "../../hooks/useTradeStats";

// const FADE_MS = 220;
// const MIN_READY_DELAY_MS = 1000;

// const Trades = () => {
//   const {
//     trades,
//     loading: tradesLoading,
//     error: tradesError,
//     refreshTrades,
//   } = useTrades();

//   const {
//     stats,
//     loading: statsLoading,
//     error: statsError,
//     refreshStats,
//   } = useTradeStats();

//   const [showAdd, setShowAdd] = useState(false);
//   const [editTrade, setEditTrade] = useState(null);

//   // phases: "loading" | "pre" | "visible" | "fading"
//   const [tablePhase, setTablePhase] = useState("loading");
//   const [kpiPhase, setKpiPhase] = useState("loading");
//   const [barsPhase, setBarsPhase] = useState("loading");
//   const [bubblesPhase, setBubblesPhase] = useState("loading");

//   // ready gates
//   const [kpiReady, setKpiReady] = useState(false);
//   const [barsReady, setBarsReady] = useState(false);
//   const [bubblesReady, setBubblesReady] = useState(false);

//   const handleAdd = useCallback(() => setShowAdd(true), []);

//   const hasTradesArray = Array.isArray(trades);
//   const hasRows = hasTradesArray && trades.length > 0;
//   const hasStats = !!stats;

//   const chartSummary = useMemo(() => {
//     if (!stats) return null;
//     return {
//       tradeCount: stats.total_trades ?? 0,
//       wins: stats.wins ?? 0,
//       losses: stats.losses ?? 0,
//       winRate: stats.win_rate ?? 0,
//     };
//   }, [stats]);

//   const phaseToClass = useCallback((phase) => {
//     if (phase === "visible") return "is-visible";
//     if (phase === "fading") return "is-fading";
//     if (phase === "pre") return "is-pre";
//     return "";
//   }, []);

//   const tableClass = phaseToClass(tablePhase);
//   const kpiClass = phaseToClass(kpiPhase);
//   const barsClass = phaseToClass(barsPhase);
//   const bubblesClass = phaseToClass(bubblesPhase);

//   const tableOverlayVisible = tablePhase === "loading";
//   const kpiOverlayVisible = kpiPhase === "loading" || statsLoading || !kpiReady;
//   const barsOverlayVisible = barsPhase === "loading" || tradesLoading || statsLoading || !barsReady;
//   const bubblesOverlayVisible =
//     bubblesPhase === "loading" || statsLoading || !bubblesReady;

//   useEffect(() => {
//     if (tradesLoading) {
//       setTablePhase("loading");
//       return;
//     }

//     if (!hasRows) {
//       setTablePhase("visible");
//       return;
//     }

//     setTablePhase("pre");
//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => setTablePhase("visible"));
//     });
//   }, [tradesLoading, hasRows]);

//   useEffect(() => {
//     let t = null;
//     setKpiReady(false);

//     if (statsLoading) {
//       setKpiPhase("loading");
//       return;
//     }

//     t = setTimeout(() => {
//       setKpiReady(true);

//       if (!hasStats) {
//         setKpiPhase("visible");
//         return;
//       }

//       setKpiPhase("pre");
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => setKpiPhase("visible"));
//       });
//     }, MIN_READY_DELAY_MS);

//     return () => {
//       if (t) clearTimeout(t);
//     };
//   }, [statsLoading, hasStats]);

//   useEffect(() => {
//     let t = null;
//     setBarsReady(false);

//     if (tradesLoading || statsLoading) {
//       setBarsPhase("loading");
//       return;
//     }

//     t = setTimeout(() => {
//       setBarsReady(true);

//       if (!hasRows) {
//         setBarsPhase("visible");
//         return;
//       }

//       setBarsPhase("pre");
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => setBarsPhase("visible"));
//       });
//     }, MIN_READY_DELAY_MS);

//     return () => {
//       if (t) clearTimeout(t);
//     };
//   }, [tradesLoading, statsLoading, hasRows]);

//   useEffect(() => {
//     let t = null;
//     setBubblesReady(false);

//     if (statsLoading) {
//       setBubblesPhase("loading");
//       return;
//     }

//     t = setTimeout(() => {
//       setBubblesReady(true);

//       if (!hasStats) {
//         setBubblesPhase("visible");
//         return;
//       }

//       setBubblesPhase("pre");
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => setBubblesPhase("visible"));
//       });
//     }, MIN_READY_DELAY_MS);

//     return () => {
//       if (t) clearTimeout(t);
//     };
//   }, [statsLoading, hasStats]);

//   const runRefreshWithFade = useCallback(async () => {
//     setTablePhase((p) => (p === "visible" ? "fading" : p));
//     setKpiPhase((p) => (p === "visible" ? "fading" : p));
//     setBarsPhase((p) => (p === "visible" ? "fading" : p));
//     setBubblesPhase((p) => (p === "visible" ? "fading" : p));

//     await new Promise((r) => setTimeout(r, FADE_MS));

//     setTablePhase("loading");
//     setKpiPhase("loading");
//     setBarsPhase("loading");
//     setBubblesPhase("loading");

//     setKpiReady(false);
//     setBarsReady(false);
//     setBubblesReady(false);

//     await Promise.allSettled([refreshTrades(), refreshStats()]);
//   }, [refreshTrades, refreshStats]);

//   const fatal = (!hasTradesArray && tradesError) || (!hasStats && statsError);

//   if (fatal) {
//     return (
//       <Section>
//         <EmptyState title="Unable to load trades" description="Something went wrong." />
//       </Section>
//     );
//   }

//   return (
//     <>
//       <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}>
//         <TradeEntryForm
//           onSuccess={async () => {
//             setShowAdd(false);
//             await runRefreshWithFade();
//           }}
//           onCancel={() => setShowAdd(false)}
//         />
//       </Modal>

//       <TradeEditModal
//         trade={editTrade}
//         isOpen={Boolean(editTrade)}
//         onClose={() => setEditTrade(null)}
//         onSaved={async () => {
//           setEditTrade(null);
//           await runRefreshWithFade();
//         }}
//         onDeleted={async () => {
//           setEditTrade(null);
//           await runRefreshWithFade();
//         }}
//       />

//       <Section>
//         <div className="dashboard-container">
//           <div className="dashboard-grid">
//             <div className="dashboard-left">
//               <div className="fixed">
//                 <Card>
//                   <div className="bars-shell">
//                     {barsReady ? (
//                       hasRows ? (
//                         <div className={`bars-content ${barsClass}`}>
//                           <TradePnlBars summary={chartSummary} />
//                         </div>
//                       ) : (
//                         <div className="chart-fallback">
//                           <EmptyState
//                             title="Realized P&L"
//                             description="Enter your first trade to track P&L performance."
//                             actionLabel="+"
//                             onAction={handleAdd}
//                           />
//                         </div>
//                       )
//                     ) : null}

//                     {barsOverlayVisible && (
//                       <div className="bars-overlay is-visible">
//                         <Spinner />
//                       </div>
//                     )}
//                   </div>
//                 </Card>
//               </div>
//             </div>

//             <div className="dashboard-right">
//               <div className="fixed">
//                 <Card>
//                   <div className="kpi-shell">
//                     {kpiReady ? (
//                       hasStats ? (
//                         <div className={`kpi-content ${kpiClass}`}>
//                           <TradeKpi stats={stats} />
//                         </div>
//                       ) : (
//                         <div className="kpi-fallback">
//                           <EmptyState
//                             title="KPI unavailable"
//                             description={statsError || "No KPI data found."}
//                           />
//                         </div>
//                       )
//                     ) : null}

//                     {kpiOverlayVisible && (
//                       <div className="kpi-overlay is-visible">
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
//         <Card>
//           <div className="bars-shell">
//             {bubblesReady ? (
//               <div className={`bars-content ${bubblesClass}`}>
//                 {hasStats ? (
//                   <AnalysisSymbolBubbles
//                     stats={stats}
//                     height={450}
//                     limit={18}
//                   />
//                 ) : (
//                   <EmptyState
//                     title="Symbols"
//                     description="Enter your first trade to view symbol performance."
//                   />
//                 )}
//               </div>
//             ) : null}

//             {bubblesOverlayVisible && (
//               <div className="bars-overlay is-visible">
//                 <Spinner />
//               </div>
//             )}
//           </div>
//         </Card>
//       </Section>

//       <Section>
//         <Card>
//           <div className="trade-table-shell">
//             <div className={`trade-table-content ${tableClass}`}>
//               <TradesTable
//                 trades={trades || []}
//                 onAdd={handleAdd}
//                 onEdit={setEditTrade}
//               />
//             </div>

//             {(tableOverlayVisible || tradesLoading) && (
//               <div className="trade-table-overlay is-visible">
//                 <Spinner />
//               </div>
//             )}
//           </div>
//         </Card>
//       </Section>
//     </>
//   );
// };

// export default Trades;


// // // src/pages/Trades/Trades.jsx
// // import React, { useCallback, useEffect, useMemo, useState } from "react";

// // import Section from "../../components/layout/Section";
// // import Card from "../../components/layout/Card";
// // import EmptyState from "../../components/layout/EmptyState";
// // import Modal from "../../components/layout/Modal";
// // import Spinner from "../../components/layout/Spinner";

// // import TradesTable from "../../components/trades/TradeTable";
// // import TradeEntryForm from "../../components/trades/TradeEntry";
// // import TradeEditModal from "../../components/trades/TradeEdit";

// // import TradePnlBars from "../../components/charts/TradePnlBars";
// // import TradeKpi from "../../components/analysis/TradeKpi";
// // import AnalysisSymbolBubbles from "../../components/charts/AnalysisSymbolBubbles";

// // import { useTrades } from "../../hooks/useTrades";
// // import useTradeStats from "../../hooks/useTradeStats";

// // const FADE_MS = 220;
// // const MIN_READY_DELAY_MS = 1000;

// // const Trades = () => {
// //   const {
// //     trades,
// //     loading: tradesLoading,
// //     error: tradesError,
// //     refreshTrades,
// //   } = useTrades();

// //   const {
// //     stats,
// //     loading: statsLoading,
// //     error: statsError,
// //     refreshStats,
// //   } = useTradeStats();

// //   const [showAdd, setShowAdd] = useState(false);
// //   const [editTrade, setEditTrade] = useState(null);

// //   // phases: "loading" | "pre" | "visible" | "fading"
// //   const [tablePhase, setTablePhase] = useState("loading");
// //   const [kpiPhase, setKpiPhase] = useState("loading");
// //   const [barsPhase, setBarsPhase] = useState("loading");
// //   const [bubblesPhase, setBubblesPhase] = useState("loading");

// //   // ready gates
// //   const [kpiReady, setKpiReady] = useState(false);
// //   const [barsReady, setBarsReady] = useState(false);
// //   const [bubblesReady, setBubblesReady] = useState(false);

// //   // remount keys so charts can re-animate after refresh
// //   const [barsKey, setBarsKey] = useState(0);
// //   const [bubblesKey, setBubblesKey] = useState(0);

// //   const handleAdd = useCallback(() => setShowAdd(true), []);

// //   const hasTradesArray = Array.isArray(trades);
// //   const hasRows = hasTradesArray && trades.length > 0;
// //   const hasStats = !!stats;

// //   const chartSummary = useMemo(() => {
// //     if (!stats) return null;
// //     return {
// //       tradeCount: stats.total_trades ?? 0,
// //       wins: stats.wins ?? 0,
// //       losses: stats.losses ?? 0,
// //       winRate: stats.win_rate ?? 0,
// //     };
// //   }, [stats]);

// //   const phaseToClass = useCallback((phase) => {
// //     if (phase === "visible") return "is-visible";
// //     if (phase === "fading") return "is-fading";
// //     if (phase === "pre") return "is-pre";
// //     return "";
// //   }, []);

// //   const tableClass = phaseToClass(tablePhase);
// //   const kpiClass = phaseToClass(kpiPhase);
// //   const barsClass = phaseToClass(barsPhase);
// //   const bubblesClass = phaseToClass(bubblesPhase);

// //   const tableOverlayVisible = tablePhase === "loading";
// //   const kpiOverlayVisible = kpiPhase === "loading" || statsLoading || !kpiReady;
// //   const barsOverlayVisible = barsPhase === "loading" || tradesLoading || statsLoading || !barsReady;
// //   const bubblesOverlayVisible =
// //     bubblesPhase === "loading" || statsLoading || !bubblesReady;

// //   // Initial / refreshed table fade-in
// //   useEffect(() => {
// //     if (tradesLoading) {
// //       setTablePhase("loading");
// //       return;
// //     }

// //     if (!hasRows) {
// //       setTablePhase("visible");
// //       return;
// //     }

// //     setTablePhase("pre");
// //     requestAnimationFrame(() => {
// //       requestAnimationFrame(() => setTablePhase("visible"));
// //     });
// //   }, [tradesLoading, hasRows]);

// //   // KPI ready delay + fade
// //   useEffect(() => {
// //     let t = null;
// //     setKpiReady(false);

// //     if (statsLoading) {
// //       setKpiPhase("loading");
// //       return;
// //     }

// //     t = setTimeout(() => {
// //       setKpiReady(true);

// //       if (!hasStats) {
// //         setKpiPhase("visible");
// //         return;
// //       }

// //       setKpiPhase("pre");
// //       requestAnimationFrame(() => {
// //         requestAnimationFrame(() => setKpiPhase("visible"));
// //       });
// //     }, MIN_READY_DELAY_MS);

// //     return () => {
// //       if (t) clearTimeout(t);
// //     };
// //   }, [statsLoading, hasStats]);

// //   // Bars ready delay + fade
// //   useEffect(() => {
// //     let t = null;
// //     setBarsReady(false);

// //     if (tradesLoading || statsLoading) {
// //       setBarsPhase("loading");
// //       return;
// //     }

// //     t = setTimeout(() => {
// //       setBarsReady(true);

// //       if (!hasRows) {
// //         setBarsPhase("visible");
// //         return;
// //       }

// //       setBarsPhase("pre");
// //       requestAnimationFrame(() => {
// //         requestAnimationFrame(() => setBarsPhase("visible"));
// //       });
// //     }, MIN_READY_DELAY_MS);

// //     return () => {
// //       if (t) clearTimeout(t);
// //     };
// //   }, [tradesLoading, statsLoading, hasRows, barsKey]);

// //   // Symbol bubbles ready delay + fade
// //   useEffect(() => {
// //     let t = null;
// //     setBubblesReady(false);

// //     if (statsLoading) {
// //       setBubblesPhase("loading");
// //       return;
// //     }

// //     t = setTimeout(() => {
// //       setBubblesReady(true);

// //       if (!hasStats) {
// //         setBubblesPhase("visible");
// //         return;
// //       }

// //       setBubblesPhase("pre");
// //       requestAnimationFrame(() => {
// //         requestAnimationFrame(() => setBubblesPhase("visible"));
// //       });
// //     }, MIN_READY_DELAY_MS);

// //     return () => {
// //       if (t) clearTimeout(t);
// //     };
// //   }, [statsLoading, hasStats, bubblesKey]);

// //   const runRefreshWithFade = useCallback(async () => {
// //     setTablePhase((p) => (p === "visible" ? "fading" : p));
// //     setKpiPhase((p) => (p === "visible" ? "fading" : p));
// //     setBarsPhase((p) => (p === "visible" ? "fading" : p));
// //     setBubblesPhase((p) => (p === "visible" ? "fading" : p));

// //     await new Promise((r) => setTimeout(r, FADE_MS));

// //     setTablePhase("loading");
// //     setKpiPhase("loading");
// //     setBarsPhase("loading");
// //     setBubblesPhase("loading");

// //     setKpiReady(false);
// //     setBarsReady(false);
// //     setBubblesReady(false);

// //     await Promise.allSettled([refreshTrades(), refreshStats()]);

// //     // trigger chart remounts after refreshed data lands
// //     setBarsKey((k) => k + 1);
// //     setBubblesKey((k) => k + 1);
// //   }, [refreshTrades, refreshStats]);

// //   const fatal = (!hasTradesArray && tradesError) || (!hasStats && statsError);

// //   if (fatal) {
// //     return (
// //       <Section>
// //         <EmptyState title="Unable to load trades" description="Something went wrong." />
// //       </Section>
// //     );
// //   }

// //   return (
// //     <>
// //       <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}>
// //         <TradeEntryForm
// //           onSuccess={async () => {
// //             setShowAdd(false);
// //             await runRefreshWithFade();
// //           }}
// //           onCancel={() => setShowAdd(false)}
// //         />
// //       </Modal>

// //       <TradeEditModal
// //         trade={editTrade}
// //         isOpen={Boolean(editTrade)}
// //         onClose={() => setEditTrade(null)}
// //         onSaved={async () => {
// //           setEditTrade(null);
// //           await runRefreshWithFade();
// //         }}
// //         onDeleted={async () => {
// //           setEditTrade(null);
// //           await runRefreshWithFade();
// //         }}
// //       />

// //       <Section>
// //         <div className="dashboard-container">
// //           <div className="dashboard-grid">
// //             <div className="dashboard-left">
// //               <div className="fixed">
// //                 <Card>
// //                   <div className="bars-shell">
// //                     {barsReady ? (
// //                       hasRows ? (
// //                         <div className={`bars-content ${barsClass}`}>
// //                           <TradePnlBars key={barsKey} summary={chartSummary} />
// //                         </div>
// //                       ) : (
// //                         <div className="chart-fallback">
// //                           <EmptyState
// //                             title="Realized P&L"
// //                             description="Enter your first trade to track P&L performance."
// //                             actionLabel="+"
// //                             onAction={handleAdd}
// //                           />
// //                         </div>
// //                       )
// //                     ) : null}

// //                     {barsOverlayVisible && (
// //                       <div className="bars-overlay is-visible">
// //                         <Spinner />
// //                       </div>
// //                     )}
// //                   </div>
// //                 </Card>
// //               </div>
// //             </div>

// //             <div className="dashboard-right">
// //               <div className="fixed">
// //                 <Card>
// //                   <div className="kpi-shell">
// //                     {kpiReady ? (
// //                       hasStats ? (
// //                         <div className={`kpi-content ${kpiClass}`}>
// //                           <TradeKpi stats={stats} />
// //                         </div>
// //                       ) : (
// //                         <div className="kpi-fallback">
// //                           <EmptyState
// //                             title="KPI unavailable"
// //                             description={statsError || "No KPI data found."}
// //                           />
// //                         </div>
// //                       )
// //                     ) : null}

// //                     {kpiOverlayVisible && (
// //                       <div className="kpi-overlay is-visible">
// //                         <Spinner />
// //                       </div>
// //                     )}
// //                   </div>
// //                 </Card>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </Section>

// //       <Section>
// //         <Card>
// //           <div className="bars-shell">
// //             {bubblesReady ? (
// //               <div className={`bars-content ${bubblesClass}`}>
// //                 {hasStats ? (
// //                   <AnalysisSymbolBubbles
// //                     key={bubblesKey}
// //                     stats={stats}
// //                     height={450}
// //                     limit={18}
// //                   />
// //                 ) : (
// //                   <EmptyState
// //                     title="Symbols"
// //                     description="Enter your first trade to view symbol performance."
// //                   />
// //                 )}
// //               </div>
// //             ) : null}

// //             {bubblesOverlayVisible && (
// //               <div className="bars-overlay is-visible">
// //                 <Spinner />
// //               </div>
// //             )}
// //           </div>
// //         </Card>
// //       </Section>

// //       <Section>
// //         <Card>
// //           <div className="trade-table-shell">
// //             <div className={`trade-table-content ${tableClass}`}>
// //               <TradesTable
// //                 trades={trades || []}
// //                 onAdd={handleAdd}
// //                 onEdit={setEditTrade}
// //               />
// //             </div>

// //             {(tableOverlayVisible || tradesLoading) && (
// //               <div className="trade-table-overlay is-visible">
// //                 <Spinner />
// //               </div>
// //             )}
// //           </div>
// //         </Card>
// //       </Section>
// //     </>
// //   );
// // };

// // export default Trades;

// // // // src/pages/Trades/Trades.jsx
// // // import React, { useCallback, useEffect, useMemo, useState } from "react";

// // // import Section from "../../components/layout/Section";
// // // import Card from "../../components/layout/Card";
// // // import EmptyState from "../../components/layout/EmptyState";
// // // import Modal from "../../components/layout/Modal";
// // // import Spinner from "../../components/layout/Spinner";

// // // import TradesTable from "../../components/trades/TradeTable";
// // // import TradeEntryForm from "../../components/trades/TradeEntry";
// // // import TradeEditModal from "../../components/trades/TradeEdit";

// // // import TradePnlBars from "../../components/charts/TradePnlBars";
// // // import TradeKpi from "../../components/analysis/TradeKpi";
// // // import AnalysisSymbolBubbles from "../../components/charts/AnalysisSymbolBubbles";

// // // import { useTrades } from "../../hooks/useTrades";
// // // import useTradeStats from "../../hooks/useTradeStats";

// // // const FADE_MS = 220;

// // // const Trades = () => {
// // //   const {
// // //     trades,
// // //     loading: tradesLoading,
// // //     error: tradesError,
// // //     refreshTrades,
// // //   } = useTrades();

// // //   const {
// // //     stats,
// // //     loading: statsLoading,
// // //     error: statsError,
// // //     refreshStats,
// // //   } = useTradeStats();

// // //   const [showAdd, setShowAdd] = useState(false);
// // //   const [editTrade, setEditTrade] = useState(null);

// // //   // phases: "loading" | "pre" | "visible" | "fading"
// // //   const [tablePhase, setTablePhase] = useState("loading");
// // //   const [kpiPhase, setKpiPhase] = useState("loading");
// // //   const [barsPhase, setBarsPhase] = useState("loading");
// // //   const [bubblesPhase, setBubblesPhase] = useState("loading");

// // //   // remount keys so charts can re-animate after refresh
// // //   const [barsKey, setBarsKey] = useState(0);
// // //   const [bubblesKey, setBubblesKey] = useState(0);

// // //   const handleAdd = useCallback(() => setShowAdd(true), []);

// // //   const hasTradesArray = Array.isArray(trades);
// // //   const hasRows = hasTradesArray && trades.length > 0;
// // //   const hasStats = !!stats;

// // //   const chartSummary = useMemo(() => {
// // //     if (!stats) return null;
// // //     return {
// // //       tradeCount: stats.total_trades ?? 0,
// // //       wins: stats.wins ?? 0,
// // //       losses: stats.losses ?? 0,
// // //       winRate: stats.win_rate ?? 0,
// // //     };
// // //   }, [stats]);

// // //   const phaseToClass = useCallback((phase) => {
// // //     if (phase === "visible") return "is-visible";
// // //     if (phase === "fading") return "is-fading";
// // //     if (phase === "pre") return "is-pre";
// // //     return "";
// // //   }, []);

// // //   const tableClass = phaseToClass(tablePhase);
// // //   const kpiClass = phaseToClass(kpiPhase);
// // //   const barsClass = phaseToClass(barsPhase);
// // //   const bubblesClass = phaseToClass(bubblesPhase);

// // //   const tableOverlayVisible = tablePhase === "loading";
// // //   const kpiOverlayVisible = kpiPhase === "loading";
// // //   const barsOverlayVisible = barsPhase === "loading";
// // //   const bubblesOverlayVisible = bubblesPhase === "loading";

// // //   // Initial / refreshed table fade-in
// // //   useEffect(() => {
// // //     if (tradesLoading) {
// // //       setTablePhase("loading");
// // //       return;
// // //     }

// // //     if (!hasRows) {
// // //       setTablePhase("visible");
// // //       return;
// // //     }

// // //     setTablePhase("pre");
// // //     requestAnimationFrame(() => {
// // //       requestAnimationFrame(() => setTablePhase("visible"));
// // //     });
// // //   }, [tradesLoading, hasRows]);

// // //   // Initial / refreshed KPI fade-in
// // //   useEffect(() => {
// // //     if (statsLoading) {
// // //       setKpiPhase("loading");
// // //       return;
// // //     }

// // //     if (!hasStats) {
// // //       setKpiPhase("visible");
// // //       return;
// // //     }

// // //     setKpiPhase("pre");
// // //     requestAnimationFrame(() => {
// // //       requestAnimationFrame(() => setKpiPhase("visible"));
// // //     });
// // //   }, [statsLoading, hasStats]);

// // //   // Initial / refreshed bars fade-in
// // //   useEffect(() => {
// // //     if (tradesLoading || statsLoading) {
// // //       setBarsPhase("loading");
// // //       return;
// // //     }

// // //     if (!hasRows) {
// // //       setBarsPhase("visible");
// // //       return;
// // //     }

// // //     setBarsPhase("pre");
// // //     requestAnimationFrame(() => {
// // //       requestAnimationFrame(() => setBarsPhase("visible"));
// // //     });
// // //   }, [tradesLoading, statsLoading, hasRows, barsKey]);

// // //   // Initial / refreshed symbol bubbles fade-in
// // //   useEffect(() => {
// // //     if (statsLoading) {
// // //       setBubblesPhase("loading");
// // //       return;
// // //     }

// // //     setBubblesPhase("pre");
// // //     requestAnimationFrame(() => {
// // //       requestAnimationFrame(() => setBubblesPhase("visible"));
// // //     });
// // //   }, [statsLoading, bubblesKey]);

// // //   const runRefreshWithFade = useCallback(async () => {
// // //     setTablePhase((p) => (p === "visible" ? "fading" : p));
// // //     setKpiPhase((p) => (p === "visible" ? "fading" : p));
// // //     setBarsPhase((p) => (p === "visible" ? "fading" : p));
// // //     setBubblesPhase((p) => (p === "visible" ? "fading" : p));

// // //     await new Promise((r) => setTimeout(r, FADE_MS));

// // //     setTablePhase("loading");
// // //     setKpiPhase("loading");
// // //     setBarsPhase("loading");
// // //     setBubblesPhase("loading");

// // //     await Promise.allSettled([refreshTrades(), refreshStats()]);

// // //     // trigger chart remounts after refreshed data lands
// // //     setBarsKey((k) => k + 1);
// // //     setBubblesKey((k) => k + 1);
// // //   }, [refreshTrades, refreshStats]);

// // //   const fatal = (!hasTradesArray && tradesError) || (!hasStats && statsError);

// // //   if (fatal) {
// // //     return (
// // //       <Section>
// // //         <EmptyState title="Unable to load trades" description="Something went wrong." />
// // //       </Section>
// // //     );
// // //   }

// // //   return (
// // //     <>
// // //       {/* Add Trade */}
// // //       <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}>
// // //         <TradeEntryForm
// // //           onSuccess={async () => {
// // //             setShowAdd(false);
// // //             await runRefreshWithFade();
// // //           }}
// // //           onCancel={() => setShowAdd(false)}
// // //         />
// // //       </Modal>

// // //       {/* Edit Trade */}
// // //       <TradeEditModal
// // //         trade={editTrade}
// // //         isOpen={Boolean(editTrade)}
// // //         onClose={() => setEditTrade(null)}
// // //         onSaved={async () => {
// // //           setEditTrade(null);
// // //           await runRefreshWithFade();
// // //         }}
// // //         onDeleted={async () => {
// // //           setEditTrade(null);
// // //           await runRefreshWithFade();
// // //         }}
// // //       />

// // //       {/* Dashboard Grid: Bars + KPI */}
// // //       <Section>
// // //         <div className="dashboard-container">
// // //           <div className="dashboard-grid">
// // //             {/* Left: Realized PnL Bars */}
// // //             <div className="dashboard-left">
// // //               <div className="fixed">
// // //                 <Card>
// // //                   <div className="bars-shell">
// // //                     {hasRows ? (
// // //                       <div className={`bars-content ${barsClass}`}>
// // //                         {barsPhase === "visible" ? (
// // //                           <TradePnlBars key={barsKey} summary={chartSummary} />
// // //                         ) : null}
// // //                       </div>
// // //                     ) : (
// // //                       !(tradesLoading || statsLoading) && (
// // //                         <div className="chart-fallback">
// // //                           <EmptyState
// // //                             title="Realized P&L"
// // //                             description="Enter your first trade to track P&L performance."
// // //                             actionLabel="+"
// // //                             onAction={handleAdd}
// // //                             // data-tooltip="New Entry" 
// // //                           />
// // //                         </div>
// // //                       )
// // //                     )}

// // //                     {(barsOverlayVisible || tradesLoading || statsLoading) && (
// // //                       <div className="bars-overlay is-visible">
// // //                         <Spinner />
// // //                       </div>
// // //                     )}
// // //                   </div>
// // //                 </Card>
// // //               </div>
// // //             </div>

// // //             {/* Right: Trade KPI */}
// // //             <div className="dashboard-right">
// // //               <div className="fixed">
// // //                 <Card>
// // //                   <div className="kpi-shell">
// // //                     {hasStats ? (
// // //                       <div className={`kpi-content ${kpiClass}`}>
// // //                         <TradeKpi stats={stats} />
// // //                       </div>
// // //                     ) : (
// // //                       !statsLoading && (
// // //                         <div className="kpi-fallback">
// // //                           <EmptyState
// // //                             title="KPI unavailable"
// // //                             description={statsError || "No KPI data found."}
// // //                           />
// // //                         </div>
// // //                       )
// // //                     )}

// // //                     {(kpiOverlayVisible || statsLoading) && (
// // //                       <div className="kpi-overlay is-visible">
// // //                         <Spinner />
// // //                       </div>
// // //                     )}
// // //                   </div>
// // //                 </Card>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </Section>

// // //       {/* Symbol Bubbles */}
// // //       <Section>
// // //         <Card>
// // //           <div className="bars-shell">
// // //             <div className={`bars-content ${bubblesClass}`}>
// // //               {bubblesPhase === "visible" ? (
// // //                 hasStats ? (
// // //                   <AnalysisSymbolBubbles
// // //                     key={bubblesKey}
// // //                     stats={stats}
// // //                     height={450}
// // //                     limit={18}
// // //                   />
// // //                 ) : (
// // //                   !statsLoading && (
// // //                     <EmptyState
// // //                       title="Symbols"
// // //                       description="Enter your first trade to view symbol performance."
// // //                     />
// // //                   )
// // //                 )
// // //               ) : null}
// // //             </div>

// // //             {(bubblesOverlayVisible || statsLoading) && (
// // //               <div className="bars-overlay is-visible">
// // //                 <Spinner />
// // //               </div>
// // //             )}
// // //           </div>
// // //         </Card>
// // //       </Section>

// // //       {/* Trades Table */}
// // //       <Section>
// // //         <Card>
// // //           <div className="trade-table-shell">
// // //             <div className={`trade-table-content ${tableClass}`}>
// // //               <TradesTable
// // //                 trades={trades || []}
// // //                 onAdd={handleAdd}
// // //                 onEdit={setEditTrade}
// // //               />
// // //             </div>

// // //             {(tableOverlayVisible || tradesLoading) && (
// // //               <div className="trade-table-overlay is-visible">
// // //                 <Spinner />
// // //               </div>
// // //             )}
// // //           </div>
// // //         </Card>
// // //       </Section>
// // //     </>
// // //   );
// // // };

// // // export default Trades;

