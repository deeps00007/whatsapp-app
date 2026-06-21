"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useTotalUnread } from "@/hooks/use-total-unread";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  GitBranch,
  Radio,
  Zap,
  Workflow,
  Settings,
  LogOut,
  User,
  X,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Shield,
  Phone,
  FileText,
  Info,
  IndianRupee,
} from "lucide-react";
import { useRealtimeTable, type RealtimeTableEvent } from "@/hooks/use-realtime-table";
import type { WhatsAppConfig } from "@/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /**
   * When true, the nav row renders a small "Beta" chip after the label.
   * Purely informational — doesn't affect routing or access.
   */
  beta?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/pipelines", label: "Pipelines", icon: GitBranch },
  { href: "/broadcasts", label: "Broadcasts", icon: Radio },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/automations", label: "Automations", icon: Zap },
  { href: "/flows", label: "Flows", icon: Workflow, beta: true },
];

const bottomNavItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

function AccountStatus() {
  const [status, setStatus] = useState<{
    connected: boolean;
    payment_method_connected: boolean;
    phone_verified: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) setUserId(session.user.id);
      } catch (_) { /* silent */ }
    })();
    return () => { mounted = false; };
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/payment-status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (_) { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchStatus();
  }, [userId, fetchStatus]);

  useRealtimeTable<WhatsAppConfig>({
    table: "whatsapp_config",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    channelName: userId ? `sidebar:whatsapp_config:${userId}` : undefined,
    enabled: !!userId,
    onEvent: (event: RealtimeTableEvent<WhatsAppConfig>) => {
      if (event.eventType === "UPDATE") {
        fetchStatus();
      }
      if (event.eventType === "INSERT") {
        fetchStatus();
      }
    },
  });

  if (loading || !status?.connected) return null;

  const allGood = status.phone_verified && status.payment_method_connected;

  if (allGood) {
    return (
      <div className="mx-3 mt-2 rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-3">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">Account ready</span>
        </div>
        <p className="text-[10px] text-emerald-500 mt-1">Phone verified &amp; payment active</p>
      </div>
    );
  }

  return (
    <div className="mx-3 mt-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-3.5 text-amber-400" />
        <span className="text-xs font-medium text-amber-400">Setup needed</span>
      </div>
      {!status.phone_verified && (
        <Link
          href="/settings?tab=whatsapp"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <Shield className="size-3" />
          Verify phone number
        </Link>
      )}
      {!status.payment_method_connected && (
        <a
          href="https://business.facebook.com/settings/payment-methods/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <CreditCard className="size-3" />
          Add payment method
          <ExternalLink className="size-2.5" />
        </a>
      )}
    </div>
  );
}

interface SidebarProps {
  /** Controlled on mobile by the Header's hamburger button. Ignored on lg+. */
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const totalUnread = useTotalUnread();

  // Close the drawer when route changes — users opened it to navigate,
  // so once they pick a destination the drawer should get out of the way.
  useEffect(() => {
    onClose?.();
    // Only pathname drives this — onClose identity doesn't need to re-run it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll and allow Escape to close while the drawer is open on
  // mobile. No-ops on desktop because the sidebar isn't positioned there.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop — only exists on mobile and only when open. Clicking
          it closes the drawer. Hidden from lg+ since the sidebar is
          part of the main flex row there. */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm transition-opacity lg:hidden",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          // Mobile: fixed drawer that slides in from the left.
          "fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col border-r border-slate-800 bg-slate-900",
          "transition-transform duration-200 ease-out will-change-transform",
          open ? "translate-x-0" : "-translate-x-full",
          // Desktop: static, always visible — reset all the mobile framing.
          "lg:static lg:z-0 lg:w-60 lg:translate-x-0 lg:transition-none",
        )}
        aria-label="Primary"
      >
        {/* Logo row. On mobile we put a close button here; on desktop the
            close button is hidden since the sidebar is always-visible. */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-800 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-white">
              CRM Template for WhatsApp
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              const showUnreadDot =
                item.href === "/inbox" && totalUnread > 0 && !isActive;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      // Taller on mobile so fingers can hit the row reliably (≥44px).
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:py-2",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.beta && (
                      <span
                        aria-label="Beta feature"
                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300"
                      >
                        Beta
                      </span>
                    )}
                    {showUnreadDot && (
                      <span
                        aria-label={`${totalUnread} unread conversation${totalUnread === 1 ? "" : "s"}`}
                        className="relative flex h-2 w-2"
                      >
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="my-4 border-t border-slate-800" />

          <ul className="flex flex-col gap-1">
            <li>
              <Dialog>
                <DialogTrigger
                  render={
                    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:py-2" />
                  }
                >
                  <Info className="h-4 w-4" />
                  Pricing Info
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-700 sm:max-w-lg p-0">
                  <DialogHeader className="p-5 pb-4 border-b border-slate-800">
                    <DialogTitle className="text-white flex items-center gap-2.5 text-base">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <IndianRupee className="h-4 w-4 text-primary" />
                      </div>
                      Meta Messaging Rates
                      <span className="ml-auto text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">India</span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Radio className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-xs font-medium text-amber-300">Marketing</span>
                        </div>
                        <p className="text-lg font-bold text-amber-400">₹0.86<span className="text-xs font-normal text-amber-500"> – ₹0.90</span></p>
                        <p className="text-[10px] text-amber-500/80 mt-1">Promos, launches, re-engagement</p>
                      </div>
                      <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Zap className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-xs font-medium text-emerald-300">Utility</span>
                        </div>
                        <p className="text-lg font-bold text-emerald-400">₹0.11<span className="text-xs font-normal text-emerald-500"> – ₹0.15</span></p>
                        <p className="text-[10px] text-emerald-500/80 mt-1">Confirmations, updates, alerts</p>
                      </div>
                      <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Shield className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-xs font-medium text-emerald-300">Authentication</span>
                        </div>
                        <p className="text-lg font-bold text-emerald-400">₹0.11<span className="text-xs font-normal text-emerald-500"> – ₹0.15</span></p>
                        <p className="text-[10px] text-emerald-500/80 mt-1">OTPs, login codes, verification</p>
                      </div>
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">Service</span>
                        </div>
                        <p className="text-lg font-bold text-primary">Free</p>
                        <p className="text-[10px] text-primary/60 mt-1">Replies within 24h window</p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-primary">Pro Tip</span>
                      </div>
                      <p className="text-xs text-slate-300">Utility messages are <span className="text-emerald-400 font-medium">free</span> when sent within the 24-hour customer service window (after the customer messages you first).</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Things to Know</h4>
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2.5 rounded-md bg-slate-800/40 p-2.5">
                          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-[9px] text-primary font-bold">72h</span>
                          </div>
                          <p className="text-xs text-slate-300"><span className="text-white font-medium">Click-to-WhatsApp Ads</span> — 72-hour free window opens for all message types when a customer contacts you via an ad.</p>
                        </div>
                        <div className="flex items-start gap-2.5 rounded-md bg-slate-800/40 p-2.5">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                          <p className="text-xs text-slate-300"><span className="text-white font-medium">BSP Markups</span> — Platforms like Interakt, WATI, AiSensy add 10–30% on top of these base rates.</p>
                        </div>
                        <div className="flex items-start gap-2.5 rounded-md bg-slate-800/40 p-2.5">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                          <p className="text-xs text-slate-300"><span className="text-white font-medium">International OTP</span> — Sending OTPs from a non-India WABA costs significantly more. Always use a locally registered WABA.</p>
                        </div>
                        <div className="flex items-start gap-2.5 rounded-md bg-slate-800/40 p-2.5">
                          <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                          <p className="text-xs text-slate-300"><span className="text-white font-medium">GST</span> — 18% GST applies on top of your total monthly Meta bill.</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-600 border-t border-slate-800 pt-3">
                      Rates are Meta's base charges for India. Actual costs may vary. Verified June 2026.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </li>
            {bottomNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:py-2",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
           </ul>

           <AccountStatus />
         </nav>

        {/* User section */}
        <div className="shrink-0 border-t border-slate-800 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-800/60 focus:bg-slate-800/60 focus:outline-none data-popup-open:bg-slate-800/60">
              <Avatar className="size-8 shrink-0">
                {profile?.avatar_url ? (
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Avatar"}
                  />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                  {profile?.full_name?.charAt(0)?.toUpperCase() ??
                    profile?.email?.charAt(0)?.toUpperCase() ??
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {profile?.full_name ?? "User"}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {profile?.email ?? ""}
                </p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              sideOffset={6}
              className="min-w-56 bg-slate-900 text-slate-100 ring-slate-700"
            >
              <DropdownMenuItem
                render={
                  <Link
                    href="/settings?tab=profile"
                    onClick={onClose}
                    className="text-slate-200 focus:bg-slate-800 focus:text-white"
                  />
                }
              >
                <User className="size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                render={
                  <Link
                    href="/settings?tab=whatsapp"
                    onClick={onClose}
                    className="text-slate-200 focus:bg-slate-800 focus:text-white"
                  />
                }
              >
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                onClick={signOut}
                className="text-slate-200 focus:bg-slate-800 focus:text-white"
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
