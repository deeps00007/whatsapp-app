"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  IndianRupee,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Loader2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useRazorpayCheckout, type SubscriptionPlan } from "@/hooks/use-razorpay-checkout";
import { useSubscriptionPlans } from "@/hooks/use-subscription-plans";
import { cn } from "@/lib/utils";

function getDaysLeft(expiresAt?: string | null): number | null {
  if (!expiresAt) return null;
  const end = new Date(expiresAt);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function planMeta(plans: SubscriptionPlan[], planId?: string | null) {
  return plans.find((p) => p.id === planId) ?? plans.find((p) => p.id === "monthly") ?? plans[0];
}

function AlertBanner({ daysLeft }: { daysLeft: number | null }) {
  if (daysLeft === null) return null;
  if (daysLeft <= 3) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div>
            <p className="font-semibold text-red-300">Your subscription expires in {daysLeft} day{daysLeft === 1 ? "" : "s"}</p>
            <p className="text-red-300/80 mt-1">
              Renew now to avoid losing access to your dashboard, automations, and WhatsApp inbox.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (daysLeft <= 7) {
    return (
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-200">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-300">Your subscription expires in {daysLeft} days</p>
            <p className="text-amber-300/80 mt-1">
              Renew soon to keep your account active without interruption.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (daysLeft <= 30) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-foreground">Your subscription expires in {daysLeft} days</p>
            <p className="text-muted-foreground mt-1">
              You can renew early to extend your current expiry date.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function BillingPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const { pay, paying } = useRazorpayCheckout({
    renewal: true,
    onSuccess: () => router.refresh(),
  });
  const { plans, loading } = useSubscriptionPlans();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const expiresAt = profile?.subscription_expires_at;
  const planId = profile?.subscription_plan ?? "monthly";
  const plan = planMeta(plans, planId);
  const daysLeft = getDaysLeft(expiresAt);
  const activePlan = plans.find((p) => p.id === selectedPlan) ?? null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-primary" />
          Billing
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your Grow by Chat platform subscription.
        </p>
      </div>

      <AlertBanner daysLeft={daysLeft} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Current subscription
          </CardTitle>
          <CardDescription>
            Details of your active platform plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Plan</p>
              <p className="text-lg font-semibold text-foreground mt-1">{plan?.label ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">{plan ? `₹${plan.amount.toLocaleString("en-IN")} ${plan.suffix}` : "—"}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
              <p className={cn("text-lg font-semibold mt-1", daysLeft && daysLeft > 0 ? "text-emerald-500" : "text-red-500")}>
                {daysLeft && daysLeft > 0 ? "Active" : "Expired"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {daysLeft !== null ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "No subscription"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Renews on</p>
              <p className="text-lg font-semibold text-foreground mt-1 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {expiresAt ? format(new Date(expiresAt), "dd MMM yyyy") : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{expiresAt ? format(new Date(expiresAt), "hh:mm a") : ""}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary" />
            Renew or upgrade
          </CardTitle>
          <CardDescription>
            Pick a plan to renew. If you already have active days, the new period is added to your current expiry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading plans...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map((p) => {
                  const selected = selectedPlan === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlan(p.id)}
                      className={cn(
                        "relative rounded-xl border p-4 text-left transition-all",
                        selected
                          ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                          : "border-border bg-secondary/30 hover:border-emerald-500/50",
                      )}
                    >
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{p.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">₹{p.amount.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-muted-foreground mt-1">{p.suffix}</p>
                      {p.id === "yearly" && (
                        <span className="absolute top-3 right-3 text-[9px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">
                          Best
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-secondary/20">
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    {activePlan ? `Renew with ${activePlan.label}` : "Select a plan above"}
                  </p>
                  {activePlan && (
                    <p className="text-muted-foreground text-xs mt-1">
                      ₹{activePlan.amount.toLocaleString("en-IN")} for {activePlan.periodDays} days
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => activePlan && pay(activePlan)}
                  disabled={!activePlan || !!paying}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pay now
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Need help with billing? Contact support via the chat widget or email{" "}
          <Link href="mailto:hello@growbychat.com" className="text-primary hover:underline">
            hello@growbychat.com
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
