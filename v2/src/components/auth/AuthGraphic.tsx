import React from "react";

export function AuthGraphic() {
  return (
    <div className="relative w-full h-full bg-[#0d0f50] overflow-hidden">
      <svg
        className="w-full h-full"
        viewBox="0 0 800 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Grid pattern for the bottom right cyan area */}
          <pattern id="dot-grid-cyan" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="1.5" fill="#ffffff" fillOpacity="0.8" />
          </pattern>

          {/* Dotted grid for the top center block */}
          <pattern id="dot-grid-navy" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="1.2" fill="#5865f2" fillOpacity="0.4" />
          </pattern>

          {/* Diagonal stripes for the cube face */}
          <pattern id="diagonal-stripes" x="0" y="0" width="12" height="12" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="12" stroke="#5c62d6" strokeWidth="2.5" />
          </pattern>

          {/* Horizontal lines for shading */}
          <pattern id="horizontal-stripes" x="0" y="0" width="10" height="8" patternUnits="userSpaceOnUse">
            <line x1="0" y1="4" x2="10" y2="4" stroke="#4f46e5" strokeWidth="2" strokeOpacity="0.4" />
          </pattern>
        </defs>

        {/* ================= BACKGROUND ================= */}
        <rect width="800" height="1000" fill="#0c0e54" />

        {/* ================= TOP ROW ================= */}
        {/* Top-Left: Violet leaf/flower pattern */}
        <g id="top-left-violet">
          <rect x="0" y="0" width="380" height="248" fill="#4d24be" />
          {/* Stylized leaf/petal arches facing each other */}
          <path d="M70 248C70 120 170 50 190 50C210 50 310 120 310 248Z" fill="#884df2" />
          <path d="M190 248C190 140 270 80 290 80C310 80 380 140 380 248Z" fill="#aa7bf7" />
          <path d="M0 248C0 140 80 80 100 80C120 80 190 140 190 248Z" fill="#aa7bf7" />
        </g>

        {/* Top-Center: Navy square with orange/yellow diamonds & barcode */}
        <g id="top-center-navy" transform="translate(380, 0)">
          <rect x="0" y="0" width="180" height="248" fill="#070a3c" />
          {/* Orange/yellow diamonds */}
          <rect x="50" y="40" width="22" height="22" transform="rotate(45, 61, 51)" fill="#ea580c" />
          <rect x="85" y="40" width="22" height="22" transform="rotate(45, 96, 51)" fill="#facc15" />
          
          {/* Dot grid */}
          <rect x="130" y="25" width="40" height="40" fill="url(#dot-grid-navy)" />

          {/* Barcode-like vertical stripes */}
          <g transform="translate(20, 130)">
            <rect x="0" y="0" width="140" height="50" fill="#1e1b4b" rx="4" />
            <line x1="10" y1="10" x2="10" y2="40" stroke="#ffffff" strokeWidth="3" />
            <line x1="18" y1="10" x2="18" y2="40" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="24" y1="10" x2="24" y2="40" stroke="#ffffff" strokeWidth="5" />
            <line x1="34" y1="10" x2="34" y2="40" stroke="#ffffff" strokeWidth="2" />
            <line x1="40" y1="10" x2="40" y2="40" stroke="#ffffff" strokeWidth="4" />
            <line x1="48" y1="10" x2="48" y2="40" stroke="#ffffff" strokeWidth="1" />
            <line x1="54" y1="10" x2="54" y2="40" stroke="#ffffff" strokeWidth="3.5" />
            <line x1="62" y1="10" x2="62" y2="40" stroke="#ffffff" strokeWidth="1" />
            <line x1="68" y1="10" x2="68" y2="40" stroke="#ffffff" strokeWidth="4.5" />
            <line x1="78" y1="10" x2="78" y2="40" stroke="#ffffff" strokeWidth="2" />
            <line x1="84" y1="10" x2="84" y2="40" stroke="#ffffff" strokeWidth="3" />
            <line x1="92" y1="10" x2="92" y2="40" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="98" y1="10" x2="98" y2="40" stroke="#ffffff" strokeWidth="5" />
            <line x1="108" y1="10" x2="108" y2="40" stroke="#ffffff" strokeWidth="2" />
            <line x1="116" y1="10" x2="116" y2="40" stroke="#ffffff" strokeWidth="4" />
            <line x1="124" y1="10" x2="124" y2="40" stroke="#ffffff" strokeWidth="1" />
            <line x1="130" y1="10" x2="130" y2="40" stroke="#ffffff" strokeWidth="3" />
          </g>
        </g>

        {/* Top-Right: Isometric cubes and circular spiral patterns */}
        <g id="top-right-cubes" transform="translate(560, 0)">
          <rect x="0" y="0" width="240" height="248" fill="#2d37a4" />
          
          {/* Circular spiral/nested rings */}
          <circle cx="45" cy="180" r="35" stroke="#4f46e5" strokeWidth="4" strokeOpacity="0.6" />
          <circle cx="45" cy="180" r="27" stroke="#4f46e5" strokeWidth="3" strokeOpacity="0.6" />
          <circle cx="45" cy="180" r="19" stroke="#4f46e5" strokeWidth="2.5" strokeOpacity="0.6" />
          <circle cx="45" cy="180" r="11" stroke="#4f46e5" strokeWidth="2" strokeOpacity="0.6" />

          {/* 3D Isometric Cubes */}
          {/* Cube 1 (Top-Left in this cell) */}
          <g transform="translate(100, 30)">
            {/* Top Face */}
            <polygon points="50,0 100,25 50,50 0,25" fill="#5c62d6" />
            {/* Left Face */}
            <polygon points="0,25 50,50 50,100 0,75" fill="#313797" />
            {/* Right Face (Striped) */}
            <polygon points="50,50 100,25 100,75 50,100" fill="url(#diagonal-stripes)" />
            <polygon points="50,50 100,25 100,75 50,100" stroke="#2d37a4" strokeWidth="1.5" fill="none" />
          </g>

          {/* Cube 2 (Bottom-Right in this cell) */}
          <g transform="translate(150, 105)">
            <polygon points="50,0 100,25 50,50 0,25" fill="#757be7" />
            <polygon points="0,25 50,50 50,100 0,75" fill="#3c43b3" />
            <polygon points="50,50 100,25 100,75 50,100" fill="url(#diagonal-stripes)" />
            <polygon points="50,50 100,25 100,75 50,100" stroke="#2d37a4" strokeWidth="1.5" fill="none" />
          </g>
        </g>

        {/* ================= MIDDLE ROW ================= */}
        {/* Background band */}
        <rect x="0" y="248" width="800" height="332" fill="#1b218a" />

        {/* Middle-Left: cyan triangles stacked */}
        <g id="middle-left-triangles" transform="translate(20, 280)">
          <polygon points="30,0 60,45 0,45" fill="#38bdf8" />
          <polygon points="30,40 60,85 0,85" fill="#0284c7" />
        </g>

        {/* Middle-Center-Left: White four-pointed star and leaf accent */}
        <g id="middle-center-star" transform="translate(180, 270)">
          {/* Small leaf designs pointing up */}
          <path d="M30 40C30 15 45 5 50 5C55 5 70 15 70 40Z" fill="#1b1c61" fillOpacity="0.4" />
          <path d="M50 40C50 20 60 12 65 12C70 12 80 20 80 40Z" fill="#2e3192" fillOpacity="0.5" />
          <path d="M10 40C10 20 20 12 25 12C30 12 40 20 40 40Z" fill="#2e3192" fillOpacity="0.5" />

          {/* White 4-point star */}
          <path d="M50,45 C50,65 50,65 70,65 C50,65 50,65 50,85 C50,65 50,65 30,65 C50,65 50,65 50,45 Z" fill="#ffffff" />
        </g>

        {/* Middle-Center-Right: Vertical series of pill shapes */}
        <g id="middle-center-pills" transform="translate(380, 290)">
          <rect x="0" y="0" width="16" height="60" rx="8" fill="#4d53be" />
          <rect x="24" y="20" width="16" height="50" rx="8" fill="#31359c" />
        </g>

        {/* Middle-Right: Cyan horizontal stripes and arcs */}
        <g id="middle-right-stripes" transform="translate(520, 310)">
          {/* Fading horizontal stripes */}
          <rect x="0" y="0" width="280" height="12" rx="6" fill="#3b82f6" fillOpacity="0.8" />
          <rect x="40" y="24" width="240" height="12" rx="6" fill="#2563eb" fillOpacity="0.6" />
          <rect x="80" y="48" width="200" height="12" rx="6" fill="#1d4ed8" fillOpacity="0.4" />
          <rect x="120" y="72" width="160" height="12" rx="6" fill="#1e40af" fillOpacity="0.2" />
        </g>


        {/* ================= LOWER MIDDLE ROW ================= */}
        {/* Background panel */}
        <rect x="0" y="580" width="800" height="170" fill="#251a94" />

        {/* Bright gold starburst behind cyan/teal square */}
        <g id="gold-starburst" transform="translate(20, 500)">
          {/* 8-point gold starburst */}
          <g transform="translate(130, 80)">
            <path d="M0 -50 L12 -12 L50 0 L12 12 L0 50 L-12 12 L-50 0 L-12 -12 Z" fill="#eab308" />
            <path d="M0 -50 L12 -12 L50 0 L12 12 L0 50 L-12 12 L-50 0 L-12 -12 Z" transform="rotate(45)" fill="#fbbf24" />
          </g>

          {/* Cyan Square overlay */}
          <rect x="10" y="20" width="120" height="130" fill="#06b6d4" />
          <polygon points="10,150 130,150 130,20" fill="#0891b2" fillOpacity="0.4" />
        </g>

        {/* Horizontal parallel lines spanning across */}
        <line x1="160" y1="640" x2="520" y2="640" stroke="#120c56" strokeWidth="4" />
        <line x1="160" y1="660" x2="520" y2="660" stroke="#120c56" strokeWidth="4" />
        <line x1="160" y1="680" x2="520" y2="680" stroke="#120c56" strokeWidth="4" strokeOpacity="0.7" />

        {/* Small four circles */}
        <circle cx="580" cy="490" r="10" fill="#383fa4" />
        <circle cx="610" cy="490" r="10" fill="#383fa4" />
        <circle cx="640" cy="490" r="10" fill="#383fa4" />
        <circle cx="670" cy="490" r="10" fill="#383fa4" />

        {/* Radial fan / Burst lines */}
        <g id="radial-fan" transform="translate(680, 530)">
          {/* Draw multiple spokes radiating from center */}
          <circle cx="0" cy="0" r="5" fill="#cbd5e1" />
          <line x1="0" y1="0" x2="-45" y2="-15" stroke="#cbd5e1" strokeWidth="2.5" />
          <line x1="0" y1="0" x2="-40" y2="-30" stroke="#cbd5e1" strokeWidth="2.5" />
          <line x1="0" y1="0" x2="-25" y2="-40" stroke="#cbd5e1" strokeWidth="2.5" />
          <line x1="0" y1="0" x2="-5" y2="-45" stroke="#cbd5e1" strokeWidth="2.5" />
          <line x1="0" y1="0" x2="15" y2="-40" stroke="#cbd5e1" strokeWidth="2.5" />
          <line x1="0" y1="0" x2="30" y2="-30" stroke="#cbd5e1" strokeWidth="2.5" />
          <line x1="0" y1="0" x2="40" y2="-15" stroke="#cbd5e1" strokeWidth="2.5" />
          
          <line x1="0" y1="0" x2="-48" y2="5" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="0" y1="0" x2="48" y2="5" stroke="#cbd5e1" strokeWidth="2" />

          {/* Dots on outer ends */}
          <circle cx="-45" cy="-15" r="3.5" fill="#cbd5e1" />
          <circle cx="-40" cy="-30" r="3.5" fill="#cbd5e1" />
          <circle cx="-25" cy="-40" r="3.5" fill="#cbd5e1" />
          <circle cx="-5" cy="-45" r="3.5" fill="#cbd5e1" />
          <circle cx="15" cy="-40" r="3.5" fill="#cbd5e1" />
          <circle cx="30" cy="-30" r="3.5" fill="#cbd5e1" />
          <circle cx="40" cy="-15" r="3.5" fill="#cbd5e1" />
        </g>

        {/* Large dark blue circular arc / Hook hook-shape */}
        <g id="large-hook" transform="translate(680, 720)">
          {/* A thick circular track wrapping around */}
          <path d="M120 -140 A 120 120 0 1 0 120 100 L 120 30 A 50 50 0 1 1 50 -50 L 120 -50 Z" fill="#04062e" />
          {/* Inner details */}
          <circle cx="0" cy="0" r="70" fill="#2d22a4" />
          <circle cx="0" cy="0" r="35" fill="#1b1c61" />
          <circle cx="80" cy="-80" r="6" fill="#ffffff" />
        </g>


        {/* ================= BOTTOM ROW ================= */}
        {/* Bottom-Left: Concentric purple arcs */}
        <g id="bottom-left-arcs" transform="translate(0, 750)">
          <rect x="0" y="0" width="380" height="250" fill="#090a36" />
          <circle cx="50" cy="200" r="180" stroke="#7c3aed" strokeWidth="6" fill="none" />
          <circle cx="50" cy="200" r="140" stroke="#6366f1" strokeWidth="4" fill="none" />
          <circle cx="50" cy="200" r="100" stroke="#4f46e5" strokeWidth="3" fill="none" />
          <circle cx="50" cy="200" r="60" stroke="#312e81" strokeWidth="2.5" fill="none" />
        </g>

        {/* Bottom-Center-Left: Thin lines/curves */}
        <path d="M20 770 C 100 770, 180 840, 200 900" stroke="#1e1b4b" strokeWidth="3.5" fill="none" />
        <path d="M20 790 C 90 790, 160 850, 180 900" stroke="#1e1b4b" strokeWidth="3" fill="none" strokeOpacity="0.7" />

        {/* Bottom-Center: Waves, circle, and lines on Navy */}
        <g id="bottom-center-decor" transform="translate(380, 750)">
          <rect x="0" y="0" width="280" height="250" fill="#030526" />
          
          {/* Vertical hanging bar with small circle */}
          <line x1="160" y1="0" x2="160" y2="120" stroke="#2563eb" strokeWidth="5" />
          <circle cx="160" cy="140" r="14" fill="#2563eb" />

          {/* Zigzag / Wave lines at the bottom */}
          <path d="M50 200 Q 65 190, 80 200 T 110 200 T 140 200 T 170 200 T 200 200 T 230 200" stroke="#38bdf8" strokeWidth="3" fill="none" />
          <path d="M50 215 Q 65 205, 80 215 T 110 215 T 140 215 T 170 215 T 200 215 T 230 215" stroke="#1d4ed8" strokeWidth="2.5" fill="none" />
        </g>

        {/* Bottom-Right: Cyan/teal diagonal section with white dot grid */}
        <g id="bottom-right-cyan" transform="translate(660, 750)">
          {/* Diagonal split polygon */}
          <polygon points="140,0 140,250 0,250" fill="#06b6d4" />
          <polygon points="0,250 140,250 140,0" fill="#22d3ee" />
          
          {/* Dot grid overlays the diagonal section */}
          <g transform="translate(80, 120)">
            <rect width="60" height="120" fill="url(#dot-grid-cyan)" />
          </g>
        </g>
      </svg>
    </div>
  );
}
