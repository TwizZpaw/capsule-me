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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <span className={className}>{formatCountdown(openAt, now)}</span>;
}
