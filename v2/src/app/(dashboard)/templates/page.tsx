"use client"

import { useState } from "react"
import { Plus, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TemplateManager } from "@/components/settings/template-manager"
import { TemplateWizard } from "@/components/templates/template-wizard"

export default function TemplatesPage() {
  const [showWizard, setShowWizard] = useState(false)

  if (showWizard) {
    return (
      <div className="space-y-5">
        <TemplateWizard onComplete={() => setShowWizard(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create and manage WhatsApp message templates for broadcasts and automations.
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>
      <TemplateManager />
    </div>
  )
}
