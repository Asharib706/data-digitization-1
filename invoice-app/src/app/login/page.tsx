"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid username or password.");
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo">
            <span className="auth-logo-dot" />
            InvoiceAI
          </div>
          <div className="auth-tagline">Smart invoice extraction, powered by Gemini.</div>
          <div className="auth-sub">
            Upload receipts, extract data automatically, and track your vendor spending — all in one place.
          </div>
          <div className="auth-badges">
            <div className="auth-badge"><div className="auth-badge-dot" /><span>Gemini 2.0 Flash OCR extraction</span></div>
            <div className="auth-badge"><div className="auth-badge-dot" /><span>TPS / TVQ auto-computed</span></div>
            <div className="auth-badge"><div className="auth-badge-dot" /><span>Monthly summaries as XLSX</span></div>
          </div>
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", position: "relative", zIndex: 1 }}>© 2025 InvoiceAI</div>
      </div>

      <div className="auth-right">
        <div style={{ maxWidth: 360, width: "100%" }}>
          <div className="auth-form-title">Welcome back</div>
          <div className="auth-form-sub">Sign in to your workspace</div>

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label">Username</label>
              <input
                className="field-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-username"
                required
                autoFocus
              />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input
                className="field-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 12, padding: "10px 12px", background: "var(--red-dim)", borderRadius: "var(--radius-sm)", border: "0.5px solid rgba(214,59,59,0.2)" }}>
                {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 6 }}>
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <div className="auth-switch">
            Don&apos;t have an account?{" "}
            <Link href="/signup">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
