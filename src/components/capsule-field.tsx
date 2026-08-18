"use client";

import Link from "next/link";
import { CapsuleVessel } from "@/components/capsule-vessel";
import { Countdown } from "@/components/countdown";
import type { CapsuleSummary } from "@/lib/capsules";
import { fallbackCapsuleStyle, type CapsuleStyle } from "@/lib/capsule-style";
import { isOpened } from "@/lib/time";

function hashId(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function layout(capsules: CapsuleSummary[], now: number) {
  const placed: {
    capsule: CapsuleSummary;
    style: CapsuleStyle;
    left: number;
    top: number;
    tilt: number;
    delay: number;
    duration: number;
    scale: number;
    z: number;
    opened: boolean;
  }[] = [];

  for (const capsule of capsules) {
    const hash = hashId(capsule.id);
    const opened = isOpened(capsule.openAt, now);
    const days = Math.max(0, (new Date(capsule.openAt).getTime() - now) / 86_400_000);
    const rise = opened ? 1 : Math.max(0, Math.min(1, 1 - days / 90));
    let left = 10 + ((hash % 8200) / 8200) * 80;
    const top = 12 + (1 - rise) * 66;
    const neighbors = placed.filter((item) => Math.abs(item.top - top) < 14);
    for (const neighbor of neighbors) {
      if (Math.abs(neighbor.left - left) < 12) {
        left = (left + 17) % 82 + 9;
      }
    }

    placed.push({
      capsule,
      style: capsule.style ?? fallbackCapsuleStyle(capsule.weather),
      left,
      top,
      tilt: ((hash % 17) - 8) * 2.4,
      delay: (hash % 21) * -0.18,
      duration: 4.2 + (hash % 10) * 0.38,
      scale: 0.78 + (hash % 6) * 0.05 + rise * 0.16,
      z: 10 + Math.round(rise * 40),
      opened,
    });
  }

  return placed;
}

export function CapsuleField({
  capsules,
  now,
  interactive = true,
}: {
  capsules: CapsuleSummary[];
  now: number;
  interactive?: boolean;
}) {
  const items = layout(capsules, now);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0">
      {items.map((item) => {
        const inner = (
          <div className="flex flex-col items-center">
            <CapsuleVessel style={item.style} size={item.scale > 1 ? "md" : "sm"} />
            <p className="mt-1 max-w-28 truncate text-center text-[11px] font-medium text-stone-800/90 drop-shadow-sm">
              {item.capsule.recipient}
            </p>
            <p className="text-[10px] text-stone-700/80">
              {item.opened ? "열림" : <Countdown openAt={item.capsule.openAt} />}
            </p>
          </div>
        );

        const className = "capsule-bob absolute -translate-x-1/2 -translate-y-1/2";
        const style = {
          left: `${item.left}%`,
          top: `${item.top}%`,
          zIndex: item.z,
          ["--tilt" as string]: `${item.tilt}deg`,
          ["--bob-delay" as string]: `${item.delay}s`,
          ["--bob-duration" as string]: `${item.duration}s`,
          ["--bob-scale" as string]: String(item.scale),
        };

        if (!interactive) {
          return (
            <div key={item.capsule.id} className={className} style={style}>
              {inner}
            </div>
          );
        }

        return (
          <Link
            key={item.capsule.id}
            href={`/capsule/${item.capsule.id}`}
            className={`${className} cursor-pointer`}
            style={style}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
