"use client"

import { TemplateManager } from "@/components/settings/template-manager"

export default function TemplatesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Templates</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create and manage WhatsApp message templates for broadcasts and automations.
        </p>
      </div>
      <TemplateManager />
    </div>
  )
}
