"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface SummaryRow {
  month: string;
  vendor_name: string;
  sub_total: number;
  tps: number;
  tvq: number;
  tax: number;
  total_price: number;
  discount: number;
  isTotal?: boolean;
}

interface SummaryStats {
  totalInvoices: number;
  totalSpend: number;
  totalTax: number;
}

export default function SummaryPage() {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [stats, setStats] = useState<SummaryStats>({ totalInvoices: 0, totalSpend: 0, totalTax: 0 });

  useEffect(() => {
    setLoading(true);
    setDbError(false);
    const url = selectedMonth ? `/api/summary?month=${selectedMonth}` : "/api/summary";
    fetch(url)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.error === "db_error") { setDbError(true); setLoading(false); return; }
        const summaryRows: SummaryRow[] = data.summaryRows || [];
        setRows(summaryRows);
        setMonths(data.availableMonths || []);

        // Compute stats from non-total rows
        const dataRows = summaryRows.filter(r => !r.isTotal);
        setStats({
          totalInvoices: dataRows.length,
          totalSpend: dataRows.reduce((s, r) => s + r.total_price, 0),
          totalTax: dataRows.reduce((s, r) => s + r.tax, 0),
        });
        setLoading(false);
      })
      .catch(() => { setDbError(true); setLoading(false); });
  }, [selectedMonth]);

  const handleExport = () => {
    const url = selectedMonth ? `/api/summary?export=xlsx&month=${selectedMonth}` : "/api/summary?export=xlsx";
    window.open(url, "_blank");
  };

  return (
    <div>
      <header className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="page-title">Monthly Summary Report</h1>
            <p className="page-sub">Comprehensive view of your spending aggregated by month and vendor.</p>
          </div>
          <button className="btn-accent" onClick={handleExport}>⬇ Export to Excel</button>
        </div>
      </header>

      {dbError && (
        <motion.div className="db-error-banner" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="db-error-icon">⚠️</div>
          <div>
            <div className="db-error-title">Database connection error</div>
            <div className="db-error-sub">Could not load summary data. Please check your connection.</div>
          </div>
        </motion.div>
      )}

      {!loading && !dbError && (
        <>
          {/* Summary Stat Cards */}
          <div className="stat-grid summary-stat-grid" style={{ marginBottom: "1.5rem" }}>
            {[
              { label: "Invoice Rows", value: stats.totalInvoices, icon: "📄" },
              { label: "Total Spend", value: `$${stats.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: "💰" },
              { label: "Total Tax", value: `$${stats.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: "🧾" },
            ].map((card, i) => (
              <motion.div key={card.label} className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-icon-badge">{card.icon}</div>
                </div>
                <div className="stat-value">{card.value}</div>
                {selectedMonth && <div className="stat-delta">{new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>}
              </motion.div>
            ))}
          </div>

          {/* Month Filter Chips */}
          <div className="summary-filters">
            <button className={`filter-chip ${selectedMonth === null ? "on" : ""}`} onClick={() => setSelectedMonth(null)}>All Time</button>
            {months.map(m => (
              <button
                key={m}
                className={`filter-chip ${selectedMonth === m ? "on" : ""}`}
                onClick={() => setSelectedMonth(m)}
              >
                {new Date(m + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Table — desktop only */}
      <div className="desktop-only">
        <div className="summary-table-wrap">
          <table className="s-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Vendor</th>
                <th>Sub-total</th>
                <th>TPS</th>
                <th>TVQ</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Discount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="empty-state">Loading records…</td></tr>
              ) : dbError ? (
                <tr><td colSpan={8} className="empty-state">⚠️ Could not load data.</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="empty-state">No records found.</td></tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} className={row.isTotal ? "total-row" : ""}>
                    <td>{row.month}</td>
                    <td>{row.vendor_name}</td>
                    <td>${row.sub_total.toFixed(2)}</td>
                    <td>${row.tps.toFixed(2)}</td>
                    <td>${row.tvq.toFixed(2)}</td>
                    <td>${row.tax.toFixed(2)}</td>
                    <td><strong>${row.total_price.toFixed(2)}</strong></td>
                    <td>${row.discount.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list */}
      {!loading && !dbError && rows.length > 0 && (
        <div className="mobile-only">
          <div className="inv-card-list">
            {rows.map((row, i) => (
              <div key={i} className={`inv-card ${row.isTotal ? "inv-card-total-row" : ""}`}>
                <div className="inv-card-header">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: row.isTotal ? "var(--accent)" : "var(--ink)" }}>
                      {row.vendor_name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{row.month}</div>
                  </div>
                  <div className="inv-card-total">${row.total_price.toFixed(2)}</div>
                </div>
                <div className="inv-card-fields">
                  <div className="inv-field"><span>Sub-total</span><span>${row.sub_total.toFixed(2)}</span></div>
                  <div className="inv-field"><span>TPS</span><span>${row.tps.toFixed(2)}</span></div>
                  <div className="inv-field"><span>TVQ</span><span>${row.tvq.toFixed(2)}</span></div>
                  <div className="inv-field"><span>Tax</span><span>${row.tax.toFixed(2)}</span></div>
                  <div className="inv-field"><span>Discount</span><span>${row.discount.toFixed(2)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !dbError && (
        <div className="export-row" style={{ marginTop: "1rem" }}>
          <button className="btn-secondary" onClick={handleExport}>⬇ Download as XLSX</button>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
            {selectedMonth ? `Filtered: ${new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}` : "All time data"}
          </span>
        </div>
      )}
    </div>
  );
}

