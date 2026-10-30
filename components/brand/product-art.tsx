/** Placeholder illustration for the landing page. Swap for a real sample photo later. */
export function ProductArt({ width = 260 }: { width?: number }) {
  return (
    <svg viewBox="0 0 240 205" width={width} role="img" aria-label="Tan handbag illustration">
      <defs>
        <radialGradient id="pa-b" cx=".35" cy=".2" r="1">
          <stop offset="0" stopColor="#E6BC88" /><stop offset=".6" stopColor="#BE8A55" /><stop offset="1" stopColor="#8A5E34" />
        </radialGradient>
        <filter id="pa-s"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <ellipse cx="124" cy="194" rx="96" ry="8" fill="#000" opacity=".45" filter="url(#pa-s)" />
      <path d="M82 96 C78 28 162 28 158 96" fill="none" stroke="#6E4B2C" strokeWidth="9" strokeLinecap="round" />
      <path d="M34 98 H206 L216 178 Q217 190 205 190 H35 Q23 190 24 178 Z" fill="url(#pa-b)" />
      <path d="M30 98 H210 L205 134 Q120 156 35 134 Z" fill="#F2D3A2" opacity=".35" />
      <rect x="106" y="126" width="28" height="24" rx="6" fill="#D9B34A" stroke="#8F6A16" />
    </svg>
  );
}