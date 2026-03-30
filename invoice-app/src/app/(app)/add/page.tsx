"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function AddManuallyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    invoice_number: "",
    invoice_date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }),
    vendor_name: "",
    sub_total: "",
    tps: "",
    tvq: "",
    total_price: "",
    discount: "0",
  });

  const totalTax = useMemo(() => {
    return (Number(form.tps) || 0) + (Number(form.tvq) || 0);
  }, [form.tps, form.tvq]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/invoice/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <header className="page-header">
        <h1 className="page-title">Add Manually</h1>
        <p className="page-sub">Enter invoice details manually if you don't have an image.</p>
      </header>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-section-title">Invoice Details</div>
          <div className="form-grid">
            <div className="field-group">
              <label className="field-label">Invoice Number</label>
              <input className="field-input" name="invoice_number" value={form.invoice_number} onChange={handleChange} placeholder="INV-0001" required />
            </div>
            <div className="field-group">
              <label className="field-label">Invoice Date (MM/DD/YYYY)</label>
              <input className="field-input" name="invoice_date" value={form.invoice_date} onChange={handleChange} placeholder="MM/DD/YYYY" required />
            </div>
            <div className="field-group full">
              <label className="field-label">Vendor Name</label>
              <input className="field-input" name="vendor_name" value={form.vendor_name} onChange={handleChange} placeholder="e.g. Staples, Amazon, etc." required />
            </div>
          </div>

          <div className="form-section-title">Financial Data</div>
          <div className="form-grid">
            <div className="field-group">
              <label className="field-label">Sub-total ($)</label>
              <input className="field-input" type="number" step="0.01" name="sub_total" value={form.sub_total} onChange={handleChange} placeholder="0.00" required />
            </div>
            <div className="field-group">
              <label className="field-label">Discount ($)</label>
              <input className="field-input" type="number" step="0.01" name="discount" value={form.discount} onChange={handleChange} placeholder="0.00" />
            </div>
            <div className="field-group">
              <label className="field-label">TPS — Goods & Services Tax</label>
              <input className="field-input" type="number" step="0.01" name="tps" value={form.tps} onChange={handleChange} placeholder="0.00" />
            </div>
            <div className="field-group">
              <label className="field-label">TVQ — Quebec Sales Tax</label>
              <input className="field-input" type="number" step="0.01" name="tvq" value={form.tvq} onChange={handleChange} placeholder="0.00" />
            </div>
          </div>

          <div className="tax-computed">
            <div>
              <div className="tax-computed-label">Auto-computed Total Tax (TPS + TVQ)</div>
            </div>
            <div className="tax-computed-val">${totalTax.toFixed(2)}</div>
          </div>

          <div className="form-section-title" style={{ marginTop: "1.5rem" }}>Total</div>
          <div className="field-group full">
            <label className="field-label">Total Price ($)</label>
            <input className="field-input" type="number" step="0.01" name="total_price" value={form.total_price} onChange={handleChange} placeholder="0.00" required />
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: 12, alignItems: "center" }}>
            {success && <span className="s-processed" style={{ fontSize: 13, fontWeight: 600 }}>✓ Saved successfully!</span>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Invoice ↗"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
