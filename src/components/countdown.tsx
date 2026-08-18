"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/time";

export function Countdown({
  openAt,
  className = "",
}: {
  openAt: string;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (now == null) {
    return <span className={className}>···</span>;
  }

  return <span className={className}>{formatCountdown(openAt, now)}</span>;
}
