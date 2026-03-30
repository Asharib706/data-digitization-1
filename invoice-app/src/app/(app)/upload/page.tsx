"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startExtraction(e.dataTransfer.files[0]);
    }
  };

  const startExtraction = async (selectedFile: File) => {
    setFile(selectedFile);
    setExtracting(true);
    setProgress(0);
    setMessage("Initializing...");
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch("/api/invoice/extract", {
      method: "POST",
      body: formData,
    });

    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "progress") {
              setProgress(data.percent);
              setMessage(data.message);
            } else if (data.type === "result") {
              setResult(data.data);
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
    <div style={{ maxWidth: 640 }}>
      <header className="page-header">
        <h1 className="page-title">Upload Invoice</h1>
        <p className="page-sub">Use Gemini AI to extract detailed financial data from receipts and invoices.</p>
      </header>

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
        <div className="upload-title">{file ? file.name : "Drop invoices here"}</div>
        <div className="upload-sub">or click to browse your files</div>
        <div className="upload-formats">
          <span className="fmt-badge">JPG</span>
          <span className="fmt-badge">PNG</span>
          <span className="fmt-badge">JPEG</span>
          <span className="fmt-badge">PDF</span>
        </div>
      </div>

      <AnimatePresence>
        {extracting && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="extract-preview"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <div className="panel-title">Extracting — {file?.name}</div>
              <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>{progress}%</div>
            </div>
            <div className="processing-bar-wrap">
              <div className="processing-bar" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{message}</div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <div className="extract-row">
              <span className="extract-key">Vendor</span>
              <span className="extract-val">{result.vendor_name}</span>
            </div>
            <div className="extract-row">
              <span className="extract-key">Invoice #</span>
              <span className="extract-val">{result.invoice_number}</span>
            </div>
            <div className="extract-row">
              <span className="extract-key">Date</span>
              <span className="extract-val">{result.invoice_date}</span>
            </div>
            <div className="extract-row">
              <span className="extract-key">Sub-total</span>
              <span className="extract-val">${result.data[0].sub_total.toFixed(2)}</span>
            </div>
            <div className="extract-row">
              <span className="extract-key">TPS</span>
              <span className="extract-val">${result.data[0].tps.toFixed(2)}</span>
            </div>
            <div className="extract-row">
              <span className="extract-key">TVQ</span>
              <span className="extract-val">${result.data[0].tvq.toFixed(2)}</span>
            </div>
            <div className="extract-row">
              <span className="extract-key">Total Tax</span>
              <span className="extract-val">${result.data[0].tax.toFixed(2)}</span>
            </div>
            <div className="extract-row">
              <span className="extract-key">Total Price</span>
              <span className="extract-val accent">${result.data[0].total_price.toFixed(2)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
