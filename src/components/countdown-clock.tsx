"use client";

import { useEffect, useState } from "react";
import { getCountdownParts } from "@/lib/time";

export function CountdownClock({ openAt }: { openAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = getCountdownParts(openAt, now);

  if (parts.opened) {
    return (
      <p className="text-xl font-semibold text-emerald-700">이제 열 수 있어요</p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      <Unit value={parts.days} label="일" />
      <Unit value={parts.hours} label="시간" />
      <Unit value={parts.minutes} label="분" />
      <Unit value={parts.seconds} label="초" />
    </div>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-stone-800 px-2 py-3 text-center text-amber-50">
      <p className="text-2xl font-semibold tabular-nums">
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 text-[10px] tracking-wide text-amber-100/70">{label}</p>
    </div>
  );
}
