// src/pages/Profile/Profile.jsx

import React, { useCallback, useEffect, useState } from "react";

import Section from "../../components/layout/Section";
import Card from "../../components/layout/Card";
import EmptyState from "../../components/layout/EmptyState";
import Modal from "../../components/layout/Modal";
import Spinner from "../../components/layout/Spinner";

import TransactionsTable from "../../components/transactions/TransactionTable";
import TransactionEntry from "../../components/transactions/TransactionEntry";
import TransactionEdit from "../../components/transactions/TransactionEdit";

import InitialCashEntry from "../../components/portfolio/InitialCashEntry";
import InvestmentChart from "../../components/charts/InvestmentsChart";
import AccountKpis from "../../components/analysis/AccountKpis";

import { useTransactions } from "../../hooks/useTransactions";
import { useDashboard } from "../../hooks/useDashboard";
import useCharts from "../../hooks/useCharts";
import useInitialCash from "../../hooks/useInitialCash";

const FADE_MS = 220;

const Profile = () => {
  const { data: dashboard, error: dashboardError, refreshDashboard } = useDashboard();
  const { charts, error: chartsError, refreshCharts } = useCharts();

  const {
    transactions,
    loading: txLoading,
    error: txError,
    isEmpty: txEmpty,
    refreshTransactions,
  } = useTransactions();

  const {
    initialCash,
    loading: initialCashLoading,
    hasInitialCash,
    refreshInitialCash,
  } = useInitialCash();

  const [showAdd, setShowAdd] = useState(false);
  const [showInitialCashModal, setShowInitialCashModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [chartKey, setChartKey] = useState(0);

  const handleAdd = useCallback(() => setShowAdd(true), []);
  const handleInitialCashAdd = useCallback(() => setShowInitialCashModal(true), []);

  const [chartPhase, setChartPhase] = useState("loading");
  const [kpiPhase, setKpiPhase] = useState("loading");
  const [tablePhase, setTablePhase] = useState("loading");

  const phaseToClass = useCallback((phase) => {
    if (phase === "visible") return "is-visible";
    if (phase === "fading") return "is-fading";
    if (phase === "pre") return "is-pre";
    return "";
  }, []);

  const chartClass = phaseToClass(chartPhase);
  const kpiClass = phaseToClass(kpiPhase);
  const tableClass = phaseToClass(tablePhase);

  const chartOverlayVisible = chartPhase === "loading";
  const kpiOverlayVisible = kpiPhase === "loading";
  const tableOverlayVisible = tablePhase === "loading";

  const hasDashboard = !!dashboard;
  const hasAccount = !!dashboard?.account;
  const hasCharts = !!charts;
  const chartReady = hasAccount && hasCharts;

  const showEmptyTransactionsState = txEmpty && !initialCash;

  const hasTransactionsArray = Array.isArray(transactions);

  const fatal =
    (!hasDashboard && dashboardError) ||
    (!hasCharts && chartsError) ||
    (txError && !hasTransactionsArray);

  useEffect(() => {
    if (!dashboard || !charts || initialCashLoading) {
      setChartPhase("loading");
      return;
    }

    if (!dashboard?.account) {
      setChartPhase("visible");
      return;
    }

    setChartPhase("pre");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setChartPhase("visible"));
    });
  }, [dashboard, charts, initialCashLoading]);

  useEffect(() => {
    if (!dashboard) {
      setKpiPhase("loading");
      return;
    }

    setKpiPhase("pre");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setKpiPhase("visible"));
    });
  }, [dashboard]);

  useEffect(() => {
    if (txLoading || !hasTransactionsArray) {
      setTablePhase("loading");
      return;
    }

    if (txEmpty) {
      setTablePhase("visible");
      return;
    }

    setTablePhase("pre");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTablePhase("visible"));
    });
  }, [txLoading, hasTransactionsArray, txEmpty, transactions]);

  const runRefreshWithFade = useCallback(async () => {
    setChartPhase((p) => (p === "visible" ? "fading" : p));
    setKpiPhase((p) => (p === "visible" ? "fading" : p));
    setTablePhase((p) => (p === "visible" ? "fading" : p));

    await new Promise((r) => setTimeout(r, FADE_MS));

    setChartPhase("loading");
    setKpiPhase("loading");
    setTablePhase("loading");

    await Promise.allSettled([
      refreshDashboard(),
      refreshCharts(),
      refreshTransactions(),
      refreshInitialCash(),
    ]);

    setChartKey((k) => k + 1);
  }, [refreshDashboard, refreshCharts, refreshTransactions, refreshInitialCash]);

  if (fatal) {
    return (
      <Section>
        <EmptyState
          title="Unable to load profile"
          description="Something went wrong while loading your data."
        />
      </Section>
    );
  }

  return (
    <>
      <Modal isOpen={showInitialCashModal} onClose={() => setShowInitialCashModal(false)}>
        <InitialCashEntry
          onSuccess={async () => {
            setShowInitialCashModal(false);
            await runRefreshWithFade();
          }}
          onCancel={() => setShowInitialCashModal(false)}
        />
      </Modal>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}>
        <TransactionEntry
          onSuccess={async () => {
            setShowAdd(false);
            await runRefreshWithFade();
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <TransactionEdit
        transaction={editTransaction}
        isOpen={Boolean(editTransaction)}
        onClose={() => setEditTransaction(null)}
        onSaved={async () => {
          setEditTransaction(null);
          await runRefreshWithFade();
        }}
        onDeleted={async () => {
          setEditTransaction(null);
          await runRefreshWithFade();
        }}
      />

      <Section>
        <div className="dashboard-container">
          <div className="dashboard-grid">
            <div className="dashboard-left">
              <div className="fixed">
                <Card>
                  <div className="profile-chart-shell">
                    {chartReady ? (
                      <div className={`profile-chart-content ${chartClass}`}>
                        {chartPhase === "visible" ? (
                          // <InvestmentChart
                          //   key={chartKey}
                          //   variant="profile"
                          //   dashboard={dashboard}
                          //   charts={charts}
                          // />
                        <InvestmentChart
                          key={chartKey}
                          variant="profile"
                          dashboard={dashboard}
                          charts={charts}
                          curveKey="normalized_equity_curve"
                        />
                        ) : null}
                      </div>
                    ) : (
                      hasDashboard &&
                      hasCharts && (
                        <div className="chart-fallback">
                          {!hasInitialCash ? (
                            <EmptyState
                              title="Get Started"
                              description="Add your initial cash and date to get started."
                              actionLabel="+"
                              onAction={handleInitialCashAdd}
                            />
                          ) : (
                            <EmptyState
                              title="Account Performance"
                              description="Add your first portfolio balance on the Home page to view the chart."
                            />
                          )}
                        </div>
                      )
                    )}

                    {chartOverlayVisible && (
                      <div className="profile-chart-overlay is-visible">
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
                  <div className="profile-kpi-shell">
                    <div className={`profile-kpi-content ${kpiClass}`}>
                      {kpiPhase === "visible" ? (
                        <AccountKpis dashboard={dashboard} />
                      ) : null}
                    </div>

                    {kpiOverlayVisible && (
                      <div className="profile-kpi-overlay is-visible">
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
          <div className="profile-table-shell">
            {showEmptyTransactionsState && !txLoading ? (
              <div className="profile-table-content is-visible">
                <div className="table-wrapper">
                  <div className="table-header">
                    <h3 className="table-title">Transactions Table</h3>
                    <button
                      type="button"
                      className="table-add-btn has-tooltip"
                      onClick={handleAdd}
                      data-tooltip="New Entry"
                    >
                      +
                    </button>
                  </div>

                  <div className="divider" />

                  <div className="table-empty-state">
                    <EmptyState
                      description="Add your first deposit or withdrawal to begin tracking activity."
                      onAction={handleAdd}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className={`profile-table-content ${tableClass}`}>
                <TransactionsTable
                  transactions={transactions || []}
                  initialCash={initialCash}
                  onAdd={handleAdd}
                  onEdit={(tx) => {
                    if (tx?.is_initial_cash) return;
                    if (tx?.__derived) return;
                    setEditTransaction(tx);
                  }}
                />
              </div>
            )}

            {(tableOverlayVisible || txLoading) && (
              <div className="profile-table-overlay is-visible">
                <Spinner />
              </div>
            )}
          </div>
        </Card>
      </Section>
    </>
  );
};

export default Profile;


// // src/pages/Profile/Profile.jsx

// import React, { useCallback, useEffect, useState } from "react";

// import Section from "../../components/layout/Section";
// import Card from "../../components/layout/Card";
// import EmptyState from "../../components/layout/EmptyState";
// import Modal from "../../components/layout/Modal";
// import Spinner from "../../components/layout/Spinner";

// import TransactionsTable from "../../components/transactions/TransactionTable";
// import TransactionEntry from "../../components/transactions/TransactionEntry";
// import TransactionEdit from "../../components/transactions/TransactionEdit";

// import InitialCashEntry from "../../components/portfolio/InitialCashEntry";
// import InvestmentChart from "../../components/charts/InvestmentsChart";
// import AccountKpis from "../../components/analysis/AccountKpis";

// import { useTransactions } from "../../hooks/useTransactions";
// import { useDashboard } from "../../hooks/useDashboard";
// import useCharts from "../../hooks/useCharts";
// import useInitialCash from "../../hooks/useInitialCash";

// const FADE_MS = 220;

// const Profile = () => {
//   const { data: dashboard, error: dashboardError, refreshDashboard } = useDashboard();
//   const { charts, error: chartsError, refreshCharts } = useCharts();

//   const {
//     transactions,
//     loading: txLoading,
//     error: txError,
//     isEmpty: txEmpty,
//     refreshTransactions,
//   } = useTransactions();

//   const {
//     loading: initialCashLoading,
//     hasInitialCash,
//     refreshInitialCash,
//   } = useInitialCash();

//   const [showAdd, setShowAdd] = useState(false);
//   const [showInitialCashModal, setShowInitialCashModal] = useState(false);
//   const [editTransaction, setEditTransaction] = useState(null);
//   const [chartKey, setChartKey] = useState(0);

//   const handleAdd = useCallback(() => setShowAdd(true), []);
//   const handleInitialCashAdd = useCallback(() => setShowInitialCashModal(true), []);

//   const [chartPhase, setChartPhase] = useState("loading");
//   const [kpiPhase, setKpiPhase] = useState("loading");
//   const [tablePhase, setTablePhase] = useState("loading");

//   const phaseToClass = useCallback((phase) => {
//     if (phase === "visible") return "is-visible";
//     if (phase === "fading") return "is-fading";
//     if (phase === "pre") return "is-pre";
//     return "";
//   }, []);

//   const chartClass = phaseToClass(chartPhase);
//   const kpiClass = phaseToClass(kpiPhase);
//   const tableClass = phaseToClass(tablePhase);

//   const chartOverlayVisible = chartPhase === "loading";
//   const kpiOverlayVisible = kpiPhase === "loading";
//   const tableOverlayVisible = tablePhase === "loading";

//   const hasDashboard = !!dashboard;
//   const hasAccount = !!dashboard?.account;
//   const hasCharts = !!charts;
//   const chartReady = hasAccount && hasCharts;

//   const hasTransactionsArray = Array.isArray(transactions);

//   const fatal =
//     (!hasDashboard && dashboardError) ||
//     (!hasCharts && chartsError) ||
//     (txError && !hasTransactionsArray);

//   useEffect(() => {
//     if (!hasDashboard || !hasCharts || initialCashLoading) {
//       setChartPhase("loading");
//       return;
//     }

//     if (!hasAccount) {
//       setChartPhase("visible");
//       return;
//     }

//     setChartPhase("pre");
//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => setChartPhase("visible"));
//     });
//   }, [hasDashboard, hasCharts, hasAccount, initialCashLoading]);

//   useEffect(() => {
//     if (!hasDashboard) {
//       setKpiPhase("loading");
//       return;
//     }

//     setKpiPhase("pre");
//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => setKpiPhase("visible"));
//     });
//   }, [hasDashboard, hasAccount]);

//   useEffect(() => {
//     if (txLoading || !hasTransactionsArray) {
//       setTablePhase("loading");
//       return;
//     }

//     if (txEmpty) {
//       setTablePhase("visible");
//       return;
//     }

//     setTablePhase("pre");
//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => setTablePhase("visible"));
//     });
//   }, [txLoading, hasTransactionsArray, txEmpty]);

//   const runRefreshWithFade = useCallback(async () => {
//     setChartPhase((p) => (p === "visible" ? "fading" : p));
//     setKpiPhase((p) => (p === "visible" ? "fading" : p));
//     setTablePhase((p) => (p === "visible" ? "fading" : p));

//     await new Promise((r) => setTimeout(r, FADE_MS));

//     setChartPhase("loading");
//     setKpiPhase("loading");
//     setTablePhase("loading");

//     await Promise.allSettled([
//       refreshDashboard(),
//       refreshCharts(),
//       refreshTransactions(),
//       refreshInitialCash(),
//     ]);

//     setChartKey((k) => k + 1);
//   }, [refreshDashboard, refreshCharts, refreshTransactions, refreshInitialCash]);

//   if (fatal) {
//     return (
//       <Section>
//         <EmptyState
//           title="Unable to load profile"
//           description="Something went wrong while loading your data."
//         />
//       </Section>
//     );
//   }

//   return (
//     <>
//       <Modal isOpen={showInitialCashModal} onClose={() => setShowInitialCashModal(false)}>
//         <InitialCashEntry
//           onSuccess={async () => {
//             setShowInitialCashModal(false);
//             await runRefreshWithFade();
//           }}
//           onCancel={() => setShowInitialCashModal(false)}
//         />
//       </Modal>

//       <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}>
//         <TransactionEntry
//           onSuccess={async () => {
//             setShowAdd(false);
//             await runRefreshWithFade();
//           }}
//           onCancel={() => setShowAdd(false)}
//         />
//       </Modal>

//       <TransactionEdit
//         transaction={editTransaction}
//         isOpen={Boolean(editTransaction)}
//         onClose={() => setEditTransaction(null)}
//         onSaved={async () => {
//           setEditTransaction(null);
//           await runRefreshWithFade();
//         }}
//         onDeleted={async () => {
//           setEditTransaction(null);
//           await runRefreshWithFade();
//         }}
//       />

//       <Section>
//         <div className="dashboard-container">
//           <div className="dashboard-grid">
//             <div className="dashboard-left">
//               <div className="fixed">
//                 <Card>
//                   <div className="profile-chart-shell">
//                     {chartReady ? (
//                       <div className={`profile-chart-content ${chartClass}`}>
//                         {chartPhase === "visible" ? (
//                           <InvestmentChart
//                             key={chartKey}
//                             variant="profile"
//                             dashboard={dashboard}
//                             charts={charts}
//                           />
//                         ) : null}
//                       </div>
//                     ) : (
//                       hasDashboard &&
//                       hasCharts && (
//                         <div className="chart-fallback">
//                           {!hasInitialCash ? (
//                             <EmptyState
//                               title="Get Started"
//                               description="Add your initial cash and date to get started."
//                               actionLabel="+"
//                               onAction={handleInitialCashAdd}
//                             />
//                           ) : (
//                             <EmptyState
//                               title="Account Performance"
//                               description="Add your first portfolio balance on the Home page to view the chart."
//                             />
//                           )}
//                         </div>
//                       )
//                     )}

//                     {chartOverlayVisible && (
//                       <div className="profile-chart-overlay is-visible">
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
//                   <div className="profile-kpi-shell">
//                     <div className={`profile-kpi-content ${kpiClass}`}>
//                       {kpiPhase === "visible" ? (
//                         <AccountKpis dashboard={dashboard} />
//                       ) : null}
//                     </div>

//                     {kpiOverlayVisible && (
//                       <div className="profile-kpi-overlay is-visible">
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
//           <div className="profile-table-shell">
//             {txEmpty && !txLoading ? (
//               <div className="profile-table-content is-visible">
//                 <div className="table-wrapper">
//                   <div className="table-header">
//                     <h3 className="table-title">Transactions Table</h3>
//                     <button
//                       type="button"
//                       className="table-add-btn has-tooltip"
//                       onClick={handleAdd}
//                       data-tooltip="New Entry"
//                     >
//                       +
//                     </button>
//                   </div>

//                   <div className="divider" />

//                   <div className="table-empty-state">
//                     <EmptyState
//                       description="Add your first deposit or withdrawal to begin tracking activity."
//                       onAction={handleAdd}
//                     />
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div className={`profile-table-content ${tableClass}`}>
//                 <TransactionsTable
//                   transactions={transactions || []}
//                   onAdd={handleAdd}
//                   onEdit={(tx) => {
//                     if (tx?.is_initial_cash) return;
//                     if (tx?.__derived) return;
//                     setEditTransaction(tx);
//                   }}
//                 />
//               </div>
//             )}

//             {(tableOverlayVisible || txLoading) && (
//               <div className="profile-table-overlay is-visible">
//                 <Spinner />
//               </div>
//             )}
//           </div>
//         </Card>
//       </Section>
//     </>
//   );
// };

// export default Profile;

// // import React, { useCallback, useEffect, useState } from "react";

// // import Section from "../../components/layout/Section";
// // import Card from "../../components/layout/Card";
// // import EmptyState from "../../components/layout/EmptyState";
// // import Modal from "../../components/layout/Modal";
// // import Spinner from "../../components/layout/Spinner";

// // import TransactionsTable from "../../components/transactions/TransactionTable";
// // import TransactionEntry from "../../components/transactions/TransactionEntry";
// // import TransactionEdit from "../../components/transactions/TransactionEdit";

// // import InvestmentChart from "../../components/charts/InvestmentsChart";
// // import AccountKpis from "../../components/analysis/AccountKpis";

// // import { useTransactions } from "../../hooks/useTransactions";
// // import { useDashboard } from "../../hooks/useDashboard";
// // import useCharts from "../../hooks/useCharts";

// // const FADE_MS = 220;

// // const Profile = () => {
// //   const { data: dashboard, error: dashboardError, refreshDashboard } = useDashboard();
// //   const { charts, error: chartsError, refreshCharts } = useCharts();

// //   const {
// //     transactions,
// //     loading: txLoading,
// //     error: txError,
// //     isEmpty: txEmpty,
// //     refreshTransactions,
// //   } = useTransactions();

// //   const [showAdd, setShowAdd] = useState(false);
// //   const [editTransaction, setEditTransaction] = useState(null);
// //   const [chartKey, setChartKey] = useState(0);

// //   const handleAdd = useCallback(() => setShowAdd(true), []);

// //   const [chartPhase, setChartPhase] = useState("loading");
// //   const [kpiPhase, setKpiPhase] = useState("loading");
// //   const [tablePhase, setTablePhase] = useState("loading");

// //   const phaseToClass = useCallback((phase) => {
// //     if (phase === "visible") return "is-visible";
// //     if (phase === "fading") return "is-fading";
// //     if (phase === "pre") return "is-pre";
// //     return "";
// //   }, []);

// //   const chartClass = phaseToClass(chartPhase);
// //   const kpiClass = phaseToClass(kpiPhase);
// //   const tableClass = phaseToClass(tablePhase);

// //   const chartOverlayVisible = chartPhase === "loading";
// //   const kpiOverlayVisible = kpiPhase === "loading";
// //   const tableOverlayVisible = tablePhase === "loading";

// //   const hasDashboard = !!dashboard;
// //   const hasAccount = !!dashboard?.account;
// //   const hasCharts = !!charts;
// //   const chartReady = hasAccount && hasCharts;

// //   const hasTransactionsArray = Array.isArray(transactions);

// //   const fatal =
// //     (!hasDashboard && dashboardError) ||
// //     (!hasCharts && chartsError) ||
// //     (txError && !hasTransactionsArray);

// //   useEffect(() => {
// //     if (!hasDashboard || !hasCharts) {
// //       setChartPhase("loading");
// //       return;
// //     }

// //     if (!hasAccount) {
// //       setChartPhase("visible");
// //       return;
// //     }

// //     setChartPhase("pre");
// //     requestAnimationFrame(() => {
// //       requestAnimationFrame(() => setChartPhase("visible"));
// //     });
// //   }, [hasDashboard, hasCharts, hasAccount]);

// //   useEffect(() => {
// //     if (!hasDashboard) {
// //       setKpiPhase("loading");
// //       return;
// //     }

// //     setKpiPhase("pre");
// //     requestAnimationFrame(() => {
// //       requestAnimationFrame(() => setKpiPhase("visible"));
// //     });
// //   }, [hasDashboard, hasAccount]);

// //   useEffect(() => {
// //     if (txLoading || !hasTransactionsArray) {
// //       setTablePhase("loading");
// //       return;
// //     }

// //     if (txEmpty) {
// //       setTablePhase("visible");
// //       return;
// //     }

// //     setTablePhase("pre");
// //     requestAnimationFrame(() => {
// //       requestAnimationFrame(() => setTablePhase("visible"));
// //     });
// //   }, [txLoading, hasTransactionsArray, txEmpty]);

// //   const runRefreshWithFade = useCallback(async () => {
// //     setChartPhase((p) => (p === "visible" ? "fading" : p));
// //     setKpiPhase((p) => (p === "visible" ? "fading" : p));
// //     setTablePhase((p) => (p === "visible" ? "fading" : p));

// //     await new Promise((r) => setTimeout(r, FADE_MS));

// //     setChartPhase("loading");
// //     setKpiPhase("loading");
// //     setTablePhase("loading");

// //     await Promise.allSettled([
// //       refreshDashboard(),
// //       refreshCharts(),
// //       refreshTransactions(),
// //     ]);

// //     setChartKey((k) => k + 1);
// //   }, [refreshDashboard, refreshCharts, refreshTransactions]);

// //   if (fatal) {
// //     return (
// //       <Section>
// //         <EmptyState
// //           title="Unable to load profile"
// //           description="Something went wrong while loading your data."
// //         />
// //       </Section>
// //     );
// //   }

// //   return (
// //     <>
// //       <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}>
// //         <TransactionEntry
// //           onSuccess={async () => {
// //             setShowAdd(false);
// //             await runRefreshWithFade();
// //           }}
// //           onCancel={() => setShowAdd(false)}
// //         />
// //       </Modal>

// //       <TransactionEdit
// //         transaction={editTransaction}
// //         isOpen={Boolean(editTransaction)}
// //         onClose={() => setEditTransaction(null)}
// //         onSaved={async () => {
// //           setEditTransaction(null);
// //           await runRefreshWithFade();
// //         }}
// //         onDeleted={async () => {
// //           setEditTransaction(null);
// //           await runRefreshWithFade();
// //         }}
// //       />

// //       <Section>
// //         <div className="dashboard-container">
// //           <div className="dashboard-grid">
// //             <div className="dashboard-left">
// //               <div className="fixed">
// //                 <Card>
// //                   <div className="profile-chart-shell">
// //                     {chartReady ? (
// //                       <div className={`profile-chart-content ${chartClass}`}>
// //                         {chartPhase === "visible" ? (
// //                           <InvestmentChart
// //                             key={chartKey}
// //                             variant="profile"
// //                             dashboard={dashboard}
// //                             charts={charts}
// //                           />
// //                         ) : null}
// //                       </div>
// //                     ) : (
// //                       hasDashboard &&
// //                       hasCharts && (
// //                         <div className="chart-fallback">
// //                           <EmptyState
// //                             title="Account performance"
// //                             description="Add your first deposit or withdrawal to view the chart."
// //                             actionLabel="+"
// //                             onAction={handleAdd}
// //                           />
// //                         </div>
// //                       )
// //                     )}

// //                     {chartOverlayVisible && (
// //                       <div className="profile-chart-overlay is-visible">
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
// //                   <div className="profile-kpi-shell">
// //                     <div className={`profile-kpi-content ${kpiClass}`}>
// //                       {kpiPhase === "visible" ? (
// //                         <AccountKpis dashboard={dashboard} />
// //                       ) : null}
// //                     </div>

// //                     {kpiOverlayVisible && (
// //                       <div className="profile-kpi-overlay is-visible">
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
// //           <div className="profile-table-shell">
// //             {txEmpty && !txLoading ? (
// //               <div className="profile-table-content is-visible">
// //                 <div className="table-wrapper">
// //                   <div className="table-header">
// //                     <h3 className="table-title">Transactions Table</h3>
// //                     <button
// //                       type="button"
// //                       className="table-add-btn has-tooltip"
// //                       onClick={handleAdd}
// //                       data-tooltip="New Entry"
// //                     >
// //                       +
// //                     </button>
// //                   </div>

// //                   <div className="divider" />

// //                   <div className="table-empty-state">
// //                     <EmptyState
// //                       description="Add your first deposit or withdrawal to begin tracking activity."
// //                       // actionLabel="+"
// //                       onAction={handleAdd}
// //                     />
// //                   </div>
// //                 </div>
// //               </div>
// //             ) : (
// //               <div className={`profile-table-content ${tableClass}`}>
// //                 <TransactionsTable
// //                   transactions={transactions || []}
// //                   onAdd={handleAdd}
// //                   onEdit={(tx) => {
// //                     if (tx?.is_initial_cash) return;
// //                     if (tx?.__derived) return;
// //                     setEditTransaction(tx);
// //                   }}
// //                 />
// //               </div>
// //             )}

// //             {(tableOverlayVisible || txLoading) && (
// //               <div className="profile-table-overlay is-visible">
// //                 <Spinner />
// //               </div>
// //             )}
// //           </div>
// //         </Card>
// //       </Section>
// //     </>
// //   );
// // };

// // export default Profile;
