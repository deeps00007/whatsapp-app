"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Search, FileText, HelpCircle, BookOpen, Package, Loader2 } from "lucide-react";

interface KnowledgeEntry {
  id: string;
  type: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  faq: HelpCircle,
  policy: BookOpen,
  product: Package,
  document: FileText,
  general: FileText,
};

const TYPE_LABELS: Record<string, string> = {
  faq: "FAQ",
  policy: "Policy",
  product: "Product",
  document: "Document",
  general: "General",
};

export function KnowledgeTab() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("faq");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const supabase = createClient();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/knowledge");
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error("[ai] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ai/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          content: content.trim(),
          tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setTags("");
        setShowForm(false);
        await fetchEntries();
      }
    } catch (err) {
      console.error("[ai] add error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await fetch(`/api/ai/knowledge?id=${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("[ai] delete error:", err);
    }
  };

  const filtered = entries.filter((e) => {
    const matchesSearch = !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || e.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Knowledge Base</h3>
          <p className="text-sm text-muted-foreground">Train your AI assistant on your business</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Entry
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {["faq", "policy", "product", "document", "general"].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${
                  type === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <input
            placeholder={type === "faq" ? "Question (e.g., What are your prices?)" : "Title"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <textarea
            placeholder={type === "faq" ? "Answer (e.g., Our plans start at ₹499...)" : "Content (paste your document, policy, product info, etc.)"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={type === "faq" ? 3 : 8}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-y"
          />
          <input
            placeholder="Tags (comma-separated, e.g., pricing, plans, cost)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !title.trim() || !content.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? "Saving & generating embeddings..." : "Save Entry"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search knowledge base..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="all">All Types</option>
          <option value="faq">FAQ</option>
          <option value="policy">Policy</option>
          <option value="product">Product</option>
          <option value="document">Document</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {entries.length === 0
              ? "No knowledge base entries yet. Add your first FAQ or document to train your AI assistant."
              : "No entries match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const Icon = TYPE_ICONS[entry.type] || FileText;
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-primary">{TYPE_LABELS[entry.type]}</span>
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1">
                        {entry.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mt-1 truncate">{entry.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.content}</p>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
