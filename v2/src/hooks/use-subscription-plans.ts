"use client";

import { useEffect, useState } from "react";
import type { SubscriptionPlan } from "@/hooks/use-razorpay-checkout";

const FALLBACK_PLANS: SubscriptionPlan[] = [
  { id: "monthly", label: "Monthly", amount: 899, periodDays: 30, suffix: "/month" },
  { id: "quarterly", label: "Quarterly", amount: 899 * 3, periodDays: 90, suffix: "/quarter" },
  { id: "yearly", label: "Yearly", amount: 899 * 12, periodDays: 365, suffix: "/year" },
];

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/plans", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load plans");
        const data = await res.json();
        const list = (data.plans ?? []).map((p: { id: string; label: string; amount: number; period_days: number }) => ({
          id: p.id,
          label: p.label,
          amount: p.amount,
          periodDays: p.period_days,
          suffix: p.id === "monthly" ? "/month" : p.id === "quarterly" ? "/quarter" : "/year",
        }));
        if (mounted) {
          setPlans(list.length ? list : FALLBACK_PLANS);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setPlans(FALLBACK_PLANS);
          setError(e instanceof Error ? e.message : "Could not load plans");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { plans, loading, error };
}
