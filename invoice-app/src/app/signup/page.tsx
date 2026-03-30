"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/login?registered=1");
    } else {
      const data = await res.json();
      setError(data.error || "Signup failed");
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo"><span className="auth-logo-dot" />InvoiceAI</div>
          <div className="auth-tagline">Start managing invoices smarter today.</div>
          <div className="auth-sub">Create your free workspace and get started with Gemini-powered OCR extraction in minutes.</div>
          <div className="auth-badges">
            <div className="auth-badge"><div className="auth-badge-dot" /><span>No credit card required</span></div>
            <div className="auth-badge"><div className="auth-badge-dot" /><span>Powered by Gemini 2.0 Flash</span></div>
            <div className="auth-badge"><div className="auth-badge-dot" /><span>TPS / TVQ auto-computed</span></div>
          </div>
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", position: "relative", zIndex: 1 }}>© 2025 InvoiceAI</div>
      </div>

      <div className="auth-right">
        <div style={{ maxWidth: 360, width: "100%" }}>
          <div className="auth-form-title">Create account</div>
          <div className="auth-form-sub">Set up your workspace in seconds</div>

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label">Username</label>
              <input className="field-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="choose-a-username" required autoFocus />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input className="field-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 12, padding: "10px 12px", background: "var(--red-dim)", borderRadius: "var(--radius-sm)", border: "0.5px solid rgba(214,59,59,0.2)" }}>
                {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 6 }}>
              {loading ? "Creating…" : "Create account →"}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account? <Link href="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
