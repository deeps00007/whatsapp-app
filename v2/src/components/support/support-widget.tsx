"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Headphones,
  X,
  Send,
  CheckCheck,
  ChevronDown,
  Sparkles,
  Bot,
  UserCircle2,
  Phone,
  Clock,
  RefreshCw,
} from "lucide-react";

// How long (ms) to wait for an agent before showing the fallback card
const AGENT_WAIT_MS = 2 * 60 * 1000; // 2 minutes

interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: "user" | "agent" | "bot";
  sender_name: string;
  content: string;
  created_at: string;
}

const QUICK_REPLIES = [
  "How does this work?",
  "I need help with billing",
  "Talk to a human agent",
  "Track my order",
];

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [connectingAgent, setConnectingAgent] = useState(false);
  const [agentJoined, setAgentJoined] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showHome, setShowHome] = useState(true);

  // Agent timeout state
  const [agentWaitSecsLeft, setAgentWaitSecsLeft] = useState<number | null>(null);
  const [agentTimedOut, setAgentTimedOut] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [waitingMore, setWaitingMore] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);
  const agentWaitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const agentWaitStartRef = useRef<number | null>(null);

  // ── Scroll to bottom ──────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  // ── Initialize conversation ───────────────────────────────
  const initialize = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setInitializing(true);
    try {
      const res = await fetch("/api/support/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.conversationId) {
        setConversationId(data.conversationId);
        setMessages(data.messages || []);
        const hasAgent = (data.messages || []).some(
          (m: SupportMessage) => m.sender_type === "agent"
        );
        if (hasAgent) setAgentJoined(true);
        if ((data.messages || []).length > 0) setShowHome(false);
        scrollToBottom();
      }
    } catch (err) {
      console.error("[support] init error:", err);
      initializedRef.current = false;
    } finally {
      setInitializing(false);
    }
  }, [scrollToBottom]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
    if (!conversationId) {
      initialize();
    }
  }, [conversationId, initialize]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    setIsOpen(false);
  }, []);

  // ── Realtime subscription ─────────────────────────────────
  useEffect(() => {
    if (!isOpen || !conversationId) return;
    const supabase = createClient();

    const convoChannel = supabase
      .channel(`support_convo:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "support_conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as { agent_last_active_at: string | null };
          if (updated.agent_last_active_at) {
            const isRecent =
              Date.now() - new Date(updated.agent_last_active_at).getTime() <
              15000;
            setAgentJoined(isRecent);
          } else {
            setAgentJoined(false);
          }
        }
      )
      .subscribe();

    const msgChannel = supabase
      .channel(`support:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as SupportMessage;

          setMessages((prev) => {
            if (newMsg.sender_type === "user") {
              const filtered = prev.filter(
                (m) =>
                  !(
                    m.id.startsWith("temp-") &&
                    m.sender_type === "user" &&
                    m.content === newMsg.content
                  )
              );
              return [...filtered, newMsg];
            }
            return [...prev, newMsg];
          });

          setAiTyping(false);
          setConnectingAgent(false);
          setShowHome(false);

          if (newMsg.sender_type === "agent") {
            // Agent connected — clear the timeout
            setAgentJoined(true);
            setAgentTimedOut(false);
            setAgentWaitSecsLeft(null);
            setWaitingMore(false);
            if (agentWaitTimerRef.current) {
              clearInterval(agentWaitTimerRef.current);
              agentWaitTimerRef.current = null;
            }
          }

          if (
            newMsg.sender_type === "bot" &&
            newMsg.content.includes("connect you with our support team")
          ) {
            setConnectingAgent(true);
            // Start the 2-minute countdown
            agentWaitStartRef.current = Date.now();
            const totalSecs = Math.floor(AGENT_WAIT_MS / 1000);
            setAgentWaitSecsLeft(totalSecs);
            setAgentTimedOut(false);
            setPhoneSubmitted(false);
            setWaitingMore(false);

            if (agentWaitTimerRef.current) clearInterval(agentWaitTimerRef.current);
            agentWaitTimerRef.current = setInterval(() => {
              const elapsed = Date.now() - (agentWaitStartRef.current ?? Date.now());
              const secsLeft = Math.max(0, Math.ceil((AGENT_WAIT_MS - elapsed) / 1000));
              setAgentWaitSecsLeft(secsLeft);
              if (secsLeft === 0) {
                clearInterval(agentWaitTimerRef.current!);
                agentWaitTimerRef.current = null;
                setAgentTimedOut(true);
                setConnectingAgent(false);
              }
            }, 1000);
          }

          // If widget is closed/minimized, increment unread
          if (!isOpen || isMinimized) {
            if (newMsg.sender_type !== "user") {
              setUnreadCount((c) => c + 1);
            }
          }

          scrollToBottom();
        }
      )
      .subscribe();

    const presenceInterval = setInterval(async () => {
      const { data: convo } = await supabase
        .from("support_conversations")
        .select("agent_last_active_at")
        .eq("id", conversationId)
        .maybeSingle();

      if (convo?.agent_last_active_at) {
        const isRecent =
          Date.now() - new Date(convo.agent_last_active_at).getTime() < 15000;
        setAgentJoined(isRecent);
      } else {
        setAgentJoined(false);
      }
    }, 10000);

    return () => {
      supabase.removeChannel(convoChannel);
      supabase.removeChannel(msgChannel);
      clearInterval(presenceInterval);
    };
  }, [isOpen, isMinimized, conversationId, scrollToBottom]);

  // Clean up countdown timer on unmount
  useEffect(() => {
    return () => {
      if (agentWaitTimerRef.current) clearInterval(agentWaitTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized, scrollToBottom]);

  // ── Send message ──────────────────────────────────────────
  const handleSend = useCallback(
    async (overrideContent?: string) => {
      const content = (overrideContent ?? input).trim();
      if (!content || !conversationId || loading) return;

      if (!overrideContent) setInput("");
      setLoading(true);
      setShowHome(false);

      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          conversation_id: conversationId,
          sender_type: "user",
          sender_name: "You",
          content,
          created_at: new Date().toISOString(),
        } as SupportMessage,
      ]);
      scrollToBottom();

      if (!agentJoined) setAiTyping(true);

      try {
        await fetch("/api/support/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, content }),
        });

        if (!agentJoined) {
          setTimeout(async () => {
            try {
              const aiRes = await fetch("/api/support/ai-reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId }),
              });
              const aiData = await aiRes.json();
              if (aiData.requesting_human) {
                setConnectingAgent(true);
              }
            } catch (err) {
              console.error("[support] AI reply error:", err);
            } finally {
              setAiTyping(false);
            }
          }, 1500);
        } else {
          setAiTyping(false);
        }
      } catch (err) {
        console.error("[support] send error:", err);
        setAiTyping(false);
      } finally {
        setLoading(false);
      }
    },
    [input, conversationId, loading, scrollToBottom, agentJoined]
  );

  // ── Helpers ───────────────────────────────────────────────
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const shouldShowDateDivider = (idx: number) => {
    if (idx === 0) return true;
    const curr = new Date(messages[idx].created_at).toDateString();
    const prev = new Date(messages[idx - 1].created_at).toDateString();
    return curr !== prev;
  };

  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const agentFirstIdx = messages.findIndex((m) => m.sender_type === "agent");

  // Format countdown as mm:ss
  const fmtCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Submit phone number (sends as a user message)
  const handlePhoneSubmit = useCallback(async () => {
    const phone = phoneInput.trim();
    if (!phone || !conversationId) return;
    setPhoneSubmitted(true);
    // Post as user message so agent/admin sees it
    await handleSend(`📞 Please call me back at: ${phone}`);
    setPhoneInput("");
  }, [phoneInput, conversationId, handleSend]);

  // User chooses to keep waiting
  const handleKeepWaiting = useCallback(() => {
    setWaitingMore(true);
    setAgentTimedOut(false);
    setConnectingAgent(true);
    // Restart the 2-min timer
    agentWaitStartRef.current = Date.now();
    const totalSecs = Math.floor(AGENT_WAIT_MS / 1000);
    setAgentWaitSecsLeft(totalSecs);
    if (agentWaitTimerRef.current) clearInterval(agentWaitTimerRef.current);
    agentWaitTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - (agentWaitStartRef.current ?? Date.now());
      const secsLeft = Math.max(0, Math.ceil((AGENT_WAIT_MS - elapsed) / 1000));
      setAgentWaitSecsLeft(secsLeft);
      if (secsLeft === 0) {
        clearInterval(agentWaitTimerRef.current!);
        agentWaitTimerRef.current = null;
        setAgentTimedOut(true);
        setConnectingAgent(false);
        setWaitingMore(false);
      }
    }, 1000);
  }, []);

  // ══════════════════════════════════════════════════════════
  //  FLOATING ACTION BUTTON (widget closed)
  // ══════════════════════════════════════════════════════════
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-black shadow-lg shadow-[#25D366]/30 transition-all duration-200 hover:scale-105 hover:bg-[#1ebe5d] active:scale-95"
        aria-label="Open support chat"
      >
        <Headphones className="h-6 w-6" />
        {/* Live pulse ring */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-[#25D366] border-2 border-[#0a1014]" />
        </span>
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-2 -left-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 shadow">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  // ══════════════════════════════════════════════════════════
  //  CHAT WIDGET
  // ══════════════════════════════════════════════════════════
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl shadow-black/60 
        w-[380px] h-[560px]
        max-sm:bottom-0 max-sm:right-0 max-sm:h-full max-sm:w-full max-sm:rounded-none
        animate-[slideUp_0.25s_ease-out]"
      style={{ transformOrigin: "bottom right" }}
    >
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="relative flex items-center justify-between bg-[#111827] px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Brand avatar */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-black font-bold text-sm shadow-md shadow-[#25D366]/30">
            G
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#111827] ${
                agentJoined
                  ? "bg-blue-400"
                  : connectingAgent
                  ? "bg-amber-400 animate-pulse"
                  : "bg-[#25D366]"
              }`}
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              Grow by Chat Support
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              {agentJoined ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_4px_#60a5fa]" />
                  <span className="text-blue-400 font-medium">Agent connected</span>
                </>
              ) : connectingAgent ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-400 font-medium">Connecting to agent…</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] shadow-[0_0_4px_#25D366]" />
                  <span className="text-white/50">AI Assistant online</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition"
            title="Minimize"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── AGENT JOINED BANNER (sticky, below header) ────── */}
      {agentJoined && agentFirstIdx !== -1 && (
        <div className="flex items-center justify-center gap-2 bg-blue-500/10 border-b border-blue-500/20 px-4 py-2 flex-shrink-0">
          <UserCircle2 className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-[11px] text-blue-400 font-medium">
            You&apos;re now chatting with a live agent
          </span>
        </div>
      )}

      {/* ── HOME SCREEN (shown before first message) ──────── */}
      {showHome && !initializing && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-5 flex-1 px-6 py-8 bg-[#0d1117]">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] shadow-lg shadow-[#25D366]/25">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hi there! 👋</h3>
              <p className="text-sm text-white/50 mt-1 leading-relaxed">
                Ask us anything — our AI replies instantly and can connect you
                to a real agent.
              </p>
            </div>
          </div>

          {/* Response time notice */}
          <div className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3 flex items-start gap-3">
            <Bot className="h-4 w-4 text-[#25D366] mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold text-white/70">
                Typically replies instantly
              </div>
              <div className="text-[11px] text-white/30 mt-0.5">
                AI available 24/7 · Agents online during business hours
              </div>
            </div>
          </div>

          {/* Quick reply chips */}
          <div className="w-full">
            <p className="text-[11px] text-white/30 mb-2 uppercase tracking-wider font-semibold">
              Quick start
            </p>
            <div className="flex flex-col gap-2">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr}
                  onClick={() => handleSend(qr)}
                  className="w-full text-left rounded-xl bg-white/[0.04] border border-white/8 px-4 py-2.5 text-sm text-white/70 hover:bg-white/[0.08] hover:text-white hover:border-white/15 transition-all duration-150 active:scale-[0.98]"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MESSAGES FEED ─────────────────────────────────── */}
      {(!showHome || messages.length > 0) && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-[#0d1117]"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
        >
          {initializing ? (
            <div className="flex items-center justify-center h-full">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#25D366] border-t-transparent" />
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isUser = msg.sender_type === "user";
                const isBot = msg.sender_type === "bot";
                const isAgent = msg.sender_type === "agent";
                const prevMsg = messages[i - 1];
                const nextMsg = messages[i + 1];
                const showAvatar =
                  !isUser &&
                  (!nextMsg || nextMsg.sender_type !== msg.sender_type);
                const showSenderName =
                  !isUser &&
                  (!prevMsg || prevMsg.sender_type !== msg.sender_type);
                const isLastInGroup =
                  !nextMsg || nextMsg.sender_type !== msg.sender_type;

                return (
                  <div key={msg.id}>
                    {/* Date divider */}
                    {shouldShowDateDivider(i) && (
                      <div className="flex items-center gap-3 py-3">
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-[10px] text-white/25 font-medium px-1">
                          {getDateLabel(msg.created_at)}
                        </span>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>
                    )}

                    {/* Sender label */}
                    {showSenderName && (
                      <div
                        className={`text-[10px] font-semibold mb-1 ml-9 ${
                          isAgent ? "text-blue-400" : "text-[#25D366]/80"
                        }`}
                      >
                        {msg.sender_name}
                      </div>
                    )}

                    <div
                      className={`flex items-end gap-2 ${
                        isUser ? "justify-end" : "justify-start"
                      } ${isLastInGroup ? "mb-3" : "mb-0.5"}`}
                    >
                      {/* Left avatar */}
                      {!isUser && (
                        <div className="w-7 flex-shrink-0 self-end">
                          {showAvatar ? (
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                isBot
                                  ? "bg-[#25D366] text-black"
                                  : "bg-blue-500 text-white"
                              }`}
                            >
                              {isBot ? "G" : "A"}
                            </div>
                          ) : (
                            <div className="h-7 w-7" />
                          )}
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
                        <div
                          className={`px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                            isUser
                              ? "bg-[#25D366] text-black rounded-2xl rounded-br-md"
                              : isAgent
                              ? "bg-[#1e3a5f] text-white border border-blue-500/25 rounded-2xl rounded-bl-md"
                              : "bg-[#1c2333] text-white/90 rounded-2xl rounded-bl-md"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {/* Timestamp + read receipt */}
                        {isLastInGroup && (
                          <div
                            className={`mt-1 flex items-center gap-1 text-[10px] text-white/25 ${
                              isUser ? "justify-end pr-1" : "pl-1"
                            }`}
                          >
                            {formatTime(msg.created_at)}
                            {isUser && (
                              <CheckCheck className="h-3 w-3 text-[#25D366]/60" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* AI Typing dots */}
              {aiTyping && !agentJoined && (
                <div className="flex items-end gap-2 mb-3">
                  <div className="h-7 w-7 rounded-full bg-[#25D366] flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
                    G
                  </div>
                  <div className="bg-[#1c2333] rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      <span
                        className="h-2 w-2 rounded-full bg-white/40 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-2 w-2 rounded-full bg-white/40 animate-bounce"
                        style={{ animationDelay: "160ms" }}
                      />
                      <span
                        className="h-2 w-2 rounded-full bg-white/40 animate-bounce"
                        style={{ animationDelay: "320ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Connecting to agent — with countdown */}
              {connectingAgent && !agentJoined && (
                <div className="flex justify-center my-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-2">
                    <div className="h-3 w-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    <span className="text-xs text-amber-400 font-medium">
                      Connecting to an agent…
                    </span>
                    {agentWaitSecsLeft !== null && (
                      <span className="text-[10px] text-amber-400/60 font-mono tabular-nums">
                        {fmtCountdown(agentWaitSecsLeft)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── AGENT TIMED OUT CARD ──────────────────────── */}
              {agentTimedOut && !agentJoined && !phoneSubmitted && (
                <div className="my-3 rounded-2xl border border-white/10 bg-[#1a1f2e] overflow-hidden">
                  {/* Card header */}
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
                    <div className="h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Our team is currently busy
                      </div>
                      <div className="text-[11px] text-white/40 mt-0.5">
                        No agent connected within 2 minutes
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3 space-y-3">
                    <p className="text-[13px] text-white/60 leading-relaxed">
                      All our agents are busy right now. You can{" "}
                      <span className="text-white/80 font-medium">drop your phone number</span>{" "}
                      and we&apos;ll call you back, or choose to{" "}
                      <span className="text-white/80 font-medium">keep waiting</span>.
                    </p>

                    {/* Phone input */}
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 focus-within:border-[#25D366]/50 transition">
                        <Phone className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                          placeholder="+91 98765 43210"
                          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none min-w-0"
                        />
                      </div>
                      <button
                        onClick={handlePhoneSubmit}
                        disabled={!phoneInput.trim()}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366] text-black flex-shrink-0 disabled:opacity-30 hover:bg-[#1ebe5d] transition active:scale-95"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-[10px] text-white/20">or</span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>

                    {/* Keep waiting */}
                    <button
                      onClick={handleKeepWaiting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-[13px] text-white/50 hover:bg-white/5 hover:text-white/70 transition active:scale-[0.98]"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Keep waiting for an agent
                    </button>
                  </div>
                </div>
              )}

              {/* Phone submitted confirmation */}
              {phoneSubmitted && !agentJoined && (
                <div className="flex justify-center my-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 px-4 py-2">
                    <Phone className="h-3 w-3 text-[#25D366]" />
                    <span className="text-xs text-[#25D366] font-medium">
                      Got it! We&apos;ll call you back soon.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── INPUT BAR ─────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-white/5 bg-[#111827] px-3 pt-2.5 pb-3">
        {/* Quick replies strip (shown after first bot message, no agent yet) */}
        {!agentJoined && messages.length > 0 && messages.length <= 3 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_REPLIES.slice(0, 3).map((qr) => (
              <button
                key={qr}
                onClick={() => handleSend(qr)}
                className="flex-shrink-0 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20 transition whitespace-nowrap"
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            rows={1}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={agentJoined ? "Reply to agent…" : "Type a message…"}
            disabled={loading || initializing}
            className="flex-1 resize-none rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:bg-white/[0.08] transition max-h-[120px] leading-relaxed disabled:opacity-50"
            style={{ scrollbarWidth: "none" }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading || initializing}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-black transition-all hover:bg-[#1ebe5d] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-md shadow-[#25D366]/25"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Footer */}
        <p className="mt-2 text-center text-[10px] text-white/15 select-none">
          Powered by{" "}
          <span className="text-white/25 font-medium">Grow by Chat</span>
        </p>
      </div>
    </div>
  );
}
