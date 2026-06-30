"use client";

import { useState } from "react";
import { BookOpen, Settings, History } from "lucide-react";
import { KnowledgeTab } from "@/components/ai/knowledge-tab";
import { SettingsTab } from "@/components/ai/settings-tab";
import { LogsTab } from "@/components/ai/logs-tab";

export default function AIAssistantPage() {
  const [tab, setTab] = useState<"knowledge" | "settings" | "logs">("knowledge");

  const tabs = [
    { id: "knowledge" as const, label: "Knowledge Base", icon: BookOpen },
    { id: "settings" as const, label: "Settings", icon: Settings },
    { id: "logs" as const, label: "Logs", icon: History },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          AI Assistant
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Train your AI on your business — it replies to customers 24/7 in any language
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {tab === "knowledge" && <KnowledgeTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "logs" && <LogsTab />}
      </div>
    </div>
  );
}
