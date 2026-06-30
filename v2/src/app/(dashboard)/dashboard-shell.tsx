"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, AlertTriangle, Clock, Sparkles } from "lucide-react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SupportWidget } from "@/components/support/support-widget";
import { PaymentGate } from "@/components/payment-gate";
import { cn } from "@/lib/utils";

function hasActiveSubscription(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
}

function isAdmin(profile: { role: string | null } | null): boolean {
  return profile?.role === 'admin';
}

function getDaysLeft(expiresAt?: string | null): number | null {
  if (!expiresAt) return null;
  const end = new Date(expiresAt);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function isAlertDismissed(): boolean {
  try {
    const raw = localStorage.getItem('renewal-alert-dismissed');
    if (!raw) return false;
    const dismissedAt = new Date(raw);
    const now = new Date();
    return now.getTime() - dismissedAt.getTime() < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function RenewalAlert({ expiresAt }: { expiresAt?: string | null }) {
  const [dismissed, setDismissed] = useState(() => isAlertDismissed());
  const daysLeft = getDaysLeft(expiresAt);

  if (dismissed || daysLeft === null || daysLeft > 30) return null;

  const urgent = daysLeft <= 3;
  const warning = daysLeft <= 7;

  return (
    <div
      className={cn(
        "mx-4 mt-3 rounded-xl border p-3 text-sm sm:mx-6",
        urgent
          ? "border-red-900/40 bg-red-950/20 text-red-200"
          : warning
          ? "border-amber-900/40 bg-amber-950/20 text-amber-200"
          : "border-primary/30 bg-primary/5 text-foreground"
      )}
    >
      <div className="flex items-start gap-3">
        {urgent ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
        ) : warning ? (
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        ) : (
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        )}
        <div className="flex-1">
          <p className={cn("font-semibold", urgent ? "text-red-300" : warning ? "text-amber-300" : "text-foreground")}>
            Your subscription expires in {daysLeft} day{daysLeft === 1 ? "" : "s"}
          </p>
          <p className="text-muted-foreground mt-1">
            {urgent
              ? "Renew now to keep your dashboard, automations, and WhatsApp inbox running."
              : "Head to Billing to renew early and extend your current expiry date."}
          </p>
          <Link
            href="/billing"
            className={cn(
              "mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline",
              urgent ? "text-red-300" : warning ? "text-amber-300" : "text-primary"
            )}
          >
            Go to Billing
          </Link>
        </div>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            try {
              localStorage.setItem('renewal-alert-dismissed', new Date().toISOString());
            } catch { /* ignore */ }
          }}
          className={cn(
            "rounded-md p-1 transition-colors",
            urgent
              ? "text-red-400 hover:bg-red-900/30"
              : warning
              ? "text-amber-400 hover:bg-amber-900/30"
              : "text-muted-foreground hover:bg-primary/10"
          )}
          aria-label="Dismiss renewal alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoading, refreshProfile } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verifying subscription...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin(profile) && !hasActiveSubscription(profile?.subscription_expires_at)) {
    return <PaymentGate onSuccess={refreshProfile} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <RenewalAlert expiresAt={profile?.subscription_expires_at} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
      <SupportWidget />
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </AuthProvider>
  );
}
