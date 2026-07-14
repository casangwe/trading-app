// src/pages/NetWorth/NetWorth.jsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";

import Section from "../../components/layout/Section";
import Card from "../../components/layout/Card";
import EmptyState from "../../components/layout/EmptyState";
import Modal from "../../components/layout/Modal";
import Spinner from "../../components/layout/Spinner";

import FinancialTable from "../../components/financials/FinancialTable";
import NewFinancialEntry from "../../components/financials/FinancialEntry";
import EditFinancialModal from "../../components/financials/FinancialEdit";

import NetWorthChart from "../../components/charts/NetWorthChart";
import NetWorthSummary from "../../components/networth/NetWorthSummary";

import { getFinancials } from "../../api/financial.api";

const FADE_MS = 220;
const MIN_READY_DELAY_MS = 500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const NetWorth = () => {
  const [financials, setFinancials] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // phases: "loading" | "pre" | "visible" | "fading"
  const [chartPhase, setChartPhase] = useState("loading");
  const [summaryPhase, setSummaryPhase] = useState("loading");
  const [tablePhase, setTablePhase] = useState("loading");

  const [chartKey, setChartKey] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  const loadTokenRef = useRef(0);

  const hasFinancialsArray = Array.isArray(financials);
  const hasRows = hasFinancialsArray && financials.length > 0;
  const fatal = Boolean(error && !hasFinancialsArray);

  const errorText = useMemo(() => {
    if (!error) return "";
    return String(error?.message || error || "Something went wrong.");
  }, [error]);

  const phaseToClass = useCallback((phase) => {
    if (phase === "visible") return "is-visible";
    if (phase === "fading") return "is-fading";
    if (phase === "pre") return "is-pre";
    return "";
  }, []);

  const chartClass = phaseToClass(chartPhase);
  const summaryClass = phaseToClass(summaryPhase);
  const tableClass = phaseToClass(tablePhase);

  const chartOverlayVisible = chartPhase === "loading";
  const summaryOverlayVisible = summaryPhase === "loading";
  const tableOverlayVisible = tablePhase === "loading";

  const fetchFinancials = useCallback(async () => {
    const myToken = ++loadTokenRef.current;
    const startedAt = Date.now();

    setError(null);
    setLoading(true);

    try {
      const data = await getFinancials();
      if (loadTokenRef.current !== myToken) return;
      setFinancials(Array.isArray(data) ? data : []);
    } catch (e) {
      if (loadTokenRef.current !== myToken) return;
      setError(e);
      setFinancials([]);
    }

    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, MIN_READY_DELAY_MS - elapsed);
    if (remaining) await sleep(remaining);

    if (loadTokenRef.current !== myToken) return;
    setLoading(false);
  }, []);

  useEffect(() => {
    setChartPhase("loading");
    setSummaryPhase("loading");
    setTablePhase("loading");
    fetchFinancials();
  }, [fetchFinancials]);

  useEffect(() => {
    if (loading) {
      setChartPhase("loading");
      return;
    }

    if (!hasRows) {
      setChartPhase("visible");
      return;
    }

    setChartPhase("pre");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setChartPhase("visible"));
    });
  }, [loading, hasRows]);

  useEffect(() => {
    if (loading) {
      setSummaryPhase("loading");
      return;
    }

    setSummaryPhase("pre");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSummaryPhase("visible"));
    });
  }, [loading, hasRows]);

  useEffect(() => {
    if (loading) {
      setTablePhase("loading");
      return;
    }

    setTablePhase("pre");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTablePhase("visible"));
    });
  }, [loading, hasRows]);

  const runRefreshWithFade = useCallback(async () => {
    setChartPhase((p) => (p === "visible" ? "fading" : p));
    setSummaryPhase((p) => (p === "visible" ? "fading" : p));
    setTablePhase((p) => (p === "visible" ? "fading" : p));

    await sleep(FADE_MS);

    setChartPhase("loading");
    setSummaryPhase("loading");
    setTablePhase("loading");

    await fetchFinancials();

    setChartKey((k) => k + 1);
  }, [fetchFinancials]);

  if (fatal) {
    return (
      <Section>
        <EmptyState title="Unable to load net worth" description="Something went wrong." />
      </Section>
    );
  }

  return (
    <>
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}>
        <NewFinancialEntry
          onSuccess={async () => {
            setShowAdd(false);
            await runRefreshWithFade();
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <EditFinancialModal
        entry={editEntry}
        isOpen={Boolean(editEntry)}
        onClose={() => setEditEntry(null)}
        onSaved={async () => {
          setEditEntry(null);
          await runRefreshWithFade();
        }}
        onDeleted={async () => {
          setEditEntry(null);
          await runRefreshWithFade();
        }}
      />

      {/* Top row: Chart + Summary */}
      <Section>
        <div className="dashboard-container">
          <div className="dashboard-grid">
            {/* Left: Net Worth Chart */}
            <div className="dashboard-left">
              <div className="fixed">
                <Card>
                  <div className="networth-chart-shell">
                    {hasRows ? (
                      <div className={`networth-chart-content ${chartClass}`}>
                        <NetWorthChart key={chartKey} entries={financials} />
                      </div>
                    ) : (
                      !loading && (
                        <div className="networth-chart-fallback">
                          <EmptyState
                            title="Net worth"
                            description="Add your first net worth entry to view allocation and notes."
                            actionLabel="+"
                            onAction={() => setShowAdd(true)}
                          />
                        </div>
                      )
                    )}

                    {(chartOverlayVisible || loading) && (
                      <div className="networth-chart-overlay is-visible">
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
                  <div className="networth-summary-shell">
                    <div className={`networth-summary-content ${summaryClass}`}>
                      <NetWorthSummary
                        entries={financials || []}
                        onAdd={() => setShowAdd(true)}
                        onEdit={(entry) => {
                          if (entry) setEditEntry(entry);
                          else setShowAdd(true);
                        }}
                      />
                    </div>

                    {(summaryOverlayVisible || loading) && (
                      <div className="networth-summary-overlay is-visible">
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

      {/* Table */}
      <Section>
        <Card>
          <div className="networth-table-shell">
            <div className={`networth-table-content ${tableClass}`}>
              <FinancialTable
                entries={financials || []}
                onAdd={() => setShowAdd(true)}
                onEdit={setEditEntry}
              />
            </div>

            {(tableOverlayVisible || loading) && (
              <div className="networth-table-overlay is-visible">
                <Spinner />
              </div>
            )}
          </div>
        </Card>

        {error && !loading && (
          <div className="card-error" style={{ marginTop: 12 }}>
            {errorText}
          </div>
        )}
      </Section>
    </>
  );
};

export default NetWorth;


