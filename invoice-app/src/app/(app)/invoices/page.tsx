"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Invoice {
  id: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  sub_total: number;
  tps: number;
  tvq: number;
  tax: number;
  total_price: number;
  discount: number;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

const EMPTY_FORM = {
  vendor_name: "", invoice_number: "", invoice_date: "",
  sub_total: "", tps: "", tvq: "", tax: "", total_price: "", discount: "",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Invoice | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const pushToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };

  const fetchInvoices = useCallback(async (q: string, s: string) => {
    setLoading(true);
    setDbError(false);
    try {
      const params = new URLSearchParams({ sort: s });
      if (q) params.set("search", q);
      const res = await fetch(`/api/invoice/all?${params}`);
      const data = await res.json();
      if (!res.ok || data.error === "db_error") { setDbError(true); setLoading(false); return; }
      setInvoices(data.invoices || []);
      setTotal(data.total || 0);
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(search, sort); }, [sort, fetchInvoices]); // eslint-disable-line

  const onSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchInvoices(val, sort), 400);
  };

  const openEdit = (inv: Invoice) => {
    setEditTarget(inv);
    setEditForm({
      vendor_name: inv.vendor_name,
      invoice_number: inv.invoice_number,
      invoice_date: inv.invoice_date,
      sub_total: String(inv.sub_total),
      tps: String(inv.tps),
      tvq: String(inv.tvq),
      tax: String(inv.tax),
      total_price: String(inv.total_price),
      discount: String(inv.discount),
    });
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    const res = await fetch(`/api/invoice/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_name: editForm.vendor_name,
        invoice_number: editForm.invoice_number,
        invoice_date: editForm.invoice_date,
        sub_total: Number(editForm.sub_total),
        tps: Number(editForm.tps),
        tvq: Number(editForm.tvq),
        tax: Number(editForm.tax),
        total_price: Number(editForm.total_price),
        discount: Number(editForm.discount),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setInvoices((prev) => prev.map((inv) =>
        inv.id === editTarget.id ? {
          ...inv,
          vendor_name: editForm.vendor_name,
          invoice_number: editForm.invoice_number,
          invoice_date: editForm.invoice_date,
          sub_total: Number(editForm.sub_total),
          tps: Number(editForm.tps),
          tvq: Number(editForm.tvq),
          tax: Number(editForm.tax),
          total_price: Number(editForm.total_price),
          discount: Number(editForm.discount),
        } : inv
      ));
      pushToast("Invoice updated successfully");
      setEditTarget(null);
    } else {
      pushToast("Failed to update invoice", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/invoice/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setInvoices((prev) => prev.filter((inv) => inv.id !== deleteTarget.id));
      setTotal((t) => t - 1);
      pushToast("Invoice deleted successfully");
      setDeleteTarget(null);
    } else {
      pushToast("Failed to delete invoice", "error");
    }
  };

  const fmtAmount = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div>
      {/* Toast Stack */}
      <div className="toast-stack">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} className={`toast ${t.type}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ position: "static", marginBottom: 8 }}
            >
              {t.type === "success" ? "✓" : "✕"} {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Page Header */}
      <header className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="page-title">All Invoices</h1>
            <p className="page-sub">
              {loading ? "Loading…" : `${total} invoice${total !== 1 ? "s" : ""} in your account`}
            </p>
          </div>
        </div>
      </header>

      {/* Search & Sort Bar */}
      <div className="inv-toolbar">
        <div className="inv-search-wrap">
          <span className="inv-search-icon">🔍</span>
          <input
            className="inv-search-input"
            placeholder="Search vendor or invoice number…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button className="inv-clear-btn" onClick={() => { setSearch(""); fetchInvoices("", sort); }}>✕</button>
          )}
        </div>
        <select className="inv-sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="amount_desc">Highest amount</option>
          <option value="amount_asc">Lowest amount</option>
        </select>
      </div>

      {/* DB Error */}
      {dbError && (
        <motion.div className="db-error-banner" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="db-error-icon">⚠️</div>
          <div>
            <div className="db-error-title">Database connection error</div>
            <div className="db-error-sub">Could not load invoices. Please check your connection.</div>
          </div>
          <button className="btn-secondary" onClick={() => fetchInvoices(search, sort)} style={{ marginLeft: "auto", flexShrink: 0 }}>Retry</button>
        </motion.div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="inv-card-list">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="inv-skeleton" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !dbError && invoices.length === 0 && (
        <div className="empty-state" style={{ marginTop: "3rem" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          {search ? `No invoices match "${search}"` : "No invoices yet. Upload your first one!"}
        </div>
      )}

      {/* ── DESKTOP: Table ── */}
      {!loading && !dbError && invoices.length > 0 && (
        <>
          <div className="inv-table-wrap desktop-only">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Vendor</th>
                  <th>Invoice No.</th>
                  <th>Date</th>
                  <th>Sub-total</th>
                  <th>TPS</th>
                  <th>TVQ</th>
                  <th>Tax</th>
                  <th>Discount</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="inv-table-row"
                  >
                    <td className="inv-num-cell">{i + 1}</td>
                    <td>
                      <div className="inv-vendor-cell">
                        <div className="inv-vendor-avatar">{(inv.vendor_name || "?").substring(0, 2).toUpperCase()}</div>
                        <span className="inv-vendor-name">{inv.vendor_name || <em style={{ color: "var(--ink-3)" }}>Unknown</em>}</span>
                      </div>
                    </td>
                    <td><span className="inv-badge">{inv.invoice_number || "—"}</span></td>
                    <td>{inv.invoice_date || "—"}</td>
                    <td>{fmtAmount(inv.sub_total)}</td>
                    <td className="inv-tax-cell">{fmtAmount(inv.tps)}</td>
                    <td className="inv-tax-cell">{fmtAmount(inv.tvq)}</td>
                    <td className="inv-tax-cell">{fmtAmount(inv.tax)}</td>
                    <td className="inv-tax-cell">{fmtAmount(inv.discount)}</td>
                    <td><span className="inv-total-cell">{fmtAmount(inv.total_price)}</span></td>
                    <td>
                      <div className="inv-row-actions">
                        <button className="icon-btn edit-btn" title="Edit" onClick={() => openEdit(inv)}>✏️</button>
                        <button className="icon-btn delete-btn" title="Delete" onClick={() => setDeleteTarget(inv)}>🗑️</button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE: Cards ── */}
          <div className="inv-card-list mobile-only">
            {invoices.map((inv, i) => (
              <motion.div
                key={inv.id}
                className="inv-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.25) }}
              >
                <div className="inv-card-header">
                  <div className="inv-vendor-cell">
                    <div className="inv-vendor-avatar">{(inv.vendor_name || "?").substring(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="inv-vendor-name">{inv.vendor_name || <em style={{ color: "var(--ink-3)" }}>Unknown</em>}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                        #{inv.invoice_number || "—"} · {inv.invoice_date || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="inv-card-total">{fmtAmount(inv.total_price)}</div>
                </div>
                <div className="inv-card-fields">
                  <div className="inv-field"><span>Sub-total</span><span>{fmtAmount(inv.sub_total)}</span></div>
                  <div className="inv-field"><span>TPS</span><span>{fmtAmount(inv.tps)}</span></div>
                  <div className="inv-field"><span>TVQ</span><span>{fmtAmount(inv.tvq)}</span></div>
                  <div className="inv-field"><span>Tax</span><span>{fmtAmount(inv.tax)}</span></div>
                  <div className="inv-field"><span>Discount</span><span>{fmtAmount(inv.discount)}</span></div>
                </div>
                <div className="inv-card-actions">
                  <button className="btn-secondary btn-sm" onClick={() => openEdit(inv)}>✏️ Edit</button>
                  <button className="btn-danger-soft btn-sm" onClick={() => setDeleteTarget(inv)}>🗑️ Delete</button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* ── Delete Modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)}>
            <motion.div className="modal-box" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-icon">🗑️</div>
              <h2 className="modal-title">Delete Invoice?</h2>
              <p className="modal-sub">
                Are you sure you want to delete the invoice from <strong>{deleteTarget.vendor_name || "Unknown"}</strong>? This cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
                <button className="btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {editTarget && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditTarget(null)}>
            <motion.div className="modal-box modal-wide" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-icon">✏️</div>
              <h2 className="modal-title">Edit Invoice</h2>
              <p className="modal-sub">Correct any field that was mis-read by OCR.</p>
              <div className="edit-modal-grid">
                {[
                  { key: "vendor_name", label: "Vendor Name", type: "text" },
                  { key: "invoice_number", label: "Invoice Number", type: "text" },
                  { key: "invoice_date", label: "Date", type: "text", placeholder: "MM/DD/YYYY" },
                  { key: "sub_total", label: "Sub-total ($)", type: "number" },
                  { key: "tps", label: "TPS ($)", type: "number" },
                  { key: "tvq", label: "TVQ ($)", type: "number" },
                  { key: "tax", label: "Total Tax ($)", type: "number" },
                  { key: "discount", label: "Discount ($)", type: "number" },
                  { key: "total_price", label: "Total Price ($)", type: "number" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key} className="field-group" style={{ marginBottom: 0 }}>
                    <label className="field-label">{label}</label>
                    <input
                      className="field-input"
                      type={type}
                      step={type === "number" ? "0.01" : undefined}
                      placeholder={placeholder}
                      value={editForm[key as keyof typeof editForm]}
                      onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setEditTarget(null)} disabled={saving}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
