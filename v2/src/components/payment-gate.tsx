"use client";

import { CreditCard, Loader2, CheckCircle2, Headphones, Users, FileText, Radio, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoLockup } from "@/components/logo-lockup";
import { useRazorpayCheckout } from "@/hooks/use-razorpay-checkout";
import { useSubscriptionPlans } from "@/hooks/use-subscription-plans";

const FEATURES = [
  { icon: Headphones, label: "Real person chat support" },
  { icon: Users, label: "Unlimited contacts" },
  { icon: FileText, label: "Unlimited templates" },
  { icon: Radio, label: "Unlimited broadcasts" },
  { icon: Zap, label: "Unlimited automations" },
];

interface PaymentGateProps {
  onSuccess: () => Promise<void>;
}

export function PaymentGate({ onSuccess }: PaymentGateProps) {
  const { pay, paying } = useRazorpayCheckout({ onSuccess });
  const { plans, loading, error } = useSubscriptionPlans();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white text-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header / Logo */}
        <div className="flex items-center justify-center mb-6">
          <LogoLockup size="lg" />
        </div>

        {/* Page title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
            Complete your WhatsApp Business setup
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Grow by Chat is a verified Meta Tech Provider. Choose your plan to unlock the full platform and start messaging.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <p className="text-sm text-slate-500">Loading plans...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>Failed to load plans: {error}. Please refresh.</p>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl border bg-white p-6 sm:p-8 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1 ${
                plan.id === "yearly"
                  ? "border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-100"
                  : "border-emerald-100"
              }`}
            >
              {plan.id === "yearly" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold px-4 py-1 rounded-full tracking-wider uppercase">
                  Best Value
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-2">
                  {plan.label}
                </h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900">₹{plan.amount.toLocaleString("en-IN")}</span>
                  <span className="text-slate-500 text-sm font-medium">{plan.suffix}</span>
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  {plan.id === "monthly" && "Billed every month"}
                  {plan.id === "quarterly" && `Billed every 3 months (₹${Math.round(plan.amount / 3).toLocaleString("en-IN")} x 3)`}
                  {plan.id === "yearly" && `Billed every year (₹${Math.round(plan.amount / 12).toLocaleString("en-IN")} x 12)`}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {FEATURES.map((f) => (
                  <div key={f.label} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    <span className="text-sm text-slate-700 font-medium">{f.label}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => pay(plan)}
                disabled={!!paying}
                size="lg"
                className={`w-full text-base font-bold h-12 ${
                  plan.id === "yearly"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                {paying === plan.id ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Choose {plan.label}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Trust note */}
        <p className="text-xs text-center text-slate-400 mt-8 max-w-xl mx-auto">
          Secure payment via Razorpay. UPI, cards, net banking & wallets supported.
          <br />
          Subscription activates immediately after successful payment.
        </p>
      </div>
    </div>
  );
}
