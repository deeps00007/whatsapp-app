"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
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

export interface SubscriptionPlan {
  id: string;
  label: string;
  amount: number;
  periodDays: number;
  suffix?: string;
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

export function useRazorpayCheckout({
  onSuccess,
  renewal = false,
}: {
  onSuccess?: () => Promise<void> | void;
  renewal?: boolean;
} = {}) {
  const { user, profile } = useAuth();
  const [paying, setPaying] = useState<string | null>(null);

  const pay = useCallback(
    async (plan: SubscriptionPlan) => {
      setPaying(plan.id);
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || !window.Razorpay) {
          toast.error("Failed to load Razorpay checkout. Check your connection or ad blockers.");
          setPaying(null);
          return;
        }

        const orderRes = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: plan.id }),
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
                  plan: plan.id,
                  renewal,
                }),
              });

              if (verifyRes.ok) {
                toast.success(
                  renewal
                    ? "Subscription renewed! Your access is extended."
                    : "Payment successful! Welcome to Grow by Chat.",
                );
                await onSuccess?.();
              } else {
                const err = await verifyRes.json().catch(() => ({}));
                toast.error(
                  err.error ||
                    "Payment verification failed. Contact support if money was debited.",
                );
              }
            } catch {
              toast.error(
                "Payment verification failed. Contact support if money was debited.",
              );
            }
            setPaying(null);
          },
          modal: {
            ondismiss: () => {
              toast.info(
                renewal
                  ? "Payment cancelled. You can renew anytime before expiry."
                  : "Payment cancelled. Complete the payment to access your dashboard.",
              );
              setPaying(null);
            },
          },
        });

        rzp.open();
      } catch {
        toast.error("Something went wrong. Please try again.");
        setPaying(null);
      }
    },
    [user, profile, onSuccess, renewal],
  );

  return { pay, paying };
}
