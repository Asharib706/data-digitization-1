"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface DashboardData {
  stats: {
    totalInvoices: number;
    totalSpend: number;
    totalTax: number;
    avgDiscount: string;
  };
  recentInvoices: {
    id: string;
    vendor: string;
    invoiceNumber: string;
    date: string;
    total: number;
  }[];
  topVendors: {
    name: string;
    totalSpend: number;
    barPercent: number;
  }[];
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (res) => {
        if (!res.ok) throw new Error("API Error");
        return res.json();
      })
      .then((d) => {
        if (!d.stats) throw new Error("Invalid structure");
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard Fetch Error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="empty-state">Loading workspace...</div>;
  if (!data || !data.stats) return <div className="empty-state">Failed to load dashboard. Please refresh or check connection.</div>;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      <header className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="page-sub">{today}</div>
            <h1 className="page-title">
              Good morning, <span>{session?.user?.name || "User"}</span>
            </h1>
          </div>
          <Link href="/upload" className="btn-accent">
            + Upload Invoice
          </Link>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Invoices</div>
          <div className="stat-value">{data.stats.totalInvoices}</div>
          <div className="stat-delta">↑ {data.recentInvoices.length} recent</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Spend</div>
          <div className="stat-value">${(data.stats.totalSpend / 1000).toFixed(1)}k</div>
          <div className="stat-delta">across all vendors</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tax Total</div>
          <div className="stat-value">${(data.stats.totalTax / 1000).toFixed(1)}k</div>
          <div className="stat-delta">TPS + TVQ computed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Discount</div>
          <div className="stat-value">{data.stats.avgDiscount}</div>
          <div className="stat-delta">saved on purchases</div>
        </div>
      </div>

      <div className="activity-row">
        <div className="card">
          <div className="panel-head">
            <h2 className="panel-title">Recent Invoices</h2>
            <Link href="/summary" className="panel-action">
              View all →
            </Link>
          </div>
          {data.recentInvoices.length === 0 ? (
            <div className="empty-state" style={{ padding: "1rem 0" }}>No invoices found.</div>
          ) : (
            data.recentInvoices.map((inv) => (
              <div key={inv.id} className="invoice-row">
                <div className="invoice-meta">
                  <div className="invoice-icon">📄</div>
                  <div>
                    <div className="invoice-name">{inv.vendor}</div>
                    <div className="invoice-date">
                      {inv.date} · #{inv.invoiceNumber}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="invoice-amount">
                    ${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="invoice-status s-processed">● Processed</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="panel-head">
            <h2 className="panel-title">Top Vendors</h2>
          </div>
          {data.topVendors.length === 0 ? (
            <div className="empty-state" style={{ padding: "1rem 0" }}>Upload invoices to see stats.</div>
          ) : (
            data.topVendors.map((vendor, i) => (
              <div key={vendor.name} className="vendor-item">
                <div 
                  className="vendor-avatar" 
                  style={{ 
                    background: i === 0 ? "var(--accent-dim)" : i === 1 ? "var(--green-dim)" : "var(--amber-dim)",
                    color: i === 0 ? "var(--accent)" : i === 1 ? "var(--green)" : "var(--amber)"
                  }}
                >
                  {vendor.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="vendor-name-text">{vendor.name}</div>
                <div className="vendor-bar-wrap">
                  <div 
                    className="vendor-bar" 
                    style={{ 
                      width: `${vendor.barPercent}%`,
                      background: i === 0 ? "var(--accent)" : i === 1 ? "var(--green)" : "var(--amber)"
                    }} 
                  />
                </div>
                <div className="vendor-amt">${(vendor.totalSpend / 1000).toFixed(1)}k</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
