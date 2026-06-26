"use client";

import { useEffect, useState } from "react";

export function AuthBrandReveal() {
  const [phase, setPhase] = useState(0);

  // Sequence the animation phases
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);  // line sweeps
    const t2 = setTimeout(() => setPhase(2), 900);  // "Grow by" reveals
    const t3 = setTimeout(() => setPhase(3), 1500); // "Chat" reveals (teal)
    const t4 = setTimeout(() => setPhase(4), 2100); // tagline + particles
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#0a0a0a",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes sweep-right {
          0%   { transform: scaleX(0); transform-origin: left; opacity: 1; }
          45%  { transform: scaleX(1); transform-origin: left; opacity: 1; }
          46%  { transform-origin: right; }
          100% { transform: scaleX(0); transform-origin: right; opacity: 1; }
        }

        @keyframes reveal-up {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes reveal-fade {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes teal-bloom {
          0%   { opacity: 0; transform: scale(0.9) translateY(4px); }
          60%  { opacity: 1; transform: scale(1.04) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes float-y {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }

        @keyframes float-y-slow {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%       { opacity: 0.4;  transform: scale(1.3); }
        }

        @keyframes line-grow {
          0%   { transform: scaleX(0); transform-origin: center; }
          100% { transform: scaleX(1); transform-origin: center; }
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.35; }
        }

        .brand-sweep-line {
          animation: sweep-right 0.9s cubic-bezier(0.65,0,0.35,1) forwards;
        }

        .brand-word-reveal {
          animation: reveal-up 0.65s cubic-bezier(0.22,1,0.36,1) forwards;
          opacity: 0;
        }

        .brand-chat-reveal {
          animation: teal-bloom 0.7s cubic-bezier(0.22,1,0.36,1) forwards;
          opacity: 0;
        }

        .tagline-reveal {
          animation: reveal-fade 0.8s ease forwards;
          opacity: 0;
        }

        .particle-reveal {
          animation: reveal-fade 1.2s ease forwards;
          opacity: 0;
        }
      `}</style>

      {/* ── Subtle dot-grid background ─────────────────────────────── */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.06,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="auth-dot" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#ffffff" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-dot)" />
      </svg>

      {/* ── Radial glow orb (teal) ─────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          animation: phase >= 3 ? "glow-pulse 3s ease-in-out infinite" : "none",
          transition: "opacity 1s",
          opacity: phase >= 3 ? 1 : 0,
        }}
      />

      {/* ── Floating corner accents ────────────────────────────────── */}
      {phase >= 4 && (
        <>
          {/* Top-left bracket corner */}
          <svg
            className="particle-reveal"
            style={{ position: "absolute", top: 48, left: 48, animationDelay: "0s" }}
            width="40" height="40" viewBox="0 0 40 40" fill="none"
          >
            <path d="M 20 2 L 2 2 L 2 20" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          </svg>

          {/* Bottom-right bracket corner */}
          <svg
            className="particle-reveal"
            style={{ position: "absolute", bottom: 48, right: 48, animationDelay: "0.1s" }}
            width="40" height="40" viewBox="0 0 40 40" fill="none"
          >
            <path d="M 20 38 L 38 38 L 38 20" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          </svg>

          {/* Top-right small circle */}
          <div
            className="particle-reveal"
            style={{
              position: "absolute",
              top: 80,
              right: 80,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#34d399",
              opacity: 0,
              animationDelay: "0.2s",
              animation: "reveal-fade 0.8s ease 0.2s forwards, pulse-dot 3s ease-in-out 1s infinite",
            }}
          />

          {/* Bottom-left small circle */}
          <div
            className="particle-reveal"
            style={{
              position: "absolute",
              bottom: 80,
              left: 80,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#6ee7b7",
              opacity: 0,
              animationDelay: "0.3s",
              animation: "reveal-fade 0.8s ease 0.3s forwards, pulse-dot 3s ease-in-out 1.5s infinite",
            }}
          />

          {/* Floating top ring */}
          <svg
            style={{
              position: "absolute",
              top: 140,
              right: 100,
              opacity: 0.12,
              animation: "float-y-slow 5s ease-in-out infinite",
            }}
            width="50" height="50" viewBox="0 0 50 50" fill="none"
          >
            <circle cx="25" cy="25" r="22" stroke="#34d399" strokeWidth="1" />
            <circle cx="25" cy="25" r="14" stroke="#34d399" strokeWidth="0.5" />
          </svg>

          {/* Floating bottom-left ring */}
          <svg
            style={{
              position: "absolute",
              bottom: 140,
              left: 100,
              opacity: 0.1,
              animation: "float-y 6s ease-in-out 1s infinite",
            }}
            width="36" height="36" viewBox="0 0 36 36" fill="none"
          >
            <circle cx="18" cy="18" r="16" stroke="#34d399" strokeWidth="1" />
          </svg>

          {/* Diagonal cross mark */}
          <svg
            className="particle-reveal"
            style={{ position: "absolute", bottom: 200, right: 120, animationDelay: "0.4s", opacity: 0 }}
            width="16" height="16" viewBox="0 0 16 16" fill="none"
          >
            <line x1="0" y1="0" x2="16" y2="16" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" />
            <line x1="16" y1="0" x2="0" y2="16" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" />
          </svg>
        </>
      )}

      {/* ── Main brand content ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          userSelect: "none",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Sweep line — top */}
        {phase >= 1 && (
          <div
            className="brand-sweep-line"
            style={{
              width: 240,
              height: 1,
              background: "linear-gradient(90deg, transparent, #34d399, transparent)",
              marginBottom: 36,
            }}
          />
        )}

        {/* ECOSYSTEM PARTNER label */}
        {phase >= 2 && (
          <p
            className="brand-word-reveal"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.25em",
              color: "#34d399",
              textTransform: "uppercase",
              marginBottom: 32,
              animationDelay: "0s",
            }}
          >
            Ecosystem Partner
          </p>
        )}

        {/* Main headline — "Grow by" */}
        {phase >= 2 && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 0, lineHeight: 1, marginBottom: 0 }}>
            <span
              className="brand-word-reveal"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(52px, 6vw, 80px)",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.04em",
                animationDelay: "0s",
              }}
            >
              Grow by{"\u00A0"}
            </span>

            {/* "Chat" — teal accent, blooms after */}
            {phase >= 3 && (
              <span
                className="brand-chat-reveal"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "clamp(52px, 6vw, 80px)",
                  fontWeight: 800,
                  color: "#34d399",
                  letterSpacing: "-0.04em",
                  animationDelay: "0s",
                  display: "inline-block",
                }}
              >
                Chat
              </span>
            )}
          </div>
        )}

        {/* Animated underline beneath "Chat" */}
        {phase >= 3 && (
          <div
            style={{
              width: "100%",
              height: 2,
              marginTop: 12,
              background: "linear-gradient(90deg, transparent 0%, #34d399 40%, transparent 100%)",
              animation: "line-grow 0.6s cubic-bezier(0.22,1,0.36,1) 0s forwards",
              transform: "scaleX(0)",
              transformOrigin: "center",
              borderRadius: 2,
            }}
          />
        )}

        {/* Tagline */}
        {phase >= 4 && (
          <p
            className="tagline-reveal"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 400,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.05em",
              marginTop: 24,
              animationDelay: "0s",
            }}
          >
            WhatsApp CRM · Built for Growth
          </p>
        )}

        {/* Meta co-brand partnership block */}
        {phase >= 4 && (
          <div
            className="tagline-reveal"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0,
              marginTop: 44,
              animationDelay: "0.2s",
            }}
          >
            {/* Label row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              {/* Left rule */}
              <div style={{ width: 32, height: 1, background: "#34d399", borderRadius: 1 }} />
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  color: "#34d399",
                  textTransform: "uppercase",
                }}
              >
                Verified Tech Provider
              </span>
              {/* Right rule */}
              <div style={{ width: 32, height: 1, background: "#34d399", borderRadius: 1 }} />
            </div>

            {/* Meta logo image + Tech Provider stack only (no duplicate Grow by Chat) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Official Meta logo */}
              <img
                src="/meta.png"
                alt="Meta logo"
                width={44}
                height={44}
                style={{ display: "block", objectFit: "contain" }}
              />

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#ffffff",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  Meta
                </span>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase",
                  }}
                >
                  Tech Provider
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sweep line — bottom */}
        {phase >= 1 && (
          <div
            className="brand-sweep-line"
            style={{
              width: 240,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
              marginTop: phase >= 4 ? 36 : 36,
              animationDelay: "0.05s",
            }}
          />
        )}
      </div>
    </div>
  );
}
