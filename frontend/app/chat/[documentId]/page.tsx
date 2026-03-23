// frontend/app/chat/[documentId]/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Document {
  id: string;
  original_name: string;
  is_processed: boolean;
}

interface Conversation {
  id: string;
  title: string;
  document_id: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="copy-btn" onClick={handleCopy}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    initChat();
  }, []);

  useEffect(() => {
    const el = messagesEndRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const isNearBottom = parent.scrollHeight - parent.scrollTop - parent.clientHeight < 100;
    if (isNearBottom) el.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initChat = async () => {
    try {
      const docsRes = await api.get("/api/documents/");
      const doc = docsRes.data.find((d: Document) => d.id === documentId);
      if (!doc) { router.push("/dashboard"); return; }
      setDocument(doc);
      await fetchConversations();
    } catch (err) {
      setError("Failed to initialize chat");
    } finally {
      setInitializing(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await api.get("/api/chat/conversations");
      const docConvs = res.data.filter((c: Conversation) => c.document_id === documentId);
      setConversations(docConvs);
    } catch (err) {
      console.error("Failed to fetch conversations");
    }
  };

  const startNewConversation = async () => {
    try {
      const res = await api.post("/api/chat/conversations", {
        document_id: documentId,
        title: `Chat ${new Date().toLocaleDateString()}`,
      });
      setConversationId(res.data.id);
      setMessages([]);
      await fetchConversations();
    } catch (err) {
      setError("Failed to create conversation");
    }
  };

  const loadConversation = async (convId: string) => {
    setConversationId(convId);
    try {
      const res = await api.get(`/api/chat/conversations/${convId}/messages`);
      setMessages(res.data);
    } catch (err) {
      setError("Failed to load conversation");
    }
  };

  const deleteConversation = async (convId: string) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      await api.delete(`/api/chat/conversations/${convId}`);
      if (conversationId === convId) { setConversationId(null); setMessages([]); }
      setConversations((prev) => prev.filter((c) => c.id !== convId));
    } catch (err) {
      setError("Failed to delete conversation");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    let activeConvId = conversationId;
    if (!activeConvId) {
      try {
        const res = await api.post("/api/chat/conversations", {
          document_id: documentId,
          title: `Chat ${new Date().toLocaleDateString()}`,
        });
        activeConvId = res.data.id;
        setConversationId(activeConvId);
        await fetchConversations();
      } catch (err) {
        setError("Failed to create conversation");
        return;
      }
    }

    const question = input.trim();
    setInput("");
    setError("");

    const tempUserMsg: Message = { id: Date.now().toString(), role: "user", content: question };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    const tempAssistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: tempAssistantId, role: "assistant", content: "" }]);

    try {
      const token = localStorage.getItem("token");
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(
        `${baseUrl}/api/chat/conversations/${activeConvId}/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ question }),
        }
      );

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      setLoading(false);

      let buffer = "";
      let lastUpdate = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAssistantId ? { ...msg, content: msg.content + buffer } : msg
              )
            );
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const now = Date.now();
        if (now - lastUpdate > 50) {
          const currentBuffer = buffer;
          buffer = "";
          lastUpdate = now;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantId ? { ...msg, content: msg.content + currentBuffer } : msg
            )
          );
        }
      }
    } catch (err: any) {
      setError("Failed to get answer");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id && m.id !== tempAssistantId));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (initializing) {
    return (
      <div className="chat-loading">
        <div className="loading-ring" />
        <p>Preparing your document...</p>
        <style jsx>{`
          .chat-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; background: var(--bg-primary); color: var(--text-muted); }
          .loading-ring { width: 36px; height: 36px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="chat-header-left">
          <button className="back-btn" onClick={() => router.push("/dashboard")}>← Back</button>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="chat-doc-info">
            <div className="chat-doc-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <p className="chat-doc-name">{document?.original_name}</p>
              <p className="chat-doc-status">AI-powered Q&A ready</p>
            </div>
          </div>
        </div>
        <div className="dash-brand">
          <span className="brand-dot" />
          <span className="brand-name">DocuMind</span>
        </div>
      </header>

      <div className="chat-body">
        <aside className={`chat-sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-header">
            <span>History</span>
            <button className="new-chat-btn" onClick={startNewConversation}>+ New</button>
          </div>
          <div className="sidebar-list">
            {conversations.length === 0 ? (
              <p className="sidebar-empty">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <div key={conv.id} className={`sidebar-item-wrapper ${conversationId === conv.id ? "active" : ""}`}>
                  <button className="sidebar-item" onClick={() => loadConversation(conv.id)}>
                    <span className="sidebar-item-icon">💬</span>
                    <span className="sidebar-item-title">{conv.title}</span>
                  </button>
                  <button className="sidebar-delete" onClick={() => deleteConversation(conv.id)} title="Delete conversation">✕</button>
                </div>
              ))
            )}
          </div>
        </aside>

        <div className="chat-main">
          <div className="chat-messages">
            {messages.length === 0 && !loading && (
              <div className="chat-welcome">
                <div className="welcome-icon">⟡</div>
                <h2>Ask anything about this document</h2>
                <p>I'll find the most relevant sections and give you a precise answer.</p>
                <div className="suggested-questions">
                  {[
                    "What is the main topic of this document?",
                    "Summarize the key points",
                    "What conclusions does it draw?",
                  ].map((q) => (
                    <button key={q} className="suggested-q" onClick={() => { setInput(q); inputRef.current?.focus(); }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-avatar">{msg.role === "user" ? "U" : "⟡"}</div>
                <div className="message-bubble">
                  <div className="message-content">
                    {msg.content === "" && msg.role === "assistant" ? (
                      <div className="thinking">
                        <span className="thinking-dot" />
                        <span className="thinking-dot" />
                        <span className="thinking-dot" />
                      </div>
                    ) : (
                      msg.content.split("\n").map((line, i) => <p key={i}>{line}</p>)
                    )}
                  </div>
                  {msg.role === "assistant" && msg.content !== "" && <CopyButton text={msg.content} />}
                </div>
              </div>
            ))}

            {error && (
              <div className="chat-error">
                {error}
                <button onClick={() => setError("")}>✕</button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <div className="chat-input-wrapper">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about this document..."
                rows={1}
                disabled={loading}
              />
              <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
                {loading ? (
                  <span className="send-spinner" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                )}
              </button>
            </div>
            <p className="input-hint">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .chat-page { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg-primary); }
        .chat-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; border-bottom: 1px solid var(--border); background: var(--bg-surface); position: sticky; top: 0; z-index: 10; }
        .chat-header-left { display: flex; align-items: center; gap: 1rem; }
        .back-btn, .sidebar-toggle { background: none; border: 1px solid var(--border); border-radius: 6px; padding: 0.4rem 0.9rem; color: var(--text-muted); font-size: 0.85rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .back-btn:hover, .sidebar-toggle:hover { border-color: var(--text-muted); color: var(--text-primary); }
        .chat-doc-info { display: flex; align-items: center; gap: 0.8rem; }
        .chat-doc-icon { width: 34px; height: 34px; background: rgba(232,168,48,0.1); border-radius: 7px; display: flex; align-items: center; justify-content: center; color: var(--accent); flex-shrink: 0; }
        .chat-doc-icon svg { width: 16px; height: 16px; }
        .chat-doc-name { font-size: 0.9rem; color: var(--text-primary); font-weight: 500; max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-doc-status { font-size: 0.75rem; color: var(--accent); }
        .dash-brand { display: flex; align-items: center; gap: 0.5rem; }
        .brand-dot { width: 7px; height: 7px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 8px var(--accent); }
        .brand-name { font-family: 'Playfair Display', serif; font-size: 1rem; color: var(--text-primary); }
        .chat-body { flex: 1; display: flex; overflow: hidden; height: calc(100vh - 65px); }
        .chat-sidebar { background: var(--bg-surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; transition: width 0.25s ease, opacity 0.25s ease; overflow: hidden; flex-shrink: 0; }
        .chat-sidebar.open { width: 240px; opacity: 1; }
        .chat-sidebar.closed { width: 0; opacity: 0; }
        .sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid var(--border); font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
        .new-chat-btn { background: rgba(232,168,48,0.1); border: 1px solid rgba(232,168,48,0.2); border-radius: 5px; padding: 0.3rem 0.7rem; color: var(--accent); font-size: 0.78rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; white-space: nowrap; }
        .new-chat-btn:hover { background: rgba(232,168,48,0.2); }
        .sidebar-list { flex: 1; overflow-y: auto; padding: 0.6rem; }
        .sidebar-empty { font-size: 0.82rem; color: var(--text-muted); padding: 1rem; text-align: center; }
        .sidebar-item-wrapper { display: flex; align-items: center; border-radius: 7px; transition: all 0.15s; }
        .sidebar-item-wrapper:hover { background: var(--bg-elevated); }
        .sidebar-item-wrapper.active { background: rgba(232,168,48,0.08); border: 1px solid rgba(232,168,48,0.15); }
        .sidebar-item { display: flex; align-items: center; gap: 0.6rem; flex: 1; background: none; border: none; border-radius: 7px; padding: 0.7rem 0.8rem; cursor: pointer; font-family: 'DM Sans', sans-serif; text-align: left; }
        .sidebar-item-wrapper.active .sidebar-item-title { color: var(--accent); }
        .sidebar-item-icon { font-size: 0.85rem; flex-shrink: 0; }
        .sidebar-item-title { font-size: 0.83rem; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sidebar-delete { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.4rem 0.6rem; border-radius: 5px; font-size: 0.7rem; opacity: 0; transition: all 0.2s; flex-shrink: 0; }
        .sidebar-item-wrapper:hover .sidebar-delete { opacity: 1; }
        .sidebar-delete:hover { background: rgba(220,80,60,0.1); color: #E07060; }
        .chat-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; }
        .chat-welcome { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 4rem 1rem; gap: 1rem; }
        .welcome-icon { font-size: 2rem; color: var(--accent); }
        .chat-welcome h2 { font-size: 1.4rem; color: var(--text-primary); }
        .chat-welcome p { color: var(--text-muted); font-size: 0.88rem; max-width: 380px; line-height: 1.7; }
        .suggested-questions { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; margin-top: 0.5rem; }
        .suggested-q { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 20px; padding: 0.5rem 1rem; color: var(--text-dim); font-size: 0.82rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .suggested-q:hover { border-color: var(--accent); color: var(--accent); }
        .message { display: flex; gap: 1rem; align-items: flex-start; animation: fadeUp 0.3s ease; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .message.user { flex-direction: row-reverse; }
        .message-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600; flex-shrink: 0; }
        .message.user .message-avatar { background: var(--accent); color: var(--bg-primary); }
        .message.assistant .message-avatar { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--accent); font-size: 1rem; }
        .message-bubble { max-width: 75%; }
        .message.user .message-bubble { background: var(--accent); border-radius: 16px 4px 16px 16px; padding: 0.85rem 1.1rem; }
        .message.assistant .message-bubble { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 4px 16px 16px 16px; padding: 0.85rem 1.1rem; }
        .message.user .message-content p { color: var(--bg-primary); font-size: 0.92rem; line-height: 1.6; margin: 0; }
        .message.assistant .message-content p { color: var(--text-primary); font-size: 0.92rem; line-height: 1.7; margin: 0 0 0.4rem 0; }
        .message.assistant .message-content p:last-child { margin-bottom: 0; }
        .copy-btn { margin-top: 0.6rem; background: none; border: 1px solid var(--border); border-radius: 5px; padding: 0.25rem 0.7rem; color: var(--text-muted); font-size: 0.75rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .copy-btn:hover { border-color: var(--accent); color: var(--accent); }
        .thinking { display: flex; gap: 5px; align-items: center; padding: 0.2rem 0; }
        .thinking-dot { width: 7px; height: 7px; background: var(--text-muted); border-radius: 50%; animation: bounce 1s infinite; }
        .thinking-dot:nth-child(2) { animation-delay: 0.15s; }
        .thinking-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-5px); } }
        .chat-error { display: flex; align-items: center; justify-content: space-between; background: rgba(220,80,60,0.1); border: 1px solid rgba(220,80,60,0.3); border-radius: 8px; padding: 0.75rem 1rem; color: #E07060; font-size: 0.85rem; }
        .chat-error button { background: none; border: none; color: #E07060; cursor: pointer; }
        .chat-input-area { padding: 1.2rem 2rem 1.5rem; border-top: 1px solid var(--border); background: var(--bg-surface); }
        .chat-input-wrapper { max-width: 800px; margin: 0 auto; display: flex; gap: 0.8rem; align-items: flex-end; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 12px; padding: 0.6rem 0.6rem 0.6rem 1rem; transition: border-color 0.2s; }
        .chat-input-wrapper:focus-within { border-color: var(--accent); }
        .chat-input-wrapper textarea { flex: 1; background: none; border: none; outline: none; color: var(--text-primary); font-size: 0.93rem; font-family: 'DM Sans', sans-serif; resize: none; line-height: 1.6; max-height: 140px; overflow-y: auto; }
        .chat-input-wrapper textarea::placeholder { color: var(--text-muted); }
        .send-btn { width: 36px; height: 36px; background: var(--accent); border: none; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all 0.2s; color: var(--bg-primary); }
        .send-btn:hover:not(:disabled) { background: var(--accent-dim); transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .send-btn svg { width: 15px; height: 15px; }
        .send-spinner { width: 14px; height: 14px; border: 2px solid rgba(15,14,12,0.3); border-top-color: var(--bg-primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .input-hint { max-width: 800px; margin: 0.5rem auto 0; font-size: 0.75rem; color: var(--text-muted); text-align: center; }
        @media (max-width: 768px) {
          .chat-header { padding: 0.8rem 1rem; }
          .brand-name { display: none; }
          .chat-sidebar.open { width: 200px; }
          .chat-messages { padding: 1.2rem 1rem; }
          .chat-input-area { padding: 0.8rem 1rem 1rem; }
          .message-bubble { max-width: 88%; }
          .chat-doc-name { max-width: 140px; }
        }
      `}</style>
    </div>
  );
}
