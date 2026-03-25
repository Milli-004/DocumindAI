// frontend/app/dashboard/page.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Document {
  id: string;
  original_name: string;
  file_size: number;
  chunk_count: number;
  is_processed: boolean;
  created_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDocuments = useCallback(async () => {
  try {
    const response = await api.get("/api/documents/");
    setDocuments(response.data);
    setError(""); 
    return response.data as Document[];
  } catch (err: any) {
    // 401 means not logged in — interceptor in api.ts will redirect to /login
    // don't show "Failed to load documents" for auth errors
    if (err.response?.status !== 401) {
      setError("Failed to load documents");
    }
    return [];
  } finally {
    setLoading(false);
  }
}, []);

  const startPollingIfNeeded = useCallback((docs: Document[]) => {
    const hasPending = docs.some((d) => !d.is_processed);
    if (!hasPending) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const updated = await fetchDocuments();
      if (!updated.some((d: Document) => !d.is_processed)) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 3000);
  }, [fetchDocuments]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchDocuments().then(startPollingIfNeeded);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".pdf")) { setError("Only PDF files are allowed"); return; }
    setError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = await fetchDocuments();
      startPollingIfNeeded(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this document?")) return;
    try {
      await api.delete(`/api/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      setError("Failed to delete document");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-brand">
          <span className="brand-dot" />
          <span className="brand-name">DocuMind</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Sign out</button>
      </header>

      <main className="dash-main">
        <div className="dash-top">
          <div>
            <h1>Your Library</h1>
            <p className="dash-subtitle">
              {documents.length === 0
                ? "Upload your first document to get started"
                : `${documents.length} document${documents.length !== 1 ? "s" : ""} ready to explore`}
            </p>
          </div>
          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              style={{ display: "none" }}
              id="file-upload"
            />
            <label htmlFor="file-upload" className={`upload-btn ${uploading ? "uploading" : ""}`}>
              {uploading ? (
                <span className="upload-status">
                  <span className="spinner" />
                  Uploading…
                </span>
              ) : (
                "Upload PDF +"
              )}
            </label>
          </div>
        </div>

        {error && (
          <div className="dash-error">
            {error}
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="loading-ring" />
            <p>Loading your documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⟡</div>
            <h3>No documents yet</h3>
            <p>Upload a PDF to start asking questions about it</p>
            <label htmlFor="file-upload" className="empty-upload-btn">
              Upload your first PDF
            </label>
          </div>
        ) : (
          <div className="docs-grid">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`doc-card ${doc.is_processed ? "processed" : "processing"}`}
                onClick={() => doc.is_processed && router.push(`/chat/${doc.id}`)}
              >
                <div className="doc-card-top">
                  <div className="doc-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <button className="doc-delete" onClick={(e) => handleDelete(doc.id, e)} title="Delete document">✕</button>
                </div>
                <div className="doc-info">
                  <h3 className="doc-name">{doc.original_name}</h3>
                  <div className="doc-meta">
                    <span>{formatSize(doc.file_size)}</span>
                    {doc.is_processed && <span>{doc.chunk_count} chunks</span>}
                  </div>
                </div>
                <div className="doc-status">
                  {doc.is_processed ? (
                    <span className="status-ready">Ready to chat →</span>
                  ) : (
                    <span className="status-processing">
                      <span className="processing-dot" />
                      Processing...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style jsx>{`
        .dashboard { min-height: 100vh; background: var(--bg-primary); }
        .dash-header { display: flex; align-items: center; justify-content: space-between; padding: 1.2rem 2.5rem; border-bottom: 1px solid var(--border); background: var(--bg-surface); position: sticky; top: 0; z-index: 10; }
        .dash-brand { display: flex; align-items: center; gap: 0.6rem; }
        .brand-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 10px var(--accent); }
        .brand-name { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: var(--text-primary); letter-spacing: 0.05em; }
        .logout-btn { background: none; border: 1px solid var(--border); border-radius: 6px; padding: 0.4rem 1rem; color: var(--text-muted); font-size: 0.85rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .logout-btn:hover { border-color: var(--text-muted); color: var(--text-primary); }
        .dash-main { max-width: 1100px; margin: 0 auto; padding: 3rem 2rem; }
        .dash-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 1rem; }
        .dash-top h1 { font-size: 2rem; color: var(--text-primary); margin-bottom: 0.3rem; }
        .dash-subtitle { color: var(--text-muted); font-size: 0.9rem; }
        .upload-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--accent); color: var(--bg-primary); border: none; border-radius: 8px; padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; letter-spacing: 0.02em; white-space: nowrap; }
        .upload-btn:hover:not(.uploading) { background: var(--accent-dim); transform: translateY(-1px); }
        .upload-btn.uploading { opacity: 0.8; cursor: not-allowed; }
        .upload-status { display: flex; align-items: center; gap: 0.6rem; }
        .spinner { width: 14px; height: 14px; border: 2px solid rgba(15,14,12,0.3); border-top-color: var(--bg-primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .dash-error { display: flex; align-items: center; justify-content: space-between; background: rgba(220,80,60,0.1); border: 1px solid rgba(220,80,60,0.3); border-radius: 8px; padding: 0.75rem 1rem; color: #E07060; font-size: 0.88rem; margin-bottom: 1.5rem; }
        .dash-error button { background: none; border: none; color: #E07060; cursor: pointer; font-size: 0.8rem; }
        .loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem 0; color: var(--text-muted); }
        .loading-ring { width: 36px; height: 36px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 6rem 0; text-align: center; }
        .empty-icon { font-size: 2.5rem; color: var(--accent); opacity: 0.5; }
        .empty-state h3 { font-size: 1.3rem; color: var(--text-primary); font-family: 'Playfair Display', serif; }
        .empty-state p { color: var(--text-muted); font-size: 0.9rem; }
        .empty-upload-btn { margin-top: 0.5rem; display: inline-block; background: var(--accent); color: var(--bg-primary); border-radius: 8px; padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .empty-upload-btn:hover { background: var(--accent-dim); }
        .docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.2rem; }
        .doc-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; transition: all 0.2s; position: relative; }
        .doc-card.processed { cursor: pointer; }
        .doc-card.processed:hover { border-color: var(--accent); background: var(--bg-elevated); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .doc-card-top { display: flex; align-items: flex-start; justify-content: space-between; }
        .doc-icon { width: 40px; height: 40px; background: rgba(232,168,48,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--accent); }
        .doc-icon svg { width: 20px; height: 20px; }
        .doc-delete { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.8rem; padding: 0.2rem 0.4rem; border-radius: 4px; transition: all 0.2s; opacity: 0; }
        .doc-card:hover .doc-delete { opacity: 1; }
        .doc-delete:hover { background: rgba(220,80,60,0.1); color: #E07060; }
        .doc-name { font-size: 0.95rem; color: var(--text-primary); font-family: 'DM Sans', sans-serif; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .doc-meta { display: flex; gap: 1rem; margin-top: 0.3rem; }
        .doc-meta span { font-size: 0.78rem; color: var(--text-muted); }
        .doc-status { margin-top: auto; }
        .status-ready { font-size: 0.82rem; color: var(--accent); font-weight: 500; letter-spacing: 0.02em; }
        .status-processing { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--text-muted); }
        .processing-dot { width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%; animation: pulse 1.2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @media (max-width: 768px) {
          .dash-header { padding: 1rem 1.2rem; }
          .dash-main { padding: 2rem 1.2rem; }
          .dash-top { flex-direction: column; }
          .docs-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
  }
