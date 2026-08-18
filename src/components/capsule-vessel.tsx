"use client";

import { useId } from "react";
import type { CapsuleShape, CapsuleStyle } from "@/lib/capsule-style";

export function CapsuleVessel({
  style,
  size = "md",
}: {
  style: CapsuleStyle;
  size?: "sm" | "md" | "lg";
}) {
  const uid = useId().replace(/:/g, "");
  const px = size === "sm" ? 86 : size === "lg" ? 188 : 128;
  const bodyId = `capsule-body-${uid}`;
  const glowId = `capsule-glow-${uid}`;
  const glassId = `capsule-glass-${uid}`;
  const clipId = `capsule-clip-${uid}`;

  const from = style.colorFrom;
  const to = style.fill === "solid" ? style.colorFrom : style.colorTo;
  const highlight = style.colorAccent;

  return (
    <div
      className="relative mx-auto"
      style={{
        width: px,
        height: Math.round(px * 1.28),
        filter: `drop-shadow(0 16px 18px ${to}66)`,
      }}
    >
      <svg viewBox="0 0 160 200" className="size-full" aria-hidden>
        <defs>
          <linearGradient id={bodyId} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <radialGradient id={glowId} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="55%" stopColor={from} stopOpacity="0.28" />
            <stop offset="100%" stopColor={to} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={glassId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="42%" stopColor={from} stopOpacity="0.18" />
            <stop offset="100%" stopColor={to} stopOpacity="0.5" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x="46" y="38" width="68" height="132" rx="34" />
          </clipPath>
        </defs>

        <line
          x1="80"
          y1="8"
          x2="80"
          y2="28"
          stroke={to}
          strokeOpacity="0.45"
          strokeWidth="2"
        />
        <rect x="58" y="22" width="44" height="16" rx="6" fill={to} />
        <rect x="64" y="18" width="32" height="10" rx="4" fill={highlight} />

        <rect x="44" y="36" width="72" height="138" rx="36" fill={`url(#${glassId})`} />
        <rect
          x="46"
          y="38"
          width="68"
          height="132"
          rx="34"
          fill={`url(#${bodyId})`}
          opacity="0.88"
        />

        <g clipPath={`url(#${clipId})`} transform="translate(0 28) scale(1)">
          <ShapePath
            shape={style.shape}
            body={`url(#${bodyId})`}
            glow={`url(#${glowId})`}
          />
        </g>

        <path
          d="M52 52 C58 44 70 40 80 40"
          fill="none"
          stroke="white"
          strokeOpacity="0.55"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <rect
          x="46"
          y="38"
          width="68"
          height="132"
          rx="34"
          fill="none"
          stroke="white"
          strokeOpacity="0.28"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}

function ShapePath({
  shape,
  body,
  glow,
}: {
  shape: CapsuleShape;
  body: string;
  glow: string;
}) {
  if (shape === "drop") {
    return (
      <>
        <path
          d="M80 28 C80 28 40 78 40 108 a40 40 0 0 0 80 0 C120 78 80 28 80 28Z"
          fill={body}
        />
        <ellipse cx="80" cy="112" rx="22" ry="14" fill={glow} />
      </>
    );
  }

  if (shape === "cloud") {
    return (
      <>
        <path
          d="M48 108 a24 24 0 0 1 6-46 30 30 0 0 1 56 8 22 22 0 0 1 16 38 H52 Z"
          fill={body}
        />
        <circle cx="68" cy="86" r="14" fill={glow} />
      </>
    );
  }

  if (shape === "sun") {
    return (
      <>
        {Array.from({ length: 8 }, (_, index) => {
          const angle = (index * Math.PI) / 4;
          return (
            <line
              key={index}
              x1={80 + Math.cos(angle) * 28}
              y1={86 + Math.sin(angle) * 28}
              x2={80 + Math.cos(angle) * 46}
              y2={86 + Math.sin(angle) * 46}
              stroke={body}
              strokeWidth="7"
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="80" cy="86" r="24" fill={body} />
        <circle cx="80" cy="86" r="14" fill={glow} />
      </>
    );
  }

  if (shape === "flake") {
    return (
      <>
        <circle cx="80" cy="88" r="40" fill={body} opacity="0.85" />
        {Array.from({ length: 6 }, (_, index) => (
          <g key={index} transform={`rotate(${index * 60} 80 88)`}>
            <line x1="80" y1="52" x2="80" y2="124" stroke={glow} strokeWidth="5" />
            <line
              x1="80"
              y1="64"
              x2="66"
              y2="74"
              stroke="white"
              strokeOpacity="0.75"
              strokeWidth="3"
            />
            <line
              x1="80"
              y1="64"
              x2="94"
              y2="74"
              stroke="white"
              strokeOpacity="0.75"
              strokeWidth="3"
            />
          </g>
        ))}
      </>
    );
  }

  if (shape === "petal") {
    return (
      <>
        {Array.from({ length: 5 }, (_, index) => (
          <ellipse
            key={index}
            cx="80"
            cy="58"
            rx="14"
            ry="28"
            fill={body}
            transform={`rotate(${index * 72} 80 88)`}
          />
        ))}
        <circle cx="80" cy="88" r="12" fill={glow} />
      </>
    );
  }

  if (shape === "lantern") {
    return (
      <>
        <rect x="58" y="52" width="44" height="72" rx="14" fill={body} />
        <rect x="66" y="42" width="28" height="12" rx="4" fill={body} />
        <ellipse cx="80" cy="86" rx="12" ry="20" fill={glow} />
      </>
    );
  }

  if (shape === "wave") {
    return (
      <>
        <path
          d="M36 92 C50 64 66 118 80 92 C94 66 110 118 124 92 V132 H36 Z"
          fill={body}
        />
        <path
          d="M36 84 C50 58 66 110 80 84 C94 58 110 110 124 84"
          fill="none"
          stroke={glow}
          strokeWidth="7"
        />
      </>
    );
  }

  return (
    <>
      <circle cx="80" cy="88" r="28" fill={glow} />
      <circle cx="80" cy="88" r="16" fill={body} />
    </>
  );
}
