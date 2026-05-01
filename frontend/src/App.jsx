import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

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

const PRIORITY_STYLE = {
  high: "border-red-300 bg-red-100 text-red-700",
  medium: "border-amber-300 bg-amber-100 text-amber-700",
  low: "border-emerald-300 bg-emerald-100 text-emerald-700",
};

const SENTIMENT_STYLE = {
  angry: "border-red-300 bg-red-100 text-red-700",
  frustrated: "border-orange-300 bg-orange-100 text-orange-700",
  neutral: "border-sky-300 bg-sky-100 text-sky-700",
  happy: "border-emerald-300 bg-emerald-100 text-emerald-700",
};

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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <header className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Support Ticket Classifier
        </h1>
        <p className="mt-0.5 text-sm text-violet-200">
          AI-powered issue routing &amp; prioritization
        </p>
      </header>

      <div className="mx-auto max-w-5xl grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        {/* ── Input card ── */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-violet-900">New Ticket</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Try a preset
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PRESETS).map(([label, sample]) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    className="border-violet-200 text-violet-700 hover:border-violet-300 hover:bg-violet-50"
                    onClick={() => setText(sample)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="Describe the issue…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[160px] resize-none"
            />

            <Button
              onClick={classify}
              disabled={loading || !text.trim()}
              className="h-10 w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-700 hover:to-indigo-700"
            >
              {loading ? "Classifying…" : "Classify Ticket"}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* ── Results card ── */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-violet-900">Result</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Submit a ticket to see results
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {result.injection_detected && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="font-medium text-red-700">
                      ⛔ Injection attempt blocked
                    </AlertDescription>
                  </Alert>
                )}
                {result.requires_human_review && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertDescription className="font-medium text-amber-700">
                      🚩 Flagged for human review
                    </AlertDescription>
                  </Alert>
                )}

                {result.redacted_text && result.redacted_text !== result.original_text && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Redacted Text
                    </p>
                    <p className="text-sm text-slate-700">{result.redacted_text}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-violet-100 bg-violet-50 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-400">
                      Category
                    </p>
                    <p className="text-sm font-semibold text-violet-900">
                      {result.issue_category ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-400">
                      Team
                    </p>
                    <p className="text-sm font-semibold text-indigo-900">
                      {result.assigned_team ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Priority
                    </p>
                    <Badge
                      variant="outline"
                      className={PRIORITY_STYLE[result.priority] ?? "border-gray-300 bg-gray-100 text-gray-700"}
                    >
                      {result.priority ?? "—"}
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Sentiment
                    </p>
                    <Badge
                      variant="outline"
                      className={SENTIMENT_STYLE[result.user_sentiment] ?? "border-gray-300 bg-gray-100 text-gray-700"}
                    >
                      {result.user_sentiment ?? "—"}
                    </Badge>
                  </div>
                </div>

                {result.confidence_score != null && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="mb-2 flex justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Confidence
                      </p>
                      <span className="text-xs font-bold text-violet-700">
                        {Math.round(result.confidence_score * 100)}%
                      </span>
                    </div>
                    <Progress value={Math.round(result.confidence_score * 100)} />
                  </div>
                )}

                {result.reasoning && (
                  <div className="rounded-lg border border-purple-100 bg-purple-50 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-purple-400">
                      Reasoning
                    </p>
                    <p className="text-sm leading-relaxed text-purple-900">
                      {result.reasoning}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── History ── */}
      {history.length > 0 && (
        <div className="mx-auto max-w-5xl px-6 pb-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-violet-900">Past Classifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <p className="flex-1 truncate text-sm text-slate-700">{h.preview}</p>
                    <span className="text-xs text-slate-400">{h.issue_category ?? "—"}</span>
                    <Badge
                      variant="outline"
                      className={PRIORITY_STYLE[h.priority] ?? "border-gray-300 bg-gray-100 text-gray-700"}
                    >
                      {h.priority ?? "—"}
                    </Badge>
                    <span className="tabular-nums text-xs font-medium text-violet-600">
                      {h.confidence_score != null
                        ? `${Math.round(h.confidence_score * 100)}%`
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
