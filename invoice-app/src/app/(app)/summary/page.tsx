"use client";
import { useState, useEffect } from "react";

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

export default function SummaryPage() {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = selectedMonth ? `/api/summary?month=${selectedMonth}` : "/api/summary";
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("API Error");
        return res.json();
      })
      .then(data => {
        setRows(data.summaryRows || []);
        setMonths(data.availableMonths || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Summary Fetch Error:", err);
        setLoading(false);
      });
  }, [selectedMonth]);

  const handleExport = () => {
    window.open("/api/summary?export=xlsx", "_blank");
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Monthly Summary Report</h1>
        <p className="page-sub">Comprehensive view of your spending aggregated by month and vendor.</p>
      </header>

      <div className="summary-filters">
        <button 
          className={`filter-chip ${selectedMonth === null ? "on" : ""}`}
          onClick={() => setSelectedMonth(null)}
        >
          All Time
        </button>
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
              <tr><td colSpan={8} className="empty-state">Loading records...</td></tr>
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
                  <td>${row.total_price.toFixed(2)}</td>
                  <td>${row.discount.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="export-row">
        <button className="btn-secondary" onClick={handleExport}>⬇ Download as XLSX</button>
      </div>
    </div>
  );
}
