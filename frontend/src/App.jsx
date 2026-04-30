import { useState, useEffect } from "react";
import "./App.css";

const PRESETS = {
  "Delayed Delivery":
    "My order #12345 was supposed to arrive 3 days ago but it still hasn't shown up. No tracking updates either. This is really frustrating — I needed it for an event this weekend.",
  "Double Charged":
    "I was charged twice for my subscription this month. I can see two identical $49.99 charges on my bank statement from your company. Please refund one immediately.",
  "Login Broken":
    "I can't log into my account. I enter my password and it just says 'incorrect credentials' but I know it's right. I've tried resetting it twice and I'm still locked out.",
  "PII Test":
    "Hi, I'm John. My email is john.doe@example.com and my phone is 555-867-5309. I was charged $99 on my card 4111 1111 1111 1111 without authorization. Please help!",
};

const PRIORITY_CLASS = { high: "badge-red", medium: "badge-yellow", low: "badge-green" };
const SENTIMENT_CLASS = { angry: "badge-red", frustrated: "badge-yellow", neutral: "badge-gray", happy: "badge-green" };

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  async function fetchHistory() {
    try {
      const res = await fetch("http://localhost:8000/api/history");
      if (res.ok) setHistory(await res.json());
    } catch (_) {}
  }

  useEffect(() => { fetchHistory(); }, []);

  async function classify() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_text: text }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setResult(await res.json());
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="layout">
      {/* ── Left panel ── */}
      <div className="panel">
        <h1 className="panel-title">Support Ticket Classifier</h1>

        <div className="presets">
          <span className="presets-label">Try a preset</span>
          <div className="preset-row">
            {Object.entries(PRESETS).map(([label, sample]) => (
              <button key={label} className="preset-btn" onClick={() => setText(sample)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          className="ticket-textarea"
          placeholder="Describe the issue…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button className="classify-btn" onClick={classify} disabled={loading || !text.trim()}>
          {loading ? "Classifying…" : "Classify Ticket"}
        </button>

        {error && <p className="error-msg">{error}</p>}
      </div>

      {/* ── Right panel ── */}
      <div className={`panel result-panel ${result ? "result-panel--visible" : ""}`}>
        {!result ? (
          <p className="empty-hint">Submit a ticket to see results.</p>
        ) : (
          <div className="result">
            {result.injection_detected && (
              <div className="banner banner--danger">⛔ Injection attempt blocked</div>
            )}
            {result.requires_human_review && (
              <div className="banner banner--warning">🚩 Flagged for human review</div>
            )}

            {result.redacted_text && result.redacted_text !== result.original_text && (
              <div className="result-col">
                <span className="row-label">Redacted Text</span>
                <p className="redacted-text">{result.redacted_text}</p>
              </div>
            )}

            <Row label="Category" value={result.issue_category} />
            <Row label="Assigned Team" value={result.assigned_team} />

            <div className="result-row">
              <span className="row-label">Priority</span>
              <span className={`badge ${PRIORITY_CLASS[result.priority] ?? "badge-gray"}`}>
                {result.priority ?? "—"}
              </span>
            </div>

            <div className="result-row">
              <span className="row-label">Sentiment</span>
              <span className={`badge ${SENTIMENT_CLASS[result.user_sentiment] ?? "badge-gray"}`}>
                {result.user_sentiment ?? "—"}
              </span>
            </div>

            {result.confidence_score != null && (
              <div className="result-col">
                <div className="row-label-row">
                  <span className="row-label">Confidence</span>
                  <span className="confidence-pct">
                    {Math.round(result.confidence_score * 100)}%
                  </span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${Math.round(result.confidence_score * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {result.reasoning && (
              <div className="result-col">
                <span className="row-label">Reasoning</span>
                <p className="reasoning">{result.reasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>
      {history.length > 0 && (
        <div className="history">
          <p className="history-title">Past Classifications</p>
          {history.map((h) => (
            <div key={h.id} className="history-row">
              <span className="history-preview">{h.preview}</span>
              <span className="history-meta">{h.issue_category ?? "—"}</span>
              <span className={`badge ${PRIORITY_CLASS[h.priority] ?? "badge-gray"}`}>{h.priority ?? "—"}</span>
              <span className="history-meta">{h.confidence_score != null ? `${Math.round(h.confidence_score * 100)}%` : "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="result-row">
      <span className="row-label">{label}</span>
      <span className="row-value">{value ?? "—"}</span>
    </div>
  );
}
