"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DangerZonePage() {
  const router = useRouter();
  const [objectId, setObjectId] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleDeleteOne = async () => {
    if (!objectId) return;
    setLoading(true);
    const res = await fetch(`/api/invoice/${objectId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      setMessage({ text: "Invoice deleted successfully", type: "success" });
      setObjectId("");
    } else {
      setMessage({ text: "Failed to delete: Invalid ID or unauthorized", type: "error" });
    }
  };

  const handleDeleteAll = async () => {
    if (confirmText !== "DELETE") return;
    setLoading(true);
    const res = await fetch("/api/invoice/all", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage({ text: "All data cleared successfully", type: "success" });
      setConfirmText("");
      setTimeout(() => router.push("/dashboard"), 1500);
    } else {
      setMessage({ text: "Failed to wipe data", type: "error" });
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <header className="page-header">
        <h1 className="page-title">Danger Zone</h1>
        <p className="page-sub">Irreversible actions that modify or delete your financial data.</p>
      </header>

      <div className="warning-banner">
        <div className="warn-icon">⚠️</div>
        <div className="warn-text">
          Actions in this section are irreversible. Deleted records cannot be recovered from the database.
        </div>
      </div>

      {message && (
        <div className={`toast ${message.type}`} style={{ position: "static", marginBottom: "1.5rem" }}>
          {message.type === "success" ? "✓" : "✕"} {message.text}
        </div>
      )}

      <div className="danger-card">
        <h2 className="danger-title">Delete single invoice</h2>
        <p className="danger-sub">Provide the MongoDB Object ID of the record you want to remove.</p>
        <div className="field-group" style={{ maxWidth: 360 }}>
          <label className="field-label">Object ID</label>
          <input 
            className="field-input" 
            value={objectId} 
            onChange={(e) => setObjectId(e.target.value)} 
            placeholder="64f2a1b3c8..." 
          />
        </div>
        <button className="btn-danger" onClick={handleDeleteOne} disabled={loading || !objectId}>
          Delete Record
        </button>
      </div>

      <div className="danger-card">
        <h2 className="danger-title">Delete all my data</h2>
        <p className="danger-sub">Permanently removes every invoice record associated with your account. This cannot be undone.</p>
        <div className="field-group" style={{ maxWidth: 360 }}>
          <label className="field-label">Type DELETE to confirm</label>
          <input 
            className="field-input" 
            value={confirmText} 
            onChange={(e) => setConfirmText(e.target.value)} 
            placeholder="DELETE" 
          />
        </div>
        <button 
          className="btn-danger-soft" 
          onClick={handleDeleteAll} 
          disabled={loading || confirmText !== "DELETE"}
        >
          Wipe All Data
        </button>
      </div>
    </div>
  );
}
