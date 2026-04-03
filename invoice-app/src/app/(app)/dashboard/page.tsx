"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Invoice {
  id: string;
  vendor: string;
  invoiceNumber: string;
  date: string;
  total: number;
}

interface DashboardData {
  stats: {
    totalInvoices: number;
    totalSpend: number;
    totalTax: number;
    avgDiscount: string;
  };
  recentInvoices: Invoice[];
  topVendors: {
    name: string;
    totalSpend: number;
    barPercent: number;
  }[];
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal state
  const [editTarget, setEditTarget] = useState<Invoice | null>(null);
  const [editForm, setEditForm] = useState({ vendor: "", invoiceNumber: "", date: "", total: "" });
  const [saving, setSaving] = useState(false);

  const pushToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setDbError(false);
    try {
      const res = await fetch("/api/dashboard");
      const d = await res.json();
      if (!res.ok || d.error === "db_error") {
        setDbError(true);
        setLoading(false);
        return;
      }
      if (!d.stats) throw new Error("Invalid structure");
      setData(d);
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/invoice/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteTarget(null);
    if (res.ok) {
      setData((prev) => prev ? {
        ...prev,
        recentInvoices: prev.recentInvoices.filter((inv) => inv.id !== deleteTarget.id),
        stats: { ...prev.stats, totalInvoices: prev.stats.totalInvoices - 1, totalSpend: prev.stats.totalSpend - deleteTarget.total },
      } : prev);
      pushToast("Invoice deleted successfully");
    } else {
      pushToast("Failed to delete invoice", "error");
    }
  };

  const openEdit = (inv: Invoice) => {
    setEditTarget(inv);
    setEditForm({ vendor: inv.vendor, invoiceNumber: inv.invoiceNumber, date: inv.date, total: String(inv.total) });
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    const res = await fetch(`/api/invoice/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_name: editForm.vendor,
        invoice_number: editForm.invoiceNumber,
        invoice_date: editForm.date,
        total_price: Number(editForm.total),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setData((prev) => prev ? {
        ...prev,
        recentInvoices: prev.recentInvoices.map((inv) =>
          inv.id === editTarget.id
            ? { ...inv, vendor: editForm.vendor, invoiceNumber: editForm.invoiceNumber, date: editForm.date, total: Number(editForm.total) }
            : inv
        ),
      } : prev);
      pushToast("Invoice updated successfully");
      setEditTarget(null);
    } else {
      pushToast("Failed to update invoice", "error");
    }
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      {/* Toast Notifications */}
      <div className="toast-stack">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`toast ${t.type}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              style={{ position: "static", marginBottom: 8 }}
            >
              {t.type === "success" ? "✓" : "✕"} {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <header className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="page-sub">{today}</div>
            <h1 className="page-title">
              Good morning, <span style={{ color: "var(--accent)" }}>{session?.user?.name || "User"}</span>
            </h1>
          </div>
          <Link href="/upload" className="btn-accent">
            + Upload Invoice
          </Link>
        </div>
      </header>

      {loading && (
        <div className="loading-shimmer-grid">
          {[1,2,3,4].map(i => <div key={i} className="shimmer-card" />)}
        </div>
      )}

      {!loading && dbError && (
        <motion.div className="db-error-banner" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="db-error-icon">⚠️</div>
          <div>
            <div className="db-error-title">Database connection error</div>
            <div className="db-error-sub">Could not load your invoices. Please check your connection or try again.</div>
          </div>
          <button className="btn-secondary" onClick={fetchDashboard} style={{ marginLeft: "auto", flexShrink: 0 }}>Retry</button>
        </motion.div>
      )}

      {!loading && !dbError && data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <div className="stat-grid">
            {[
              { label: "Total Invoices", value: data.stats.totalInvoices, delta: `${data.recentInvoices.length} recent`, icon: "📄" },
              { label: "Total Spend", value: `$${(data.stats.totalSpend / 1000).toFixed(1)}k`, delta: "across all vendors", icon: "💰" },
              { label: "Tax Total", value: `$${(data.stats.totalTax / 1000).toFixed(1)}k`, delta: "TPS + TVQ computed", icon: "🧾" },
              { label: "Avg Discount", value: data.stats.avgDiscount, delta: "saved on purchases", icon: "🏷️" },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                className="stat-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-icon-badge">{card.icon}</div>
                </div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-delta">↑ {card.delta}</div>
              </motion.div>
            ))}
          </div>

          <div className="activity-row">
            <div className="card">
              <div className="panel-head">
                <h2 className="panel-title">Recent Invoices</h2>
                <Link href="/invoices" className="panel-action">View all →</Link>
              </div>
              {data.recentInvoices.length === 0 ? (
                <div className="empty-state" style={{ padding: "2rem 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  No invoices yet. Upload your first one!
                </div>
              ) : (
                data.recentInvoices.map((inv, i) => (
                  <motion.div
                    key={inv.id}
                    className="invoice-row"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="invoice-meta" style={{ minWidth: 0, flex: 1 }}>
                      <div className="invoice-icon" style={{ flexShrink: 0 }}>📄</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="invoice-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.vendor}</div>
                        <div className="invoice-date">{inv.date} · #{inv.invoiceNumber}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div className="invoice-amount">${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="invoice-status s-processed">● Processed</div>
                      </div>
                      <div className="invoice-actions">
                        <button className="icon-btn edit-btn" title="Edit invoice" onClick={() => openEdit(inv)}>✏️</button>
                        <button className="icon-btn delete-btn" title="Delete invoice" onClick={() => setDeleteTarget(inv)}>🗑️</button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="card">
              <div className="panel-head">
                <h2 className="panel-title">Top Vendors</h2>
              </div>
              {data.topVendors.length === 0 ? (
                <div className="empty-state" style={{ padding: "2rem 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                  Upload invoices to see stats.
                </div>
              ) : (
                data.topVendors.map((vendor, i) => (
                  <div key={vendor.name} className="vendor-item">
                    <div className="vendor-avatar" style={{
                      background: i === 0 ? "var(--accent-dim)" : i === 1 ? "var(--green-dim)" : "var(--amber-dim)",
                      color: i === 0 ? "var(--accent)" : i === 1 ? "var(--green)" : "var(--amber)"
                    }}>
                      {vendor.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="vendor-name-text">{vendor.name}</div>
                    <div className="vendor-bar-wrap">
                      <div className="vendor-bar" style={{
                        width: `${vendor.barPercent}%`,
                        background: i === 0 ? "var(--accent)" : i === 1 ? "var(--green)" : "var(--amber)"
                      }} />
                    </div>
                    <div className="vendor-amt">${(vendor.totalSpend / 1000).toFixed(1)}k</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)}>
            <motion.div className="modal-box" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-icon">🗑️</div>
              <h2 className="modal-title">Delete Invoice?</h2>
              <p className="modal-sub">
                Are you sure you want to delete the invoice from <strong>{deleteTarget.vendor}</strong>?
                This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
                <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting…" : "Delete Invoice"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Invoice Modal ── */}
      <AnimatePresence>
        {editTarget && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditTarget(null)}>
            <motion.div className="modal-box" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-icon">✏️</div>
              <h2 className="modal-title">Edit Invoice</h2>
              <p className="modal-sub">Correct any field that was mis-read by OCR.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label className="field-label">Vendor Name</label>
                  <input className="field-input" value={editForm.vendor} onChange={e => setEditForm(f => ({...f, vendor: e.target.value}))} />
                </div>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label className="field-label">Invoice Number</label>
                  <input className="field-input" value={editForm.invoiceNumber} onChange={e => setEditForm(f => ({...f, invoiceNumber: e.target.value}))} />
                </div>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label className="field-label">Date</label>
                  <input className="field-input" value={editForm.date} onChange={e => setEditForm(f => ({...f, date: e.target.value}))} placeholder="MM/DD/YYYY" />
                </div>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label className="field-label">Total Price ($)</label>
                  <input className="field-input" type="number" step="0.01" value={editForm.total} onChange={e => setEditForm(f => ({...f, total: e.target.value}))} />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setEditTarget(null)} disabled={saving}>Cancel</button>
                <button className="btn-primary" onClick={handleEdit} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
