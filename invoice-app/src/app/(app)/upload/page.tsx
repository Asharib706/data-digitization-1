"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ExtractResult {
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  data: {
    sub_total: number;
    tps: number;
    tvq: number;
    tax: number;
    total_price: number;
    discount: number;
  }[];
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) startExtraction(e.dataTransfer.files[0]);
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setMessage("");
    setResult(null);
    setShowSuccess(false);
    setExtracting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startExtraction = async (selectedFile: File) => {
    setFile(selectedFile);
    setExtracting(true);
    setProgress(0);
    setMessage("Initializing...");
    setResult(null);
    setShowSuccess(false);

    // Generate image preview
    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    } else {
      setPreview(null);
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch("/api/invoice/extract", { method: "POST", body: formData });
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "progress") {
              setProgress(data.percent);
              setMessage(data.message);
            } else if (data.type === "result") {
              setResult(data.data);
              setShowSuccess(true);
              // Auto-reset after 4 seconds
              setTimeout(() => {
                resetState();
                router.refresh();
              }, 4000);
            } else if (data.type === "error") {
              setMessage(`Error: ${data.message}`);
              setExtracting(false);
            }
          } catch (e) {
            console.error("Parse error", e);
          }
        }
      }
    }
    setExtracting(false);
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <header className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>
            <h1 className="page-title" style={{ marginTop: 4 }}>Upload Invoice</h1>
            <p className="page-sub">Gemini AI extracts detailed financial data from receipts and invoices.</p>
          </div>
        </div>
      </header>

      {/* Success Banner */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="success-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span>✓ Invoice uploaded and saved successfully!</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="btn-secondary btn-sm" onClick={resetState}>Upload Another</button>
              <Link href="/dashboard" className="btn-accent btn-sm">View Dashboard →</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop Zone */}
      {!extracting && !result && (
        <div
          className={`upload-zone ${dragActive ? "active" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && startExtraction(e.target.files[0])}
            accept="image/*,.pdf"
          />
          <div className="upload-icon-wrap">📤</div>
          <div className="upload-title">Drop your invoice here</div>
          <div className="upload-sub">or click to browse files</div>
          <div className="upload-formats">
            {["JPG", "PNG", "JPEG", "PDF"].map(f => <span key={f} className="fmt-badge">{f}</span>)}
          </div>
        </div>
      )}

      {/* Extraction Progress */}
      <AnimatePresence>
        {extracting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="extract-preview"
          >
            <div style={{ display: "flex", gap: 16 }}>
              {preview && (
                <div className="preview-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="invoice preview" style={{ width: 64, height: 80, objectFit: "cover", borderRadius: 6, border: "0.5px solid var(--border)" }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <div className="panel-title">Extracting — {file?.name}</div>
                  <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>{progress}%</div>
                </div>
                <div className="processing-bar-wrap">
                  <div className="processing-bar" style={{ width: `${progress}%` }} />
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>{message}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extraction Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="extract-preview"
          >
            <div className="panel-head">
              <h2 className="panel-title">Extraction Complete</h2>
              <div className="s-processed" style={{ fontSize: 12, fontWeight: 600 }}>● Saved to Database</div>
            </div>
            {[
              ["Vendor", result.vendor_name],
              ["Invoice #", result.invoice_number],
              ["Date", result.invoice_date],
              ["Sub-total", `$${result.data[0].sub_total.toFixed(2)}`],
              ["TPS", `$${result.data[0].tps.toFixed(2)}`],
              ["TVQ", `$${result.data[0].tvq.toFixed(2)}`],
              ["Total Tax", `$${result.data[0].tax.toFixed(2)}`],
              ["Total Price", `$${result.data[0].total_price.toFixed(2)}`],
            ].map(([key, val]) => (
              <div key={key} className="extract-row">
                <span className="extract-key">{key}</span>
                <span className={`extract-val ${key === "Total Price" ? "accent" : ""}`}>{val}</span>
              </div>
            ))}
            <div style={{ marginTop: "1rem", display: "flex", gap: 10 }}>
              <button className="btn-secondary" onClick={resetState}>Upload Another</button>
              <Link href="/dashboard" className="btn-accent">View Dashboard →</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
