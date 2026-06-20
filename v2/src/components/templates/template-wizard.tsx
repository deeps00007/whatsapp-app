"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import {
  Check,
  CheckCheck,
  Image as ImageIcon,
  Video,
  FileText,
  Type,
  Ban,
  Plus,
  X,
  AlertCircle,
  Loader2,
  Info,
  RotateCcw,
  Copy,
  ExternalLink,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const STEPS = ["Set up template", "Edit template", "Submit for review"]

const CATEGORY_TABS = ["Marketing", "Utility", "Authentication"]

const CATEGORY_OPTIONS: Record<string, { value: string; label: string; desc: string; enabled: boolean }[]> = {
  Marketing: [
    { value: "default", label: "Default", desc: "Send messages with media and customized buttons to engage your customers.", enabled: true },
    { value: "catalog", label: "Catalog", desc: "Send messages that drive sales by connecting your product catalog.", enabled: false },
  ],
  Utility: [
    { value: "default", label: "Default", desc: "Send messages about an existing order or account.", enabled: true },
  ],
  Authentication: [
    { value: "otp", label: "One-time Passcode", desc: "Send codes to verify a transaction or login.", enabled: true },
  ],
}

const CATEGORY_META: Record<string, { goodFor: string; customize: string }> = {
  Marketing: { goodFor: "Welcome messages, promotions, offers, coupons, newsletters, announcements", customize: "Media, header, body, footer, buttons" },
  Utility: { goodFor: "Order confirmations, account updates, receipts, appointment reminders, billing", customize: "Media, header, body, footer, buttons" },
  Authentication: { goodFor: "One-time password, account recovery code, account verification", customize: "Code delivery method" },
}

const PLACEHOLDER_BODY: Record<string, string> = {
  Marketing: "Hey there! Check out our fresh groceries now!\n\nUse code HEALTH to get additional 10% off on your entire purchase.",
  Utility: "Good news! Your order #12345 has shipped!\n\nHere's your tracking information, please check link below.",
}

const LANGUAGES = [
  { value: "en_US", label: "English (US)" },
  { value: "en_GB", label: "English (UK)" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "pt_BR", label: "Portuguese (Brazil)" },
  { value: "ar", label: "Arabic" },
  { value: "id", label: "Indonesian" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ru", label: "Russian" },
  { value: "zh_CN", label: "Chinese (Simplified)" },
  { value: "zh_TW", label: "Chinese (Traditional)" },
  { value: "th", label: "Thai" },
  { value: "vi", label: "Vietnamese" },
  { value: "tr", label: "Turkish" },
  { value: "ms", label: "Malay" },
  { value: "bn", label: "Bengali" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "mr", label: "Marathi" },
  { value: "gu", label: "Gujarati" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
  { value: "pa", label: "Punjabi" },
]

const HEADER_TYPES = [
  { value: "none", label: "None", icon: Ban },
  { value: "text", label: "Text", icon: Type },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "video", label: "Video", icon: Video },
  { value: "document", label: "Document", icon: FileText },
]

const BUTTON_TYPES = [
  { value: "QUICK_REPLY", label: "Quick reply" },
  { value: "URL", label: "Visit website" },
  { value: "PHONE_NUMBER", label: "Call phone number" },
]

const NAME_REGEX = /^[a-z0-9_]+$/
const HEADER_TEXT_MAX = 60
const BODY_MAX = 1024
const FOOTER_MAX = 60
const BUTTON_TEXT_MAX = 25

function extractVariables(text: string): number[] {
  return [...text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => parseInt(m[1], 10))
}

function isSequential(vars: number[]): boolean {
  const unique = Array.from(new Set(vars)).sort((a, b) => a - b)
  return unique.every((v, i) => v === i + 1)
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

interface TemplateWizardProps {
  onComplete?: () => void
}

export function TemplateWizard({ onComplete }: TemplateWizardProps) {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState("Marketing")
  const [subtype, setSubtype] = useState("default")

  const [name, setName] = useState("")
  const [language, setLanguage] = useState("en_US")
  const [headerType, setHeaderType] = useState("none")
  const [headerContent, setHeaderContent] = useState("")
  const [bodyText, setBodyText] = useState("")
  const [footerText, setFooterText] = useState("")
  const [buttons, setButtons] = useState<Array<{ id: string; type: string; text: string; value: string }>>([])

  const [authMethod, setAuthMethod] = useState<"copy" | "autofill">("copy")
  const [authSecurityNote, setAuthSecurityNote] = useState(true)
  const [authExpiry, setAuthExpiry] = useState(false)
  const [authExpiryMinutes, setAuthExpiryMinutes] = useState("10")

  const [sampleValues, setSampleValues] = useState<Record<number, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [mediaPreviewError, setMediaPreviewError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; id: string; status: string } | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => { setMediaPreviewError(false) }, [headerContent, headerType])

  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const headerRef = useRef<HTMLInputElement>(null)

  const authBody = useMemo(() => {
    let text = "{{1}} is your verification code."
    if (authSecurityNote) text += " For your security, do not share this code."
    if (authExpiry) text += " This code will expire in {{2}} minutes."
    return text
  }, [authSecurityNote, authExpiry])

  const effectiveBody = category === "Authentication" ? authBody : bodyText

  function resetForCategory(nextCategory: string) {
    setCategory(nextCategory)
    const firstEnabled = CATEGORY_OPTIONS[nextCategory].find((o) => o.enabled)
    setSubtype(firstEnabled?.value || "")
  }

  const bodyVariables = useMemo(() => extractVariables(effectiveBody), [effectiveBody])
  const headerVariables = useMemo(() => (headerType === "text" ? extractVariables(headerContent) : []), [headerType, headerContent])
  const allVariables = useMemo(() => Array.from(new Set([...headerVariables, ...bodyVariables])).sort((a, b) => a - b), [headerVariables, bodyVariables])

  useEffect(() => {
    setSampleValues((prev) => {
      const next: Record<number, string> = {}
      allVariables.forEach((v) => {
        next[v] = prev[v] ?? (category === "Authentication" ? (v === 1 ? "482913" : authExpiryMinutes) : `Sample ${v}`)
      })
      return next
    })
  }, [allVariables, category, authExpiryMinutes])

  function insertVariable(ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>, setter: (v: string) => void, currentValue: string) {
    const existing = extractVariables(currentValue)
    const nextNum = existing.length === 0 ? 1 : Math.max(...existing) + 1
    const token = `{{${nextNum}}}`
    const el = ref.current
    if (el && document.activeElement === el) {
      const start = (el as HTMLInputElement | HTMLTextAreaElement).selectionStart ?? currentValue.length
      const end = (el as HTMLInputElement | HTMLTextAreaElement).selectionEnd ?? currentValue.length
      setter(currentValue.slice(0, start) + token + currentValue.slice(end))
    } else {
      setter(currentValue + (currentValue ? " " : "") + token)
    }
  }

  function addButton() {
    if (buttons.length >= 3) return
    setButtons((b) => [...b, { id: uid(), type: "QUICK_REPLY", text: "", value: "" }])
  }

  function updateButton(id: string, patch: Partial<{ type: string; text: string; value: string }>) {
    setButtons((b) => b.map((btn) => (btn.id === id ? { ...btn, ...patch } : btn)))
  }

  function removeButton(id: string) {
    setButtons((b) => b.filter((btn) => btn.id !== id))
  }

  function validateStep2(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Template name is required."
    else if (!NAME_REGEX.test(name.trim())) errs.name = "Use lowercase letters, numbers and underscores only."

    if (category !== "Authentication") {
      if (!bodyText.trim()) errs.bodyText = "Body text is required."
      else if (bodyText.length > BODY_MAX) errs.bodyText = `Body exceeds ${BODY_MAX} characters.`
      else {
        const trimmed = bodyText.trim()
        if (/^\{\{\d+\}\}/.test(trimmed)) errs.bodyText = "Body text can't start with a variable."
        else if (/\{\{\d+\}\}$/.test(trimmed)) errs.bodyText = "Body text can't end with a variable."
      }
    }

    if (headerType === "text") {
      if (headerContent.length > HEADER_TEXT_MAX) errs.headerContent = `Header exceeds ${HEADER_TEXT_MAX} characters.`
      if (headerVariables.length > 1) errs.headerContent = "Header text supports only 1 variable."
    }
    if (["image", "video", "document"].includes(headerType) && !headerContent.trim()) {
      errs.headerContent = "Add a media asset for this header type."
    }

    if (footerText.length > FOOTER_MAX) errs.footerText = `Footer exceeds ${FOOTER_MAX} characters.`
    if (/\{\{\d+\}\}/.test(footerText)) errs.footerText = "Footer text can't contain variables."

    if (allVariables.length > 0 && !isSequential(allVariables)) {
      errs.bodyText = errs.bodyText || "Variables must be sequential starting at {{1}}."
    }

    buttons.forEach((btn) => {
      if (!btn.text.trim()) errs[`button_${btn.id}`] = "Button label required."
      else if (btn.text.length > BUTTON_TEXT_MAX) errs[`button_${btn.id}`] = `Max ${BUTTON_TEXT_MAX} characters.`
      if (btn.type === "URL" && !/^https?:\/\//.test(btn.value)) errs[`button_${btn.id}_value`] = "Enter a full URL starting with https://"
      if (btn.type === "PHONE_NUMBER" && !/^\+?[0-9]{6,15}$/.test(btn.value)) errs[`button_${btn.id}_value`] = "Enter a valid phone number."
    })

    return errs
  }

  const step2Errors = validateStep2()
  const step2HasErrors = Object.keys(step2Errors).length > 0

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    setSubmitResult(null)

    const payload = {
      name: name.trim(),
      category,
      language,
      body_text: effectiveBody,
      header_type: headerType === "none" ? null : headerType,
      header_content: headerType !== "none" ? headerContent.trim() : null,
      footer_text: footerText.trim() || null,
      buttons: category === "Authentication" ? [{ type: "OTP", method: authMethod }] : buttons,
    }

    try {
      const res = await fetch("/api/whatsapp/templates/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create template")
      }
      const data = await res.json()
      setSubmitResult(data)
      toast.success(`Template "${name}" submitted for review`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setSubmitError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  function discard() {
    setStep(1)
    setCategory("Marketing")
    setSubtype("default")
    setName("")
    setLanguage("en_US")
    setHeaderType("none")
    setHeaderContent("")
    setBodyText("")
    setFooterText("")
    setButtons([])
    setAuthMethod("copy")
    setAuthSecurityNote(true)
    setAuthExpiry(false)
    setSubmitResult(null)
    setSubmitError(null)
    setTouched({})
  }

  function renderTextWithVars(text: string) {
    let out = text
    allVariables.forEach((v) => {
      const val = sampleValues[v] || `{{${v}}}`
      out = out.split(`{{${v}}}`).join(val)
    })
    return out
  }

  const previewBody = effectiveBody ? renderTextWithVars(effectiveBody) : PLACEHOLDER_BODY[category] || ""
  const previewHeaderText = headerType === "text" ? renderTextWithVars(headerContent) : ""
  const isPlaceholderContent = !effectiveBody && category !== "Authentication"

  const previewButtons =
    category === "Authentication"
      ? [{ label: authMethod === "copy" ? "Copy code" : "Autofill", icon: Copy }]
      : buttons.length > 0
        ? buttons.map((b) => ({
            label: b.text || "Button",
            icon: b.type === "URL" ? ExternalLink : b.type === "PHONE_NUMBER" ? Phone : Check,
          }))
        : isPlaceholderContent
          ? category === "Marketing"
            ? [{ label: "Shop now", icon: ExternalLink }, { label: "Copy code", icon: Copy }]
            : [{ label: "Track shipment", icon: ExternalLink }]
          : []

  const statusStyles: Record<string, string> = {
    Approved: "border-emerald-800 bg-emerald-950/50 text-emerald-400",
    Rejected: "border-red-800 bg-red-950/50 text-red-400",
    Pending: "border-amber-800 bg-amber-950/50 text-amber-400",
  }

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
        {STEPS.map((label, i) => {
          const n = i + 1
          const active = step === n
          const done = step > n
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-semibold ${
                  active ? "border-primary text-primary" : done ? "border-primary bg-primary text-primary-foreground" : "border-slate-600 text-slate-500"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : n}
              </div>
              <span className={`text-sm font-medium ${active ? "text-primary" : done ? "text-slate-200" : "text-slate-500"}`}>
                {label}
              </span>
              {n < STEPS.length && <span className="mx-2 h-px w-8 bg-slate-700" />}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* MAIN PANEL */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-white">Set up your template</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Choose the category that best describes your message template.
                  Then select the type of message you want to send.
                </p>
              </div>

              <div className="flex rounded-lg border border-slate-700 text-sm overflow-hidden">
                {CATEGORY_TABS.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => resetForCategory(c)}
                    className={`flex-1 px-4 py-2.5 font-medium transition ${
                      category === c ? "bg-slate-800 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50"
                    } ${i !== 0 ? "border-l border-slate-700" : ""}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-700">
                {CATEGORY_OPTIONS[category].map((opt, i) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={!opt.enabled}
                    onClick={() => setSubtype(opt.value)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                      i !== 0 ? "border-t border-slate-700" : ""
                    } ${
                      subtype === opt.value
                        ? "bg-primary/5"
                        : opt.enabled
                          ? "hover:bg-slate-800/50"
                          : "opacity-50"
                    }`}
                  >
                    <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      subtype === opt.value ? "border-primary" : "border-slate-600"
                    }`}>
                      {subtype === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                        {opt.label}
                        {!opt.enabled && (
                          <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-700">Coming soon</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-white">Edit template</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1 text-xs text-slate-400">Template name</Label>
                  <Input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setTouched((t) => ({ ...t, name: true })) }}
                    placeholder="order_shipped_update"
                    className={`bg-slate-800 border-slate-700 text-slate-100 ${touched.name && step2Errors.name ? "border-red-500" : ""}`}
                  />
                  {touched.name && step2Errors.name && <p className="mt-1 text-xs text-red-400">{step2Errors.name}</p>}
                </div>
                <div>
                  <Label className="mb-1 text-xs text-slate-400">Language</Label>
                  <Select value={language} onValueChange={(v: string | null) => { if (v) setLanguage(v) }}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {category === "Authentication" ? (
                <div className="space-y-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Code delivery method</p>
                    <div className="mt-2 flex gap-2">
                      {([
                        { v: "copy" as const, l: "Copy code" },
                        { v: "autofill" as const, l: "One-tap autofill" },
                      ]).map((m) => (
                        <button
                          key={m.v}
                          type="button"
                          onClick={() => setAuthMethod(m.v)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                            authMethod === m.v ? "border-primary bg-primary/10 text-primary" : "border-slate-600 text-slate-400"
                          }`}
                        >
                          {m.l}
                        </button>
                      ))}
                    </div>
                    {authMethod === "autofill" && (
                      <p className="mt-1.5 flex items-start gap-1 text-xs text-amber-400">
                        <Info className="mt-0.5 h-3 w-3 shrink-0" />
                        One-tap autofill needs an Android package name + app signature hash registered with Meta.
                      </p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={authSecurityNote} onChange={(e) => setAuthSecurityNote(e.target.checked)} className="accent-primary" />
                    Add security recommendation
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={authExpiry} onChange={(e) => setAuthExpiry(e.target.checked)} className="accent-primary" />
                    Add code expiration time
                  </label>
                  {authExpiry && (
                    <div className="flex items-center gap-2 pl-6">
                      <Input type="number" min={1} max={90} value={authExpiryMinutes} onChange={(e) => setAuthExpiryMinutes(e.target.value)} className="w-20 bg-slate-800 border-slate-700 text-slate-100" />
                      <span className="text-xs text-slate-500">minutes</span>
                    </div>
                  )}
                  <div className="rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-400">
                    Body text is fixed by Meta for authentication templates:
                    <br />
                    <span className="font-mono text-[11px] text-slate-300">{authBody}</span>
                  </div>
                </div>
              ) : (
                <>
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-200">Header <span className="font-normal text-slate-500">(optional)</span></h3>
                    <div className="flex flex-wrap gap-2">
                      {HEADER_TYPES.map((h) => {
                        const Icon = h.icon
                        return (
                          <button
                            key={h.value}
                            type="button"
                            onClick={() => setHeaderType(h.value)}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${
                              headerType === h.value ? "border-primary bg-primary/10 text-primary" : "border-slate-700 text-slate-400 hover:border-slate-600"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {h.label}
                          </button>
                        )
                      })}
                    </div>
                    {headerType === "text" && (
                      <div>
                        <Input
                          ref={headerRef}
                          value={headerContent}
                          onChange={(e) => setHeaderContent(e.target.value)}
                          placeholder="Your order is on its way"
                          className="bg-slate-800 border-slate-700 text-slate-100"
                        />
                        <div className="mt-1 flex justify-between text-xs text-slate-500">
                          <button type="button" onClick={() => insertVariable(headerRef, setHeaderContent, headerContent)} className="flex items-center gap-1 hover:text-slate-200">
                            <Plus className="h-3 w-3" /> Insert variable
                          </button>
                          <span className={headerContent.length > HEADER_TEXT_MAX ? "text-red-400" : ""}>{headerContent.length}/{HEADER_TEXT_MAX}</span>
                        </div>
                      </div>
                    )}
                    {["image", "video", "document"].includes(headerType) && (
                      <div className="space-y-1.5">
                        <Input
                          value={headerContent}
                          onChange={(e) => { setHeaderContent(e.target.value); setMediaPreviewError(false) }}
                          placeholder={
                            headerType === "image" ? "https://example.com/image.jpg"
                            : headerType === "video" ? "https://example.com/video.mp4"
                            : "https://example.com/document.pdf"
                          }
                          className="bg-slate-800 border-slate-700 text-slate-100"
                        />
                        <p className="text-[11px] text-slate-500">
                          Enter a publicly accessible URL. Meta will use this for template review.
                          {!/^https?:\/\//i.test(headerContent) && headerContent && (
                            <span className="ml-1 text-amber-400">URL must start with https://</span>
                          )}
                        </p>
                        {headerType === "image" && headerContent && /^https?:\/\//i.test(headerContent) && !mediaPreviewError && (
                          <div className="mt-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                            <img
                              src={headerContent}
                              alt="Preview"
                              className="max-h-32 w-full object-cover"
                              onError={() => setMediaPreviewError(true)}
                            />
                          </div>
                        )}
                        {headerType === "video" && headerContent && /^https?:\/\//i.test(headerContent) && !mediaPreviewError && (
                          <div className="mt-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                            <video
                              src={headerContent}
                              className="max-h-32 w-full object-cover"
                              onError={() => setMediaPreviewError(true)}
                              muted
                              playsInline
                            />
                          </div>
                        )}
                        {mediaPreviewError && headerContent && /^https?:\/\//i.test(headerContent) && (
                          <p className="text-[11px] text-amber-400">
                            Could not load media preview. Make sure the URL is publicly accessible.
                          </p>
                        )}
                      </div>
                    )}
                    {touched.headerContent && step2Errors.headerContent && <p className="text-xs text-red-400">{step2Errors.headerContent}</p>}
                  </section>

                  <section className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-200">Body</h3>
                      <button type="button" onClick={() => insertVariable(bodyRef, setBodyText, bodyText)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200">
                        <Plus className="h-3 w-3" /> Insert variable
                      </button>
                    </div>
                    <Textarea
                      ref={bodyRef}
                      value={bodyText}
                      onChange={(e) => { setBodyText(e.target.value); setTouched((t) => ({ ...t, bodyText: true })) }}
                      rows={5}
                      placeholder={PLACEHOLDER_BODY[category]}
                      className={`bg-slate-800 border-slate-700 text-slate-100 resize-none ${touched.bodyText && step2Errors.bodyText ? "border-red-500" : ""}`}
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Can't start or end with a variable</span>
                      <span className={bodyText.length > BODY_MAX ? "text-red-400" : ""}>{bodyText.length}/{BODY_MAX}</span>
                    </div>
                    {touched.bodyText && step2Errors.bodyText && <p className="text-xs text-red-400">{step2Errors.bodyText}</p>}

                    {allVariables.length > 0 && (
                      <div className="mt-2 space-y-2 rounded-lg bg-slate-800/50 p-3">
                        <p className="flex items-center gap-1 text-xs font-medium text-slate-400">
                          <Info className="h-3 w-3" /> Sample values for preview
                        </p>
                        {allVariables.map((v) => (
                          <div key={v} className="flex items-center gap-2">
                            <span className="w-12 shrink-0 rounded bg-slate-700 px-1.5 py-0.5 text-center text-[11px] font-mono text-slate-300">
                              {`{{${v}}}`}
                            </span>
                            <Input
                              value={sampleValues[v] || ""}
                              onChange={(e) => setSampleValues((s) => ({ ...s, [v]: e.target.value }))}
                              className="flex-1 h-7 bg-slate-800 border-slate-700 text-slate-100 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-200">Footer <span className="font-normal text-slate-500">(optional)</span></h3>
                    <Input
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder="Reply STOP to unsubscribe"
                      className="bg-slate-800 border-slate-700 text-slate-100"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>No variables allowed</span>
                      <span className={footerText.length > FOOTER_MAX ? "text-red-400" : ""}>{footerText.length}/{FOOTER_MAX}</span>
                    </div>
                    {touched.footerText && step2Errors.footerText && <p className="text-xs text-red-400">{step2Errors.footerText}</p>}
                  </section>

                  <section className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-200">Buttons <span className="font-normal text-slate-500">(optional, up to 3)</span></h3>
                      {buttons.length < 3 && (
                        <button type="button" onClick={addButton} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200">
                          <Plus className="h-3 w-3" /> Add button
                        </button>
                      )}
                    </div>
                    {buttons.map((btn) => (
                      <div key={btn.id} className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-2">
                        <Select value={btn.type} onValueChange={(v: string | null) => { if (v) updateButton(btn.id, { type: v, value: "" }) }}>
                          <SelectTrigger className="w-36 h-8 bg-slate-800 border-slate-700 text-slate-100 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {BUTTON_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex-1 space-y-1">
                          <Input value={btn.text} onChange={(e) => updateButton(btn.id, { text: e.target.value })} placeholder="Button label" className="h-7 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
                          {btn.type !== "QUICK_REPLY" && (
                            <Input value={btn.value} onChange={(e) => updateButton(btn.id, { value: e.target.value })} placeholder={btn.type === "URL" ? "https://example.com" : "+91XXXXXXXXXX"} className="h-7 bg-slate-800 border-slate-700 text-slate-100 text-xs" />
                          )}
                          {(step2Errors[`button_${btn.id}`] || step2Errors[`button_${btn.id}_value`]) && (
                            <p className="text-[11px] text-red-400">{step2Errors[`button_${btn.id}`] || step2Errors[`button_${btn.id}_value`]}</p>
                          )}
                        </div>
                        <button type="button" onClick={() => removeButton(btn.id)} className="text-slate-500 hover:text-red-400 mt-0.5">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </section>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-white">Submit for review</h2>
              <p className="text-sm text-slate-400">Review your template before sending it to Meta for approval.</p>

              <dl className="divide-y divide-slate-800 rounded-lg border border-slate-700">
                {([
                  ["Name", name || "—"],
                  ["Category", category],
                  ["Language", LANGUAGES.find((l) => l.value === language)?.label],
                  ["Header", headerType === "none" ? "None" : `${headerType} — ${headerContent || "—"}`],
                  ["Body", effectiveBody || "—"],
                  ["Footer", footerText || "—"],
                  ["Buttons", category === "Authentication" ? (authMethod === "copy" ? "Copy code" : "One-tap autofill") : buttons.length ? buttons.map((b) => b.text).join(", ") : "None"],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex gap-4 px-4 py-2.5 text-sm">
                    <dt className="w-28 shrink-0 text-slate-500">{k}</dt>
                    <dd className="whitespace-pre-wrap text-slate-200">{v}</dd>
                  </div>
                ))}
              </dl>

              {submitError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-xs text-red-400">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {submitError}
                </div>
              )}
              {submitResult && (
                <div className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${statusStyles[submitResult.status] || statusStyles.Pending}`}>
                  <span>Submitted — status: <strong>{submitResult.status}</strong></span>
                  <button type="button" onClick={() => { discard(); onComplete?.() }} className="flex items-center gap-1 underline">
                    <RotateCcw className="h-3 w-3" /> Create another
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PREVIEW */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-200">Template Preview</p>
            <div
              className="relative min-h-[300px] overflow-hidden rounded-lg px-3 py-4"
              style={{ backgroundColor: "#0b141a", backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "14px 14px" }}
            >
              <div className="ml-auto max-w-[92%] rounded-xl rounded-tr-sm bg-slate-700 px-3 py-2">
                {headerType === "text" && headerContent && (
                  <p className="mb-1 text-[13px] font-semibold text-slate-100">{previewHeaderText}</p>
                )}
                {headerType === "image" && (
                  <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded-lg bg-slate-600">
                    {headerContent && /^https?:\/\//i.test(headerContent) && !mediaPreviewError ? (
                      <img
                        src={headerContent}
                        alt="Header preview"
                        className="h-full w-full object-cover rounded-lg"
                        onError={() => setMediaPreviewError(true)}
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                )}
                {headerType === "video" && (
                  <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded-lg bg-slate-600">
                    {headerContent && /^https?:\/\//i.test(headerContent) && !mediaPreviewError ? (
                      <video
                        src={headerContent}
                        className="h-full w-full object-cover rounded-lg"
                        onError={() => setMediaPreviewError(true)}
                        muted
                        playsInline
                      />
                    ) : (
                      <Video className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                )}
                {headerType === "document" && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-600 px-3 py-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-300">document.pdf</span>
                  </div>
                )}

                <p className={`whitespace-pre-wrap text-[13px] leading-snug ${isPlaceholderContent ? "text-slate-500" : "text-slate-100"}`}>
                  {previewBody}
                </p>

                {footerText && <p className="mt-1 text-[11px] text-slate-400">{footerText}</p>}

                <div className="mt-1 flex items-center justify-end gap-1">
                  <span className="text-[10px] text-slate-400">11:59</span>
                  <CheckCheck className="h-3 w-3 text-sky-400" />
                </div>
              </div>

              {previewButtons.length > 0 && (
                <div className="ml-auto mt-1 max-w-[92%] space-y-px overflow-hidden rounded-lg bg-slate-700">
                  {previewButtons.map((b, i) => {
                    const Icon = b.icon
                    return (
                      <div key={i} className="flex items-center justify-center gap-1.5 border-t border-slate-600 py-2 text-[12px] font-medium text-primary first:border-t-0">
                        <Icon className="h-3.5 w-3.5" />
                        {b.label}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {step === 1 && (
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-4 text-xs">
              <p className="font-semibold text-slate-200">This template is good for</p>
              <p className="mt-1 text-slate-400">{CATEGORY_META[category].goodFor}</p>
              <p className="mt-3 font-semibold text-slate-200">Template areas you can customize</p>
              <p className="mt-1 text-slate-400">{CATEGORY_META[category].customize}</p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER BAR */}
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
        <Button variant="outline" onClick={() => { discard(); onComplete?.() }} className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white">
          Discard
        </Button>
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white">
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => {
                if (step === 2) {
                  setTouched({ name: true, bodyText: true, headerContent: true, footerText: true })
                  if (step2HasErrors) return
                }
                setStep((s) => s + 1)
              }}
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !!submitResult}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Submitting..." : "Submit for review"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
