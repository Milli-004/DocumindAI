// frontend/app/page.tsx
"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="nav-brand">
          <span className="brand-dot" />
          <span className="brand-name">DocuMind</span>
        </div>
        <div className="nav-links">
          <Link href="/login" className="nav-login">Sign in</Link>
          <Link href="/register" className="nav-cta">Get started free</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge">
          <span className="badge-dot" />
          Powered by Llama 3.1 + RAG
        </div>
        <h1>
          Ask your documents<br />
          anything. Get <em>precise</em><br />
          answers instantly.
        </h1>
        <p className="hero-sub">
          Upload any PDF and have a real conversation with it.
          DocuMind finds the exact relevant sections and gives
          you grounded answers — not hallucinations.
        </p>
        <div className="hero-actions">
          <Link href="/register" className="hero-cta">Start for free →</Link>
          <Link href="/login" className="hero-secondary">Sign in</Link>
        </div>

        <div className="hero-preview">
          <div className="preview-header">
            <div className="preview-doc">
              <div className="preview-doc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <span>research_paper.pdf</span>
            </div>
            <span className="preview-status">Ready to chat</span>
          </div>
          <div className="preview-messages">
            <div className="preview-msg user">
              What are the key findings of this research?
            </div>
            <div className="preview-msg assistant">
              <span className="preview-icon">⟡</span>
              <span>The research identifies three key findings: first, semantic search outperforms keyword matching by 40% in recall. Second, chunk overlap significantly reduces boundary information loss. Third, RAG reduces hallucination by grounding responses in source documents...</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">◈</div>
            <h3>Semantic Search</h3>
            <p>Finds relevant content by meaning, not just keywords. Ask naturally, get precise results.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">◎</div>
            <h3>Grounded Answers</h3>
            <p>Every answer is backed by your document. No hallucinations, no guessing.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">◬</div>
            <h3>Conversation Memory</h3>
            <p>Ask follow-up questions naturally. DocuMind remembers the context of your conversation.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⟡</div>
            <h3>Any PDF</h3>
            <p>Research papers, contracts, reports, textbooks — upload any PDF and start asking.</p>
          </div>
        </div>
      </section>

      <section className="bottom-cta">
        <h2>Ready to understand your documents?</h2>
        <p>Join researchers, students, and professionals who use DocuMind daily.</p>
        <Link href="/register" className="hero-cta">Create free account →</Link>
      </section>

      <style jsx>{`
        .landing { min-height: 100vh; background: var(--bg-primary); overflow-x: hidden; }

        .landing-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.4rem 3rem; border-bottom: 1px solid var(--border);
          position: sticky; top: 0; background: rgba(15,14,12,0.9);
          backdrop-filter: blur(12px); z-index: 10;
        }
        .nav-brand { display: flex; align-items: center; gap: 0.6rem; }
        .brand-dot { width: 9px; height: 9px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 12px var(--accent); }
        .brand-name { font-family: 'Playfair Display', serif; font-size: 1.2rem; color: var(--text-primary); letter-spacing: 0.05em; }
        .nav-links { display: flex; align-items: center; gap: 1rem; }
        .nav-login { color: var(--text-muted); text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
        .nav-login:hover { color: var(--text-primary); }
        .nav-cta { background: var(--accent); color: var(--bg-primary); text-decoration: none; padding: 0.5rem 1.2rem; border-radius: 7px; font-size: 0.88rem; font-weight: 600; transition: background 0.2s; }
        .nav-cta:hover { background: var(--accent-dim); }

        .hero { max-width: 900px; margin: 0 auto; padding: 5rem 2rem 4rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1.5rem; }
        .hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(232,168,48,0.08); border: 1px solid rgba(232,168,48,0.2); border-radius: 20px; padding: 0.4rem 1rem; font-size: 0.8rem; color: var(--accent); letter-spacing: 0.04em; }
        .badge-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        .hero h1 { font-size: clamp(2.8rem, 6vw, 4.5rem); line-height: 1.1; color: var(--text-primary); letter-spacing: -0.02em; }
        .hero h1 em { font-style: italic; color: var(--accent); }
        .hero-sub { font-size: 1.05rem; color: var(--text-dim); line-height: 1.75; max-width: 560px; }
        .hero-actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; justify-content: center; }
        .hero-cta { background: var(--accent); color: var(--bg-primary); text-decoration: none; padding: 0.85rem 2rem; border-radius: 8px; font-size: 0.95rem; font-weight: 600; transition: all 0.2s; letter-spacing: 0.02em; }
        .hero-cta:hover { background: var(--accent-dim); transform: translateY(-1px); }
        .hero-secondary { color: var(--text-dim); text-decoration: none; font-size: 0.9rem; transition: color 0.2s; padding: 0.85rem 1rem; }
        .hero-secondary:hover { color: var(--text-primary); }

        .hero-preview { width: 100%; max-width: 680px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-top: 1rem; box-shadow: 0 24px 60px rgba(0,0,0,0.4); }
        .preview-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.4rem; border-bottom: 1px solid var(--border); background: var(--bg-elevated); }
        .preview-doc { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: var(--text-dim); }
        .preview-doc-icon { width: 28px; height: 28px; background: rgba(232,168,48,0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--accent); }
        .preview-doc-icon svg { width: 14px; height: 14px; }
        .preview-status { font-size: 0.75rem; color: var(--accent); }
        .preview-messages { padding: 1.4rem; display: flex; flex-direction: column; gap: 1rem; }
        .preview-msg { font-size: 0.88rem; line-height: 1.6; border-radius: 12px; padding: 0.8rem 1rem; max-width: 85%; }
        .preview-msg.user { background: var(--accent); color: var(--bg-primary); align-self: flex-end; border-radius: 12px 4px 12px 12px; }
        .preview-msg.assistant { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary); align-self: flex-start; border-radius: 4px 12px 12px 12px; display: flex; gap: 0.6rem; align-items: flex-start; }
        .preview-icon { color: var(--accent); flex-shrink: 0; margin-top: 1px; }

        .features { max-width: 900px; margin: 0 auto; padding: 4rem 2rem; border-top: 1px solid var(--border); }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .feature-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.8rem 1.5rem; display: flex; flex-direction: column; gap: 0.8rem; transition: all 0.2s; }
        .feature-card:hover { border-color: rgba(232,168,48,0.3); transform: translateY(-2px); }
        .feature-icon { font-size: 1.4rem; color: var(--accent); }
        .feature-card h3 { font-size: 1rem; color: var(--text-primary); font-family: 'Playfair Display', serif; }
        .feature-card p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.65; }

        .bottom-cta { max-width: 900px; margin: 0 auto; padding: 4rem 2rem 6rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; border-top: 1px solid var(--border); }
        .bottom-cta h2 { font-size: 2rem; color: var(--text-primary); }
        .bottom-cta p { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 0.5rem; }

        @media (max-width: 768px) {
          .landing-nav { padding: 1rem 1.2rem; }
          .hero { padding: 3rem 1.2rem; }
          .features { padding: 3rem 1.2rem; }
          .bottom-cta { padding: 3rem 1.2rem 4rem; }
          .features-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .features-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
      }
