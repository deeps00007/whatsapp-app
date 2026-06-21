"use client"

import {
  IndianRupee,
  Radio,
  Zap,
  Shield,
  MessageSquare,
  AlertTriangle,
  CreditCard,
  Lightbulb,
  Clock,
  Globe,
  ArrowRight,
} from "lucide-react"

const RATE_CARDS = [
  {
    category: "Marketing",
    icon: Radio,
    rate: "₹0.86 – ₹0.90",
    color: "amber",
    borderCls: "border-amber-900/40",
    bgCls: "bg-amber-950/20",
    iconCls: "text-amber-400",
    labelCls: "text-amber-300",
    rateCls: "text-amber-400",
    subCls: "text-amber-500/80",
    useCase: "Promotions, product launches, re-engagement campaigns",
    example: "e.g. \"50% off sale this weekend!\"",
  },
  {
    category: "Utility",
    icon: Zap,
    rate: "₹0.11 – ₹0.15",
    color: "emerald",
    borderCls: "border-emerald-900/40",
    bgCls: "bg-emerald-950/20",
    iconCls: "text-emerald-400",
    labelCls: "text-emerald-300",
    rateCls: "text-emerald-400",
    subCls: "text-emerald-500/80",
    useCase: "Order confirmations, delivery updates, account alerts",
    example: "e.g. \"Your order #1234 has shipped!\"",
  },
  {
    category: "Authentication",
    icon: Shield,
    rate: "₹0.11 – ₹0.15",
    color: "emerald",
    borderCls: "border-emerald-900/40",
    bgCls: "bg-emerald-950/20",
    iconCls: "text-emerald-400",
    labelCls: "text-emerald-300",
    rateCls: "text-emerald-400",
    subCls: "text-emerald-500/80",
    useCase: "OTPs, login codes, identity verification",
    example: "e.g. \"Your OTP is 482917\"",
  },
  {
    category: "Service",
    icon: MessageSquare,
    rate: "Free",
    color: "primary",
    borderCls: "border-primary/30",
    bgCls: "bg-primary/5",
    iconCls: "text-primary",
    labelCls: "text-primary",
    rateCls: "text-primary",
    subCls: "text-primary/60",
    useCase: "Replies within the 24-hour customer service window",
    example: "e.g. Any reply after a customer messages you",
  },
]

const TIPS = [
  {
    icon: Lightbulb,
    iconCls: "text-primary",
    bgCls: "bg-primary/5 border-primary/20",
    title: "24-Hour Service Window",
    description:
      "When a customer messages you, a 24-hour window opens. All replies during this window are FREE — regardless of template category.",
  },
  {
    icon: Clock,
    iconCls: "text-primary",
    bgCls: "bg-primary/5 border-primary/20",
    title: "Click-to-WhatsApp Ads",
    description:
      "If a customer reaches you via a Click-to-WhatsApp ad, a 72-hour free messaging window opens for all message types.",
  },
]

const WARNINGS = [
  {
    icon: AlertTriangle,
    iconCls: "text-amber-400",
    bgCls: "bg-amber-950/15 border-amber-900/30",
    title: "BSP Markups",
    description:
      "Business Solution Providers (Interakt, WATI, AiSensy) add 10–30% markup on top of Meta's base rates, plus platform subscription fees.",
  },
  {
    icon: Globe,
    iconCls: "text-amber-400",
    bgCls: "bg-amber-950/15 border-amber-900/30",
    title: "International Authentication",
    description:
      "Sending OTPs to Indian numbers from a non-India registered WABA incurs significantly higher rates. Always use a locally registered WABA for Indian traffic.",
  },
  {
    icon: CreditCard,
    iconCls: "text-slate-400",
    bgCls: "bg-slate-800/30 border-slate-700/50",
    title: "GST",
    description:
      "18% GST applies on top of your total monthly Meta bill. Factor this into your cost calculations.",
  },
]

export default function PricingPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <IndianRupee className="h-6 w-6 text-primary" />
          Messaging Rates
          <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            India
          </span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Per-message pricing for WhatsApp Business API in India. Rates are charged per delivered message.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {RATE_CARDS.map((card) => (
          <div
            key={card.category}
            className={`rounded-xl border ${card.borderCls} ${card.bgCls} p-5 transition-colors`}
          >
            <div className="flex items-center gap-2 mb-3">
              <card.icon className={`h-4 w-4 ${card.iconCls}`} />
              <span className={`text-sm font-medium ${card.labelCls}`}>
                {card.category}
              </span>
            </div>
            <p className={`text-2xl font-bold ${card.rateCls}`}>
              {card.rate}
            </p>
            <p className={`text-xs ${card.subCls} mt-1`}>{card.useCase}</p>
            <p className="text-[10px] text-slate-600 mt-2 italic">
              {card.example}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          How to Save on Costs
        </h2>
        {TIPS.map((tip) => (
          <div
            key={tip.title}
            className={`rounded-xl border ${tip.bgCls} p-4`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <tip.icon className={`h-4 w-4 ${tip.iconCls}`} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">
                  {tip.title}
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  {tip.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <ArrowRight className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-primary">
              Key Takeaway
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              <span className="text-emerald-400 font-medium">
                Utility messages are free
              </span>{" "}
              when sent within the 24-hour customer service window. Encourage
              customers to message you first — it unlocks free replies for any
              template category.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          Things to Watch Out For
        </h2>
        {WARNINGS.map((warning) => (
          <div
            key={warning.title}
            className={`rounded-xl border ${warning.bgCls} p-4`}
          >
            <div className="flex items-start gap-3">
              <warning.icon className={`mt-0.5 h-5 w-5 shrink-0 ${warning.iconCls}`} />
              <div>
                <h3 className="text-sm font-medium text-white">
                  {warning.title}
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  {warning.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-300">
              Rate Calculation Example
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              1,000 marketing messages delivered in a month
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">
              1,000 × ₹0.88 = <span className="text-white font-medium">₹880</span>
            </p>
            <p className="text-xs text-slate-500">
              + 18% GST = <span className="text-slate-300">₹158.40</span>
            </p>
            <p className="text-sm font-bold text-white mt-1">
              Total: ₹1,038.40
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 border-t border-slate-800 pt-4">
        Rates shown are Meta's base charges for India as of June 2026. Actual
        costs may vary based on currency conversion and Meta's latest pricing.
        These are per-delivered-message rates — messages that fail to deliver
        are not charged.
      </p>
    </div>
  )
}
