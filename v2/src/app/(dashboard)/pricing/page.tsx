"use client"

import { useState } from "react"
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
  Eye,
} from "lucide-react"

interface WaBubbleProps {
  category: string
  children: React.ReactNode
}

function WaBubble({ category, children }: WaBubbleProps) {
  return (
    <div className="w-[260px] rounded-lg bg-[#0b141a] p-2.5 shadow-2xl shadow-black/40 ring-1 ring-white/5">
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="h-6 w-6 rounded-full bg-[#1f2c34] flex items-center justify-center text-[10px] text-emerald-400 font-bold">
          B
        </div>
        <div>
          <p className="text-[11px] text-emerald-400 font-medium leading-none">Your Business</p>
          <p className="text-[9px] text-muted-foreground leading-none mt-0.5">{category} template</p>
        </div>
      </div>
      <div className="rounded-lg bg-[#1f2c34] p-2.5 relative">
        <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-[#0b141a] rounded-br-sm" />
        {children}
      </div>
      <p className="text-[9px] text-muted-foreground mt-1 px-1">9:41 AM ✓✓</p>
    </div>
  )
}

function MarketingPreview() {
  return (
    <WaBubble category="Marketing">
      <span className="inline-block rounded-sm bg-amber-500/20 text-amber-400 text-[8px] font-bold px-1 py-px mb-1.5 tracking-wider">
        MARKETING
      </span>
      <p className="text-[11px] text-foreground leading-relaxed">
        🔥 Flash Sale this Weekend!
        <br />
        Get 50% off on all clinic websites. Book now and go live in 48 hours.
        <br />
        <br />
        Tap to claim your offer →
      </p>
    </WaBubble>
  )
}

function UtilityPreview() {
  return (
    <WaBubble category="Utility">
      <span className="inline-block rounded-sm bg-emerald-500/20 text-emerald-400 text-[8px] font-bold px-1 py-px mb-1.5 tracking-wider">
        UTILITY
      </span>
      <p className="text-[11px] text-foreground leading-relaxed">
        Your order #1234 has been shipped!
        <br />
        <br />
        📦 Expected delivery: Tomorrow by 7 PM
        <br />
        🚚 Track: track.example.com/1234
      </p>
    </WaBubble>
  )
}

function AuthenticationPreview() {
  return (
    <WaBubble category="Authentication">
      <span className="inline-block rounded-sm bg-emerald-500/20 text-emerald-400 text-[8px] font-bold px-1 py-px mb-1.5 tracking-wider">
        AUTHENTICATION
      </span>
      <p className="text-[11px] text-foreground leading-relaxed">
        Your verification code is:
      </p>
      <p className="text-[22px] font-bold text-white tracking-[0.25em] my-1.5">4 8 2 9 1 7</p>
      <p className="text-[10px] text-muted-foreground">
        Don't share this code with anyone.
      </p>
      <div className="mt-2 rounded-md bg-[#00a884]/15 border border-[#00a884]/30 py-1.5 text-center">
        <span className="text-[11px] text-[#00a884] font-medium">Copy Code</span>
      </div>
    </WaBubble>
  )
}

function ServicePreview() {
  return (
    <div className="w-[260px] rounded-lg bg-[#0b141a] p-2.5 shadow-2xl shadow-black/40 ring-1 ring-white/5">
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[10px] text-foreground font-bold">
          C
        </div>
        <p className="text-[11px] text-muted-foreground font-medium leading-none">Customer</p>
      </div>
      <div className="rounded-lg bg-[#005c4b] p-2.5 relative mb-2 ml-6">
        <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-[#0b141a] rounded-br-sm" />
        <p className="text-[11px] text-foreground leading-relaxed">
          Hi, I need help with my order
        </p>
        <p className="text-[9px] text-emerald-500/60 mt-1 text-right">9:40 AM</p>
      </div>
      <div className="flex items-center gap-2 mb-1 px-1">
        <div className="h-6 w-6 rounded-full bg-[#1f2c34] flex items-center justify-center text-[10px] text-emerald-400 font-bold">
          B
        </div>
        <p className="text-[11px] text-emerald-400 font-medium leading-none">Your Business</p>
      </div>
      <div className="rounded-lg bg-[#1f2c34] p-2.5 relative">
        <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-[#0b141a] rounded-br-sm" />
        <span className="inline-block rounded-sm bg-emerald-500/20 text-emerald-400 text-[8px] font-bold px-1 py-px mb-1.5 tracking-wider">
          FREE REPLY
        </span>
        <p className="text-[11px] text-foreground leading-relaxed">
          Hi! Let me check that for you right away. Can you share your order ID?
        </p>
      </div>
      <p className="text-[9px] text-muted-foreground mt-1 px-1">9:41 AM ✓✓</p>
    </div>
  )
}

const RATE_CARDS = [
  {
    category: "Marketing",
    icon: Radio,
    rate: "₹0.86 – ₹0.90",
    borderCls: "border-amber-900/40",
    bgCls: "bg-amber-950/20",
    hoverBgCls: "hover:bg-amber-950/30",
    iconCls: "text-amber-400",
    labelCls: "text-amber-300",
    rateCls: "text-amber-400",
    subCls: "text-amber-500/80",
    useCase: "Promotions, product launches, re-engagement campaigns",
    example: 'e.g. "50% off sale this weekend!"',
    preview: MarketingPreview,
  },
  {
    category: "Utility",
    icon: Zap,
    rate: "₹0.11 – ₹0.15",
    borderCls: "border-emerald-900/40",
    bgCls: "bg-emerald-950/20",
    hoverBgCls: "hover:bg-emerald-950/30",
    iconCls: "text-emerald-400",
    labelCls: "text-emerald-300",
    rateCls: "text-emerald-400",
    subCls: "text-emerald-500/80",
    useCase: "Order confirmations, delivery updates, account alerts",
    example: 'e.g. "Your order #1234 has shipped!"',
    preview: UtilityPreview,
  },
  {
    category: "Authentication",
    icon: Shield,
    rate: "₹0.11 – ₹0.15",
    borderCls: "border-emerald-900/40",
    bgCls: "bg-emerald-950/20",
    hoverBgCls: "hover:bg-emerald-950/30",
    iconCls: "text-emerald-400",
    labelCls: "text-emerald-300",
    rateCls: "text-emerald-400",
    subCls: "text-emerald-500/80",
    useCase: "OTPs, login codes, identity verification",
    example: 'e.g. "Your OTP is 482917"',
    preview: AuthenticationPreview,
  },
  {
    category: "Service",
    icon: MessageSquare,
    rate: "Free",
    borderCls: "border-primary/30",
    bgCls: "bg-primary/5",
    hoverBgCls: "hover:bg-primary/10",
    iconCls: "text-primary",
    labelCls: "text-primary",
    rateCls: "text-primary",
    subCls: "text-primary/60",
    useCase: "Replies within the 24-hour customer service window",
    example: "e.g. Any reply after a customer messages you",
    preview: ServicePreview,
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
    iconCls: "text-muted-foreground",
    bgCls: "bg-secondary/30 border-border/50",
    title: "GST",
    description:
      "18% GST applies on top of your total monthly Meta bill. Factor this into your cost calculations.",
  },
]

function RateCard({ card }: { card: typeof RATE_CARDS[number] }) {
  const [hovered, setHovered] = useState(false)
  const Preview = card.preview

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`rounded-xl border ${card.borderCls} ${card.bgCls} ${card.hoverBgCls} p-5 transition-all duration-200 cursor-default`}
      >
        <div className="flex items-center gap-2 mb-3">
          <card.icon className={`h-4 w-4 ${card.iconCls}`} />
          <span className={`text-sm font-medium ${card.labelCls}`}>
            {card.category}
          </span>
          <Eye className={`ml-auto h-3.5 w-3.5 transition-opacity duration-200 ${hovered ? "opacity-100 text-foreground" : "opacity-0"}`} />
        </div>
        <p className={`text-2xl font-bold ${card.rateCls}`}>
          {card.rate}
        </p>
        <p className={`text-xs ${card.subCls} mt-1`}>{card.useCase}</p>
        <p className="text-[10px] text-muted-foreground mt-2 italic">
          {card.example}
        </p>
      </div>
      <div
        className={`absolute z-50 top-1/2 -translate-y-1/2 transition-all duration-200 pointer-events-none ${
          hovered
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-2"
        }`}
        style={{ left: "calc(100% + 12px)" }}
      >
        <Preview />
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <IndianRupee className="h-6 w-6 text-primary" />
          Messaging Rates
          <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            India
          </span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Per-message pricing for WhatsApp Business API in India. Hover over a card to see how it looks in WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {RATE_CARDS.map((card) => (
          <RateCard key={card.category} card={card} />
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
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
                <h3 className="text-sm font-medium text-foreground">
                  {tip.title}
                </h3>
                <p className="text-sm text-foreground mt-1">
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
            <p className="text-sm text-foreground mt-1">
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
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
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
                <h3 className="text-sm font-medium text-foreground">
                  {warning.title}
                </h3>
                <p className="text-sm text-foreground mt-1">
                  {warning.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Rate Calculation Example
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              1,000 marketing messages delivered in a month
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              1,000 × ₹0.88 = <span className="text-foreground font-medium">₹880</span>
            </p>
            <p className="text-xs text-muted-foreground">
              + 18% GST = <span className="text-foreground">₹158.40</span>
            </p>
            <p className="text-sm font-bold text-foreground mt-1">
              Total: ₹1,038.40
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        Rates shown are Meta's base charges for India as of June 2026. Actual
        costs may vary based on currency conversion and Meta's latest pricing.
        These are per-delivered-message rates — messages that fail to deliver
        are not charged.
      </p>
    </div>
  )
}
