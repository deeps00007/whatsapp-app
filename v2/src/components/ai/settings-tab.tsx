"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, Power, AlertTriangle } from "lucide-react";

interface AISettings {
  enabled: boolean;
  mode: string;
  custom_system_prompt: string | null;
  business_name: string | null;
  business_hours: string | null;
  escalation_phone: string | null;
  escalation_enabled: boolean;
  monthly_request_count: number;
  monthly_prompt_tokens: number;
  monthly_completion_tokens: number;
}

export function SettingsTab() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/settings");
      const data = await res.json();
      setSettings(data.settings);
    } catch (err) {
      console.error("[ai] settings fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("[ai] settings save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return <p className="text-sm text-muted-foreground">Failed to load settings.</p>;
  }

  const usagePercent = Math.min((settings.monthly_request_count / 100) * 100, 100);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${settings.enabled ? "bg-primary/10" : "bg-secondary"}`}>
            <Power className={`h-5 w-5 ${settings.enabled ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">AI Assistant</h4>
            <p className="text-xs text-muted-foreground">{settings.enabled ? "Active — replying to customers" : "Disabled"}</p>
          </div>
        </div>
        <button
          onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
          className={`relative h-6 w-11 rounded-full transition ${settings.enabled ? "bg-primary" : "bg-secondary"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${settings.enabled ? "left-5" : "left-0.5"}`} />
        </button>
      </div>

      {/* Mode */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h4 className="text-sm font-bold text-foreground">Response Mode</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSettings({ ...settings, mode: "all_messages" })}
            className={`rounded-lg p-3 text-left transition ${settings.mode === "all_messages" ? "bg-primary/10 border-2 border-primary" : "border-2 border-border"}`}
          >
            <span className="text-sm font-semibold text-foreground block">All Messages</span>
            <span className="text-xs text-muted-foreground">AI replies to every customer message</span>
          </button>
          <button
            onClick={() => setSettings({ ...settings, mode: "fallback_only" })}
            className={`rounded-lg p-3 text-left transition ${settings.mode === "fallback_only" ? "bg-primary/10 border-2 border-primary" : "border-2 border-border"}`}
          >
            <span className="text-sm font-semibold text-foreground block">Fallback Only</span>
            <span className="text-xs text-muted-foreground">AI replies only when no automation/flow handles it</span>
          </button>
        </div>
      </div>

      {/* Business Info */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h4 className="text-sm font-bold text-foreground">Business Information</h4>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Business Name</label>
          <input
            value={settings.business_name || ""}
            onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
            placeholder="e.g., ABC Electronics"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Business Hours</label>
          <input
            value={settings.business_hours || ""}
            onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
            placeholder="e.g., Mon-Sat 9AM-8PM IST"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Custom System Prompt */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h4 className="text-sm font-bold text-foreground">Custom AI Instructions</h4>
        <p className="text-xs text-muted-foreground">Tell your AI how to behave. E.g., "Always promote premium products. Never discuss competitors. Ask for phone number before ending."</p>
        <textarea
          value={settings.custom_system_prompt || ""}
          onChange={(e) => setSettings({ ...settings, custom_system_prompt: e.target.value })}
          rows={4}
          placeholder="Enter custom instructions for your AI assistant..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-y"
        />
      </div>

      {/* Escalation */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground">Escalation Settings</h4>
          <button
            onClick={() => setSettings({ ...settings, escalation_enabled: !settings.escalation_enabled })}
            className={`relative h-6 w-11 rounded-full transition ${settings.escalation_enabled ? "bg-primary" : "bg-secondary"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${settings.escalation_enabled ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">When AI can&apos;t answer, it will notify this WhatsApp number and pause AI for that conversation.</p>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Escalation Phone Number (with country code)</label>
          <input
            value={settings.escalation_phone || ""}
            onChange={(e) => setSettings({ ...settings, escalation_phone: e.target.value })}
            placeholder="e.g., +919876543210"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Usage */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h4 className="text-sm font-bold text-foreground">Monthly Usage</h4>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${usagePercent}%` }} />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{settings.monthly_request_count} / 100 free replies</span>
          <span className="text-muted-foreground">{100 - settings.monthly_request_count} remaining</span>
        </div>
        {settings.monthly_request_count >= 100 && (
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            Free limit reached. AI is paused until next month.
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}
