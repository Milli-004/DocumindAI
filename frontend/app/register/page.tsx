// frontend/app/register/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    if (!fullName || !email || !password) { setError("All fields are required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/register", { email, password, full_name: fullName });
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="brand-dot" />
          <span className="brand-name">DocuMind</span>
        </div>
        <div className="auth-hero">
          <h1>Research smarter,<br />not <em>harder.</em></h1>
          <p>Join thousands of researchers, students, and professionals who use DocuMind to extract insights from documents instantly.</p>
        </div>
        <div className="auth-stats">
          <div className="stat-item"><span className="stat-number">10x</span><span className="stat-label">Faster than manual reading</span></div>
          <div className="stat-divider" />
          <div className="stat-item"><span className="stat-number">100%</span><span className="stat-label">Grounded in your documents</span></div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Create account</h2>
            <p>Free forever. No credit card required.</p>
          </div>
          <div className="auth-form">
            <div className="form-group">
              <label>Full name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label>Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" onKeyDown={(e) => e.key === "Enter" && handleRegister()} />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-btn" onClick={handleRegister} disabled={loading}>
              {loading ? <span className="btn-loading"><span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" /></span> : "Create account →"}
            </button>
            <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-container { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; background: var(--bg-primary); }
        .auth-left { padding: 3rem; display: flex; flex-direction: column; justify-content: space-between; border-right: 1px solid var(--border); background: radial-gradient(ellipse at 20% 50%, #1E1A0E 0%, var(--bg-primary) 70%); }
        .auth-brand { display: flex; align-items: center; gap: 0.6rem; }
        .brand-dot { width: 10px; height: 10px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 12px var(--accent); }
        .brand-name { font-family: 'Playfair Display', serif; font-size: 1.2rem; color: var(--text-primary); letter-spacing: 0.05em; }
        .auth-hero h1 { font-size: clamp(2.2rem, 4vw, 3.2rem); line-height: 1.15; color: var(--text-primary); margin-bottom: 1.2rem; }
        .auth-hero h1 em { font-style: italic; color: var(--accent); }
        .auth-hero p { font-size: 1rem; color: var(--text-dim); line-height: 1.7; max-width: 380px; }
        .auth-stats { display: flex; align-items: center; gap: 2rem; }
        .stat-item { display: flex; flex-direction: column; gap: 0.3rem; }
        .stat-number { font-family: 'Playfair Display', serif; font-size: 2rem; color: var(--accent); line-height: 1; }
        .stat-label { font-size: 0.82rem; color: var(--text-muted); }
        .stat-divider { width: 1px; height: 40px; background: var(--border); }
        .auth-right { display: flex; align-items: center; justify-content: center; padding: 3rem; }
        .auth-card { width: 100%; max-width: 400px; }
        .auth-card-header { margin-bottom: 2.5rem; }
        .auth-card-header h2 { font-size: 1.8rem; color: var(--text-primary); margin-bottom: 0.4rem; }
        .auth-card-header p { color: var(--text-muted); font-size: 0.9rem; }
        .auth-form { display: flex; flex-direction: column; gap: 1.2rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.82rem; color: var(--text-dim); letter-spacing: 0.06em; text-transform: uppercase; font-weight: 500; }
        .form-group input { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 0.85rem 1rem; color: var(--text-primary); font-size: 0.95rem; font-family: 'DM Sans', sans-serif; transition: border-color 0.2s, box-shadow 0.2s; outline: none; width: 100%; }
        .form-group input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(232,168,48,0.1); }
        .form-group input::placeholder { color: var(--text-muted); }
        .auth-error { background: rgba(220,80,60,0.1); border: 1px solid rgba(220,80,60,0.3); border-radius: 8px; padding: 0.75rem 1rem; color: #E07060; font-size: 0.88rem; }
        .auth-btn { background: var(--accent); color: var(--bg-primary); border: none; border-radius: 8px; padding: 0.9rem 1.5rem; font-size: 0.95rem; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.2s, transform 0.1s; margin-top: 0.5rem; letter-spacing: 0.02em; }
        .auth-btn:hover:not(:disabled) { background: var(--accent-dim); transform: translateY(-1px); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-loading { display: flex; align-items: center; justify-content: center; gap: 5px; }
        .loading-dot { width: 6px; height: 6px; background: var(--bg-primary); border-radius: 50%; animation: bounce 0.8s infinite; }
        .loading-dot:nth-child(2) { animation-delay: 0.15s; }
        .loading-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        .auth-switch { text-align: center; color: var(--text-muted); font-size: 0.88rem; }
        .auth-switch a { color: var(--accent); text-decoration: none; font-weight: 500; }
        .auth-switch a:hover { text-decoration: underline; }
        @media (max-width: 768px) {
          .auth-container { grid-template-columns: 1fr; }
          .auth-left { display: none; }
          .auth-right { padding: 2rem 1.5rem; align-items: flex-start; padding-top: 4rem; }
        }
      `}</style>
    </div>
  );
}
