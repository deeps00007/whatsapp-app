"use client";

import { useState } from "react";
import { CreditCard, Loader2, CheckCircle2, Headphones, Users, FileText, Radio, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogoLockup } from "@/components/logo-lockup";
import { useAuth } from "@/hooks/use-auth";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string };
  theme: { color: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const FEATURES = [
  { icon: Headphones, label: "Real person chat support" },
  { icon: Users, label: "Unlimited contacts" },
  { icon: FileText, label: "Unlimited templates" },
  { icon: Radio, label: "Unlimited broadcasts" },
  { icon: Zap, label: "Unlimited automations" },
];

const PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    amount: 899,
    periodDays: 30,
    suffix: "/month",
  },
  {
    id: "quarterly",
    label: "Quarterly",
    amount: 899 * 3,
    periodDays: 90,
    suffix: "/quarter",
  },
  {
    id: "yearly",
    label: "Yearly",
    amount: 899 * 12,
    periodDays: 365,
    suffix: "/year",
  },
];

interface PaymentGateProps {
  onSuccess: () => Promise<void>;
}

export function PaymentGate({ onSuccess }: PaymentGateProps) {
  const { user, profile } = useAuth();
  const [paying, setPaying] = useState<string | null>(null);

  const handlePay = async (plan: (typeof PLANS)[number]) => {
    setPaying(plan.id);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        toast.error("Failed to load Razorpay checkout. Check your connection.");
        setPaying(null);
        return;
      }

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id, amount: plan.amount }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        toast.error(err.error || "Failed to create payment order");
        setPaying(null);
        return;
      }

      const order = await orderRes.json();

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Grow by Chat",
        description: `${plan.label} platform subscription`,
        order_id: order.orderId,
        prefill: {
          name: profile?.full_name || "",
          email: user?.email || "",
        },
        theme: { color: "#25D366" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                periodDays: plan.periodDays,
              }),
            });

            if (verifyRes.ok) {
              toast.success("Payment successful! Welcome to Grow by Chat.");
              await onSuccess();
            } else {
              const err = await verifyRes.json().catch(() => ({}));
              toast.error(err.error || "Payment verification failed. Contact support if money was debited.");
            }
          } catch {
            toast.error("Payment verification failed. Contact support if money was debited.");
          }
          setPaying(null);
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled. Complete the payment to access your dashboard.");
            setPaying(null);
          },
        },
      });

      rzp.open();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setPaying(null);
    }
  };

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

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
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
                  {plan.id === "quarterly" && `Billed every 3 months (₹899 × 3)`}
                  {plan.id === "yearly" && `Billed every year (₹899 × 12)`}
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
                onClick={() => handlePay(plan)}
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
