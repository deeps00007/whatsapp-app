import React from "react";

interface AuthLogoProps {
  className?: string;
  size?: number;
}

export function AuthLogo({ className = "text-[#4f46e5]", size = 44 }: AuthLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Crown/W-like Section */}
      <path
        d="M20 48L32 20L41 33L50 20L59 33L68 20L80 48H66L58 35H42L34 48H20Z"
        fill="currentColor"
      />
      {/* Bottom T-like Stem and Wings Section */}
      <path
        d="M44 58H30L22 66L34 66L44 58Z"
        fill="currentColor"
      />
      <path
        d="M56 58H70L78 66L66 66L56 58Z"
        fill="currentColor"
      />
      <path
        d="M44 54H56V80H44V54Z"
        fill="currentColor"
      />
      <path
        d="M38 72H44V80H38V72Z"
        fill="currentColor"
      />
      <path
        d="M56 72H62V80H56V72Z"
        fill="currentColor"
      />
    </svg>
  );
}
