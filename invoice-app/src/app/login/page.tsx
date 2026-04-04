"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await signIn("credentials", { username, password, redirect: false });
      setLoading(false);
      
      if (res?.error) {
        setError("Invalid username or password.");
      } else if (res?.ok || !res) {
        router.push("/dashboard");
      } else {
        setError("Invalid username or password.");
      }
    } catch (err) {
      setLoading(false);
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

            {/* Floating Toast for errors */}
            {error && (
              <div style={{ 
                position: "fixed", 
                top: 20, 
                right: 20, 
                zIndex: 9999, 
                padding: "14px 24px", 
                background: "var(--red)", 
                color: "white", 
                borderRadius: "var(--radius-sm)", 
                boxShadow: "0 8px 30px rgba(214,59,59,0.3)",
                fontSize: 14,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
                animation: "toast-in 0.3s ease-out forwards"
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
                <style>{`
                  @keyframes toast-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                  }
                `}</style>
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
