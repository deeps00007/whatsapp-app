"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertTriangle, CheckCircle, ArrowUpRight } from "lucide-react";

interface AILog {
  id: string;
  conversation_id: string;
  customer_message: string;
  ai_response: string | null;
  confidence_score: number | null;
  escalated: boolean;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  language_detected: string | null;
  created_at: string;
}

export function LogsTab() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?escalated=${filter === "escalated"}` : "";
      const res = await fetch(`/api/ai/logs${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("[ai] logs fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const confidenceColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score > 0.75) return "text-emerald-600";
    if (score > 0.55) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">AI Conversation Logs</h3>
          <p className="text-sm text-muted-foreground">Track what your AI answered and when it escalated</p>
        </div>
        <div className="flex gap-2">
          {["all", "answered", "escalated"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No AI conversation logs yet. Logs will appear here once your AI assistant starts responding to customers.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-border bg-card p-4 space-y-2 hover:border-primary/30 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {log.escalated ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="h-3 w-3" /> Escalated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle className="h-3 w-3" /> Answered
                      </span>
                    )}
                    {log.confidence_score !== null && (
                      <span className={`text-xs font-bold ${confidenceColor(log.confidence_score)}`}>
                        {Math.round(log.confidence_score * 100)}% confidence
                      </span>
                    )}
                    {log.language_detected && log.language_detected !== "unknown" && (
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        {log.language_detected}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{formatTime(log.created_at)}</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-muted-foreground">Customer:</p>
                    <p className="text-sm text-foreground">{log.customer_message}</p>
                  </div>
                  {log.ai_response && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-muted-foreground">AI Response:</p>
                      <p className="text-sm text-foreground line-clamp-3">{log.ai_response}</p>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{log.latency_ms}ms</span>
                    {log.prompt_tokens > 0 && <span>{log.prompt_tokens + log.completion_tokens} tokens</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
