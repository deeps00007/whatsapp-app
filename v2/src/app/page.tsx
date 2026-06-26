"use client";

import Link from "next/link";
import Image from "next/image";
import { LogoLockup } from "@/components/logo-lockup";
import {
  Check,
  MessageCircle,
  MessageSquare,
  LayoutDashboard,
  Zap,
  Bot,
  Shield,
  Users,
  Radio,
  FileText,
  Workflow,
  GitBranch,
  ArrowRight,
  ChevronRight,
  Star,
  Sparkles,
  Award,
  Eye,
  Building2,
  TrendingUp,
  Coins,
  ShieldCheck,
  Server,
  Settings
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden selection:bg-emerald-500 selection:text-white" style={{ fontFamily: "var(--font-sans), Inter, sans-serif" }}>
      <style>{`
        .lp-heading { font-family: var(--font-heading), Raleway, sans-serif; }
        .grid-bg {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
        }
      `}</style>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/">
            <LogoLockup />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">Features</a>
            <a href="#calculator" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">Savings</a>
            <a href="#pricing" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">Reviews</a>
            <a href="#faq" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-emerald-600 px-3 py-2 transition-colors">Login</Link>
            <Link href="/signup" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold px-4 py-2.5 shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all hover:-translate-y-0.5">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 grid-bg overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-200/40 to-green-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-blue-100/30 rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Ecosystem / Partners Badge */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="flex items-center gap-4 text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 select-none">
              <div className="h-[1px] w-6 bg-emerald-200" />
              <span>Ecosystem Partner</span>
              <div className="h-[1px] w-6 bg-emerald-200" />
            </div>

            {/* Combined Brand Lockup without surrounding card */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 select-none">
              {/* Grow by Chat Brand */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 font-sans">
                  Grow by <span className="text-emerald-500">Chat</span>
                </span>
              </div>

              {/* Large Orange '✕' */}
              <span className="text-lg sm:text-xl font-bold text-amber-500 px-1">✕</span>

              {/* Meta Tech Provider Brand */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <svg className="h-8 w-8 text-[#0064E0] fill-current" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M8.217 5.243C9.145 3.988 10.171 3 11.483 3 13.96 3 16 6.153 16.001 9.907c0 2.29-.986 3.725-2.757 3.725-1.543 0-2.395-.866-3.924-3.424l-.667-1.123-.118-.197a55 55 0 0 0-.53-.877l-1.178 2.08c-1.673 2.925-2.615 3.541-3.923 3.541C1.086 13.632 0 12.217 0 9.973 0 6.388 1.995 3 4.598 3q.477-.001.924.122c.31.086.611.22.913.407.577.359 1.154.915 1.782 1.714m1.516 2.224q-.378-.615-.727-1.133L9 6.326c.845-1.305 1.543-1.954 2.372-1.954 1.723 0 3.102 2.537 3.102 5.653 0 1.188-.39 1.877-1.195 1.877-.773 0-1.142-.51-2.61-2.87zM4.846 4.756c.725.1 1.385.634 2.34 2.001A212 212 0 0 0 5.551 9.3c-1.357 2.126-1.826 2.603-2.581 2.603-.777 0-1.24-.682-1.24-1.9 0-2.602 1.298-5.264 2.846-5.264q.137 0 .27.018" />
                </svg>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900">Meta</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5 sm:mt-1">Tech Provider</span>
                </div>
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="lp-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6 text-slate-900 max-w-4xl mx-auto">
            Manage your WhatsApp business <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-500">better than ever</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto mb-10">
            Grow by Chat is a premium WhatsApp CRM platform designed to help businesses manage conversations, automate marketing, and scale customer support — <span className="font-semibold text-slate-800">all without touching the Meta Developer console.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/signup" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl text-base font-bold shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all hover:-translate-y-0.5 inline-flex items-center justify-center gap-2">
              Start Onboarding Now <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#features" className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl text-base font-bold shadow-sm transition-all hover:border-slate-300 inline-flex items-center justify-center gap-2">
              See How It Works
            </a>
          </div>

          {/* Interactive Dual Mockup Showcase */}
          <div className="relative max-w-5xl mx-auto px-4">
            {/* Desktop CRM Window Mockup - Matches Real Application Dashboard Layout */}
            <div className="rounded-2xl border border-slate-800 bg-[#0F172A] shadow-2xl overflow-hidden text-left">
              {/* Window Header */}
              <div className="bg-[#0B0F19] px-4 py-3 flex items-center justify-between border-b border-slate-900">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="bg-slate-900 text-[10px] font-semibold text-slate-500 px-12 py-1 rounded-md text-center max-w-xs truncate select-none border border-slate-800/50">
                  admin.growbychat.com/dashboard
                </div>
                <div className="w-12" /> {/* spacer */}
              </div>

              {/* Window Workspace */}
              <div className="flex min-h-[480px] bg-[#090D16]">
                {/* Mock CRM Sidebar (based on real sidebar.tsx) */}
                <div className="w-44 bg-[#0B0F19] p-4 space-y-6 hidden md:block border-r border-slate-900 select-none">
                  {/* Brand Row */}
                  <div className="flex items-center gap-2 px-2">
                    <div className="h-6 w-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
                      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-white tracking-tight">Grow by Chat</span>
                  </div>

                  {/* Sidebar Nav Items */}
                  <div className="space-y-1">
                    {[
                      { label: "Dashboard", active: true, icon: LayoutDashboard },
                      { label: "Inbox", badge: "3", icon: MessageSquare },
                      { label: "Contacts", icon: Users },
                      { label: "Pipelines", icon: GitBranch },
                      { label: "Broadcasts", icon: Radio },
                      { label: "Templates", icon: FileText },
                      { label: "Automations", icon: Zap },
                      { label: "Flows", beta: true, icon: Workflow }
                    ].map((item) => (
                      <div key={item.label} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${item.active ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
                        <div className="flex items-center gap-2">
                          <item.icon className="h-3.5 w-3.5" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                        {item.beta && <span className="text-[8px] font-bold text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded">Beta</span>}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-900/60 pt-4 space-y-1">
                    {[
                      { label: "Pricing Info", icon: Coins },
                      { label: "Settings", icon: Settings }
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:bg-slate-900 hover:text-white cursor-pointer">
                        <item.icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mock CRM Workspace Main Content (Matches real DashboardPage) */}
                <div className="flex-1 p-5 space-y-5 overflow-hidden">
                  {/* Dashboard Header */}
                  <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                    <div>
                      <h3 className="text-sm font-bold text-white">Dashboard</h3>
                      <p className="text-[10px] text-slate-500">Live analytics across conversations, contacts, deals, broadcasts, and automations.</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                    </div>
                  </div>

                  {/* Real Metrics Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { title: "Active Conversations", value: "18", delta: "+2 new today", icon: MessageSquare, good: true },
                      { title: "New Contacts Today", value: "4", delta: "+1 vs yesterday", icon: Users, good: true },
                      { title: "Open Deals Value", value: "$12,500", subtitle: "3 open deals", icon: GitBranch },
                      { title: "Messages Sent Today", value: "342", delta: "+45 vs yesterday", icon: Radio, good: true }
                    ].map((st, i) => (
                      <div key={i} className="bg-[#0B0F19] border border-slate-900 p-3.5 rounded-xl">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-medium text-slate-400">{st.title}</span>
                          <div className="h-6 w-6 rounded bg-slate-900/80 border border-slate-900 text-slate-400 flex items-center justify-center">
                            <st.icon className="h-3 w-3" />
                          </div>
                        </div>
                        <div className="text-lg font-black text-white mt-2 tabular-nums">{st.value}</div>
                        {st.delta ? (
                          <div className={`text-[9px] font-semibold mt-1 flex items-center gap-0.5 ${st.good ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {st.good ? '▲' : '▼'} {st.delta}
                          </div>
                        ) : (
                          <div className="text-[9px] text-slate-500 mt-1">{st.subtitle}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Real Chart Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Line Chart (ConversationsChart) */}
                    <div className="lg:col-span-3 bg-[#0B0F19] border border-slate-900 rounded-xl p-4 flex flex-col justify-between min-h-[160px]">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-950">
                        <span className="text-[10px] font-bold text-slate-300">Conversation Volume</span>
                        <div className="flex gap-2">
                          <span className="text-[8px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">7d</span>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 bg-slate-900 text-slate-500 rounded">30d</span>
                        </div>
                      </div>

                      {/* SVG Line Graph */}
                      <div className="h-24 relative mt-2">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between opacity-5">
                          <div className="border-b border-white w-full" />
                          <div className="border-b border-white w-full" />
                          <div className="border-b border-white w-full" />
                        </div>
                        {/* SVG Path */}
                        <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          {/* Filled area */}
                          <path d="M 0 40 L 0 35 Q 20 15 40 28 T 80 5 L 100 12 L 100 40 Z" fill="url(#chart-glow)" />
                          {/* Stroke line */}
                          <path d="M 0 35 Q 20 15 40 28 T 80 5 L 100 12" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                          {/* Glowing points */}
                          <circle cx="80" cy="5" r="2.5" fill="#34D399" />
                          <circle cx="100" cy="12" r="2.5" fill="#34D399" />
                        </svg>
                      </div>

                      <div className="flex justify-between text-[8px] text-slate-500 font-semibold mt-2 pt-1 border-t border-slate-950">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                        <span>Sun</span>
                      </div>
                    </div>

                    {/* Donut Chart (PipelineDonut) */}
                    <div className="lg:col-span-2 bg-[#0B0F19] border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-950">
                        <span className="text-[10px] font-bold text-slate-300">Pipeline Stages</span>
                        <span className="text-[8px] text-emerald-400 font-bold">$12,500 total</span>
                      </div>

                      <div className="flex items-center gap-4 py-2">
                        {/* SVG Donut */}
                        <div className="h-16 w-16 relative">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                            <circle cx="16" cy="16" r="14" fill="transparent" stroke="#1e293b" strokeWidth="4" />
                            {/* Segment 1: Lead (emerald-500) - 50% */}
                            <circle cx="16" cy="16" r="14" fill="transparent" stroke="#10b981" strokeWidth="4" strokeDasharray="44 88" strokeDashoffset="0" />
                            {/* Segment 2: Proposal (blue-500) - 30% */}
                            <circle cx="16" cy="16" r="14" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray="26 88" strokeDashoffset="-44" />
                            {/* Segment 3: Contacted (amber-500) - 20% */}
                            <circle cx="16" cy="16" r="14" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray="18 88" strokeDashoffset="-70" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none select-none">
                            <span className="text-[9px] font-bold text-white">3</span>
                            <span className="text-[6px] text-slate-400 font-semibold uppercase">Deals</span>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="flex-1 space-y-1.5 text-[9px] font-semibold text-slate-400">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>Lead</span>
                            </div>
                            <span className="text-white">$6,000</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              <span>Proposal</span>
                            </div>
                            <span className="text-white">$4,000</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              <span>Contacted</span>
                            </div>
                            <span className="text-white">$2,500</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real Activity Feed preview */}
                  <div className="bg-[#0B0F19] border border-slate-900 rounded-xl p-3.5 space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-950 pb-2">
                      <span className="text-[10px] font-bold text-slate-300">Live Activity Feed</span>
                      <span className="text-[8px] font-bold text-slate-500">50 items loaded</span>
                    </div>
                    <div className="space-y-2 text-[9px] font-semibold text-slate-400">
                      {[
                        { time: "Just Now", text: "Campaign 'Summer Launch' completed sending to 1,247 contacts" },
                        { time: "3m ago", text: "Verified customer Priya Sharma tagged VIP in Shared Inbox" }
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-2 rounded border border-slate-950">
                          <span>{item.text}</span>
                          <span className="text-slate-500 shrink-0 ml-4 font-normal text-[8px]">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlapping Smartphone WhatsApp Mockup */}
            <div className="absolute -bottom-12 -right-2 md:right-8 w-[250px] sm:w-[270px] h-[480px] sm:h-[520px] rounded-[2.5rem] border-[6px] border-slate-900 bg-[#efeae2] shadow-2xl flex flex-col overflow-hidden z-20">
              {/* Phone Camera Notch */}
              <div className="h-6 bg-slate-900 flex items-center justify-center border-b border-slate-800 shrink-0">
                <div className="w-14 h-3.5 bg-black rounded-full" />
              </div>
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] px-4 py-2.5 flex items-center gap-3 shrink-0">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-emerald-800 font-bold text-xs shadow-sm">G</div>
                <div className="flex-1">
                  <div className="text-white text-xs font-bold leading-tight flex items-center gap-1">
                    Grow by Chat
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-500 block shrink-0" />
                  </div>
                  <div className="text-[#25D366] text-[9px] font-semibold">online • Meta Verified Partner</div>
                </div>
              </div>
              {/* Chat Area */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto text-[10px] leading-relaxed">
                <div className="bg-white rounded-lg rounded-tl-none p-2.5 max-w-[85%] shadow-xs text-slate-800">
                  <p>👋 Welcome to Grow by Chat! Your integrated WhatsApp CRM dashboard is now fully synced.</p>
                  <span className="text-[8px] text-slate-400 mt-1 block text-right">10:30 AM</span>
                </div>
                <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-2.5 max-w-[85%] ml-auto shadow-xs text-slate-800">
                  <p>Incredible! Setup took under 60 seconds. Can I segment contacts directly from CRM? 🚀</p>
                  <span className="text-[8px] text-slate-400 mt-1 block text-right">10:31 AM</span>
                </div>
                <div className="bg-white rounded-lg rounded-tl-none p-2.5 max-w-[85%] shadow-xs text-slate-800">
                  <p>Absolutely! I see you are now segmented as a VIP customer in our shared inbox database.</p>
                  <span className="text-[8px] text-slate-400 mt-1 block text-right">10:32 AM</span>
                </div>
                <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-2.5 max-w-[85%] ml-auto shadow-xs text-slate-800">
                  <p>Wow, it synced instantly with my CRM table. Best tool ever! 😍</p>
                  <span className="text-[8px] text-[#34B7F1] font-bold mt-1 block text-right">10:33 AM ✓✓</span>
                </div>
              </div>
              {/* Chat Input Bar */}
              <div className="bg-[#f0f0f0] p-2 flex items-center gap-2 shrink-0 border-t border-slate-200">
                <div className="flex-1 h-7 bg-white rounded-full px-3 flex items-center text-[10px] text-slate-400">Type message...</div>
                <div className="h-7 w-7 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-xs">
                  <ArrowRight className="h-4.5 w-4.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-900 text-white py-20 relative">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 text-center lg:text-left">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider block mb-2">Enterprise Performance</span>
              <h2 className="lp-heading text-3xl sm:text-4xl font-bold leading-tight mb-4">
                Millions of conversations sent with zero downtime
              </h2>
              <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
                Our infrastructure handles enterprise-grade messaging loads effortlessly. Benefit from direct routing to Meta API gateways with optimized delivery speeds.
              </p>
            </div>
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { val: "60s", lbl: "Facebook OAuth Login" },
                { val: "0%", lbl: "Markup on Messages" },
                { val: "24/7", lbl: "Priority Team SLA" },
                { val: "100%", lbl: "Data Encryption" }
              ].map((st, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-md">
                  <div className="text-3xl font-black text-emerald-400 lp-heading mb-1">{st.val}</div>
                  <div className="text-xs font-medium text-slate-300">{st.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest block mb-2.5">Power-Packed Core</span>
            <h2 className="lp-heading text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Features engineered to scale your WhatsApp marketing
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: MessageCircle,
                title: "Unified Agent Inbox",
                desc: "Combine all customer chats into a single timeline. Assign to agents, tag leads, add private notes, and chat in real-time."
              },
              {
                icon: Radio,
                title: "Mass Broadcast Campaigns",
                desc: "Send bulk notifications and newsletters to customer lists. Track real-time stats including read and response rates."
              },
              {
                icon: Bot,
                title: "Automated Workflows",
                desc: "Create sequence triggers based on keywords. Direct inquiries, auto-assign agents, or send templates instantly."
              },
              {
                icon: Workflow,
                title: "In-Chat Forms & Flows",
                desc: "Build surveys, lead forms, and feedback lists directly inside WhatsApp. No redirection to web pages required."
              },
              {
                icon: GitBranch,
                title: "CRM Deal Pipeline",
                desc: "Track leads throughout custom pipeline stages. Drag and drop deal cards and analyze estimated sales pipelines."
              },
              {
                icon: Shield,
                title: "Bank-Grade Security",
                desc: "Ensure absolute compliance. AES-256 message encryption, dual security verification, and verified Meta API endpoints."
              }
            ].map((f, i) => (
              <div key={i} className="group border border-slate-100 bg-slate-50 hover:bg-white rounded-2xl p-7 transition-all hover:shadow-xl hover:shadow-slate-100 hover:border-slate-200/80 hover:-translate-y-1">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison Section */}
      <section id="calculator" className="py-24 bg-emerald-50/60 border-y border-emerald-100 relative">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest block mb-2.5">Price Comparison</span>
            <h2 className="lp-heading text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Stop paying per-message markup
            </h2>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed">
              Other WhatsApp BSPs charge ₹0.65–₹1.08 per message on top of Meta's base rate. Grow by Chat charges ₹0 per message — you only pay Meta directly.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="grid grid-cols-5 bg-slate-50 border-b border-slate-200">
              <div className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Platform</div>
              <div className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center">Per Message</div>
              <div className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center">Platform Fee</div>
              <div className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center hidden sm:block">10K msgs/mo</div>
              <div className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-right">You Save</div>
            </div>
            {[
              { name: "Zoho Cliq", perMsg: "₹1.08", fee: "₹2,000/mo", total: "₹12,800", save: "₹11,901", highlight: false, logo: "/zoho.png" },
              { name: "WATI", perMsg: "₹1.00", fee: "₹2,400/mo", total: "₹12,400", save: "₹11,501", highlight: false, logo: "/wati.png" },
              { name: "Interakt", perMsg: "₹0.78", fee: "₹2,500/mo", total: "₹10,300", save: "₹9,401", highlight: false, logo: "/interakt.png" },
              { name: "AiSensy", perMsg: "₹0.65", fee: "₹1,999/mo", total: "₹8,499", save: "₹7,600", highlight: false, logo: "/aisensy.png" },
              { name: "Grow by Chat", perMsg: "₹0.00", fee: "₹899/mo", total: "₹899", save: "—", highlight: true, logo: null },
            ].map((row) => (
              <div key={row.name} className={`grid grid-cols-5 border-b border-slate-100 last:border-0 ${row.highlight ? "bg-emerald-50" : ""}`}>
                <div className={`p-3 text-sm font-bold flex items-center gap-2.5 ${row.highlight ? "text-emerald-700" : "text-slate-700"}`}>
                  {row.logo && (
                    <Image src={row.logo} alt={`${row.name} logo`} width={24} height={24} className="shrink-0 rounded object-contain" />
                  )}
                  {row.name}
                </div>
                <div className={`p-3 text-sm text-center ${row.highlight ? "text-emerald-600 font-bold" : "text-slate-600"}`}>{row.perMsg}</div>
                <div className={`p-3 text-sm text-center ${row.highlight ? "text-emerald-600 font-bold" : "text-slate-600"}`}>{row.fee}</div>
                <div className={`p-3 text-sm text-center hidden sm:block ${row.highlight ? "text-emerald-600 font-bold" : "text-slate-600"}`}>{row.total}</div>
                <div className={`p-3 text-sm text-right font-bold ${row.highlight ? "text-emerald-600" : "text-emerald-600"}`}>{row.save}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">
            Comparison based on 10,000 marketing messages/month. Grow by Chat charges only Meta's base rate — zero per-message markup. You pay Meta directly.
          </p>
        </div>
      </section>

      {/* Onboarding Timeline Section */}
      <section className="py-24 bg-white relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest block mb-2.5">Onboarding</span>
            <h2 className="lp-heading text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Start messaging in four single steps
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Horizontal timeline connector lines for desktop */}
            <div className="absolute top-10 left-12 right-12 h-0.5 bg-slate-100 hidden md:block -z-10" />

            {[
              {
                step: "01",
                title: "Connect Account",
                desc: "Log in via Facebook OAuth. Our tech provider code builds WhatsApp Business accounts and links your profile in seconds."
              },
              {
                step: "02",
                title: "Add Payment to Meta",
                desc: "Add your credit or debit card directly to Meta Business Manager. Grow by Chat has absolute zero involvement in your billing or transactions."
              },
              {
                step: "03",
                title: "Configure CRM Lists",
                desc: "Upload CSV contact files, set up CRM dashboard tags, and request Meta approval for broadcast templates."
              },
              {
                step: "04",
                title: "Launch Automations",
                desc: "Go live! Set up webhook auto-replies, organize shared inbox routing, and send broadcast campaigns."
              }
            ].map((itm, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-emerald-50 border-4 border-white text-emerald-600 shadow-md shadow-emerald-500/5 mx-auto flex items-center justify-center text-xl font-black lp-heading">
                  {itm.step}
                </div>
                <h3 className="text-lg font-bold text-slate-950">{itm.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">{itm.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-emerald-500 text-emerald-500" />
              ))}
            </div>
            <h2 className="lp-heading text-3xl sm:text-4xl font-bold text-slate-900">Rated 4.8/5 by marketing teams</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Best WhatsApp CRM ever!",
                text: "Switching to Grow by Chat was a game-changer. The shared inbox interface syncs instantly, saving our support desk hours every single day.",
                author: "Priya Sharma",
                role: "Founder @ StyleKart"
              },
              {
                title: "Unbelievable setup speed",
                text: "I was skeptical about the 60-second setup, but logging in via Facebook handled WABA settings automatically. Extremely smooth interface.",
                author: "Rahul Verma",
                role: "Marketing Head @ FreshFoods"
              },
              {
                title: "Zero message markup is real",
                text: "Other platforms marked up message delivery fees. Paying Meta directly allows us to scale broadcast sequences without worrying about hidden costs.",
                author: "Ananya Patel",
                role: "Owner @ LuxeCraft"
              },
              {
                title: "Powerful automations",
                text: "The conditional auto-replies logic is brilliant. It enables sorting inquiries and tagging VIP leads instantly. Highly recommended for SMBs.",
                author: "Vikram Singh",
                role: "Director @ TechServe"
              }
            ].map((t, idx) => (
              <div key={idx} className="bg-white border border-slate-200/50 rounded-2xl p-8 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <h3 className="text-base font-bold text-slate-950 mb-2">{t.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                  <div className="h-8 w-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t.author}</div>
                    <div className="text-[10px] font-semibold text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest block mb-2.5">Pricing Plans</span>
            <h2 className="lp-heading text-3xl sm:text-4xl font-bold text-slate-950">Simple, transparent pricing model</h2>
          </div>

          {/* Competitor comparison */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200">
                <div className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Platform</div>
                <div className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wide text-center">Per Message</div>
                <div className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wide text-center">Platform Fee</div>
                <div className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wide text-right">Total (10K msgs)</div>
              </div>
              {[
                { name: "Zoho Cliq", perMsg: "₹1.08", fee: "₹2,000/mo", total: "₹12,800", highlight: false },
                { name: "WATI", perMsg: "₹1.00", fee: "₹2,400/mo", total: "₹12,400", highlight: false },
                { name: "Interakt", perMsg: "₹0.78", fee: "₹2,500/mo", total: "₹10,300", highlight: false },
                { name: "Grow by Chat", perMsg: "₹0.00", fee: "₹899/mo", total: "₹899", highlight: true },
              ].map((row) => (
                <div key={row.name} className={`grid grid-cols-4 border-b border-slate-100 last:border-0 ${row.highlight ? "bg-emerald-50" : ""}`}>
                  <div className={`p-4 text-sm font-bold ${row.highlight ? "text-emerald-700" : "text-slate-700"}`}>{row.name}</div>
                  <div className={`p-4 text-sm text-center ${row.highlight ? "text-emerald-600 font-bold" : "text-slate-600"}`}>{row.perMsg}</div>
                  <div className={`p-4 text-sm text-center ${row.highlight ? "text-emerald-600 font-bold" : "text-slate-600"}`}>{row.fee}</div>
                  <div className={`p-4 text-sm text-right font-bold ${row.highlight ? "text-emerald-600" : "text-slate-700"}`}>{row.total}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">Comparison based on 10,000 marketing messages/month. Grow by Chat charges only Meta's base rate — zero per-message markup.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Platform Fee Card */}
            <div className="border border-slate-200 rounded-3xl p-8 bg-white relative flex flex-col justify-between shadow-xs">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-xl tracking-wider uppercase">Platform</div>
              <div>
                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">Grow by Chat License</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-black text-slate-900 lp-heading">₹899</span>
                  <span className="text-slate-500 text-sm font-semibold">/month</span>
                </div>
                <p className="text-sm text-slate-500 mb-8">Full access to all features. No per-message charges. No hidden fees.</p>
                <div className="space-y-4 mb-8">
                  {["Unlimited synced contacts", "Unlimited broadcast campaigns", "Custom visual automations", "Shared team inbox (multiple agents)", "Zero setup fees"].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/signup" className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-emerald-600/10 transition-all">Start Onboarding Now</Link>
            </div>

            {/* Direct Meta Cost Card */}
            <div className="border border-slate-950 bg-slate-950 rounded-3xl p-8 text-white relative flex flex-col justify-between shadow-xl shadow-slate-900/10">
              <div className="absolute top-0 right-0 bg-white text-slate-950 text-[10px] font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-xl tracking-wider uppercase">Direct Billing</div>
              <div>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">WhatsApp API Cost</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-black text-white lp-heading">0%</span>
                  <span className="text-slate-400 text-sm font-semibold">platform markup</span>
                </div>
                <p className="text-sm text-slate-400 mb-8">We link directly to your Facebook card. Pay Meta's exact standard rates — no margin additions.</p>
                <div className="space-y-4 mb-8">
                  {["Marketing: ~₹0.70/conversation", "Utility: ~₹0.30/conversation", "Authentication: ~₹0.20/conversation", "1,000 free service chats/month", "Pay Meta directly via Credit Card"].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-white/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <a href="https://developers.facebook.com/docs/whatsapp/pricing" target="_blank" rel="noopener" className="block w-full text-center bg-white hover:bg-slate-100 text-slate-950 font-bold py-3.5 rounded-xl transition-colors">View Official Meta Pricing</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="lp-heading text-3xl sm:text-4xl font-bold text-slate-900">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Do I need a Meta Developer account?", a: "No. As a verified Meta Tech Provider, Grow by Chat uses direct OAuth flow. We create WABA accounts, link phone numbers, and configure webhooks automatically in under 60 seconds." },
              { q: "Is there any hidden markup on WhatsApp messages?", a: "None. You link your credit card directly inside Meta Business Manager. Meta bills you exact standard prices; we add zero extra commissions." },
              { q: "Can I use my existing WhatsApp numbers?", a: "Yes. Our platform integrates with coexistence mode, which allows you to maintain chat API operations concurrently with your current numbers." },
              { q: "How does multi-agent routing work?", a: "You can invite support or sales agents to your Grow by Chat workspace. Conversations are routed via round-robin distribution or manually assigned inside the unified inbox." },
              { q: "What support SLA do you offer?", a: "During beta, we provide 24/7 dedicated support via our integrated dashboard widget. Our team assists with template approvals and business configuration settings." }
            ].map((item, i) => (
              <details key={i} className="group bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-xs [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-slate-900 transition-colors hover:text-emerald-600">
                  <span className="text-sm sm:text-base lp-heading">{item.q}</span>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-open:rotate-90 transition-transform shrink-0 ml-4" />
                </summary>
                <div className="px-5 pb-5 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-3">
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-950 py-24 relative overflow-hidden text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-6">
              <h2 className="lp-heading text-3xl sm:text-5xl font-black leading-tight">
                Start managing your <br />
                WhatsApp campaigns now
              </h2>
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                Unlock instant broadcasts, multi-agent unified dashboards, and direct WhatsApp Billing. Log in via Facebook and connect in 60 seconds.
              </p>
              <div className="pt-2">
                <Link href="/signup" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl text-base font-bold shadow-lg shadow-emerald-600/20 inline-flex items-center gap-2">
                  Get Started Now <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              {/* Floating micro CRM chat list component */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">G</div>
                  <div>
                    <div className="font-bold text-xs">Grow by Chat workspace</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">● Active agents online</div>
                  </div>
                </div>
                <div className="space-y-3.5">
                  <div className="bg-white/5 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-[10px] text-slate-400">
                      <span>Priya Sharma • StyleKart</span>
                      <span>10:30 AM</span>
                    </div>
                    <p className="text-slate-200">How do I verify templates?</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs space-y-1 ml-6">
                    <div className="flex justify-between font-bold text-[10px] text-emerald-400">
                      <span>Support Agent</span>
                      <span>10:31 AM</span>
                    </div>
                    <p className="text-emerald-100">Templates are auto-submitted to Meta. Approval takes <span className="font-bold text-white">less than 2 mins</span>. ✅</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2 space-y-4">
              <LogoLockup light />
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Verified Meta Tech Provider. Advanced CRM dashboard with bulk broadcasts, multi-agent chat, shared templates, and automatic Facebook onboarding configuration.
              </p>
            </div>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Product</p>
              <ul className="space-y-3 text-sm text-slate-400 font-semibold">
                <li><a href="#features" className="hover:text-emerald-500 transition-colors">Features</a></li>
                <li><a href="#calculator" className="hover:text-emerald-500 transition-colors">Price Comparison</a></li>
                <li><a href="#pricing" className="hover:text-emerald-500 transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-emerald-500 transition-colors">Reviews</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Legal</p>
              <ul className="space-y-3 text-sm text-slate-400 font-semibold">
                <li><Link href="/privacy" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-emerald-500 transition-colors">Terms of Service</Link></li>
                <li><Link href="/login" className="hover:text-emerald-500 transition-colors">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-emerald-500 transition-colors">Get Started</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">© 2026 Grow by Chat. All Rights Reserved. Verified Meta Tech Provider.</p>
            <div className="flex items-center gap-5 text-xs text-slate-500 font-semibold">
              <a href="https://twitter.com/" target="_blank" rel="noopener" className="hover:text-emerald-400 transition-colors">Twitter</a>
              <a href="https://facebook.com/" target="_blank" rel="noopener" className="hover:text-emerald-400 transition-colors">Facebook</a>
              <a href="https://instagram.com/" target="_blank" rel="noopener" className="hover:text-emerald-400 transition-colors">Instagram</a>
              <a href="https://linkedin.com/" target="_blank" rel="noopener" className="hover:text-emerald-400 transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
