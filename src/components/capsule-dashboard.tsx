"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Countdown } from "@/components/countdown";
import type { CapsuleSummary } from "@/lib/capsules";
import { formatOpenAt, isOpened } from "@/lib/time";

type Filter = "all" | "waiting" | "opened";

export function CapsuleDashboard({ capsules }: { capsules: CapsuleSummary[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const waitingCount = capsules.filter((capsule) => !isOpened(capsule.openAt, now)).length;
  const openedCount = capsules.length - waitingCount;

  const visible = useMemo(() => {
    if (filter === "waiting") {
      return capsules.filter((capsule) => !isOpened(capsule.openAt, now));
    }
    if (filter === "opened") {
      return capsules.filter((capsule) => isOpened(capsule.openAt, now));
    }
    return capsules;
  }, [capsules, filter, now]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.35em] text-amber-800/70 uppercase">
            dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-800">
            묻힌 캡슐
          </h1>
          <p className="mt-3 text-stone-500">사람들이 묻어 둔 캡슐과 열리기까지 남은 시간</p>
        </div>

        <div className="flex gap-3">
          <Stat label="전체" value={capsules.length} />
          <Stat label="기다리는 중" value={waitingCount} />
          <Stat label="열림" value={openedCount} />
        </div>
      </div>

      <div className="mt-8 flex gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          전체
        </FilterButton>
        <FilterButton
          active={filter === "waiting"}
          onClick={() => setFilter("waiting")}
        >
          기다리는 중
        </FilterButton>
        <FilterButton
          active={filter === "opened"}
          onClick={() => setFilter("opened")}
        >
          열 수 있어요
        </FilterButton>
      </div>

      {visible.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-amber-100 bg-white/80 px-8 py-16 text-center">
          <p className="text-stone-500">아직 보여 줄 캡슐이 없어요</p>
          <Link
            href="/new"
            className="mt-6 inline-flex rounded-full bg-stone-800 px-6 py-3 text-sm text-amber-50"
          >
            첫 캡슐 묻기
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {visible.map((capsule) => (
            <li key={capsule.id}>
              <CapsuleCard capsule={capsule} now={now} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-24 rounded-2xl border border-amber-100 bg-white/80 px-4 py-3 text-center">
      <p className="text-2xl font-semibold text-stone-800">{value}</p>
      <p className="mt-1 text-xs text-stone-400">{label}</p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active
          ? "bg-stone-800 text-amber-50"
          : "border border-amber-100 bg-white/80 text-stone-500 hover:text-stone-800"
      }`}
    >
      {children}
    </button>
  );
}

function CapsuleCard({
  capsule,
  now,
}: {
  capsule: CapsuleSummary;
  now: number;
}) {
  const opened = isOpened(capsule.openAt, now);

  return (
    <Link
      href={`/capsule/${capsule.id}`}
      className="block overflow-hidden rounded-3xl border border-amber-100 bg-white/80 shadow-sm shadow-amber-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-40 bg-linear-to-br from-amber-100 to-rose-100">
        {capsule.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capsule.coverUrl}
            alt=""
            className={`size-full object-cover ${opened ? "" : "blur-[2px] scale-105"}`}
          />
        ) : null}
        <span
          className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-medium ${
            opened ? "bg-emerald-700 text-emerald-50" : "bg-stone-800/80 text-amber-50"
          }`}
        >
          {opened ? "열림" : "봉인"}
        </span>
      </div>

      <div className="px-5 py-4">
        <p className="text-lg font-semibold text-stone-800">{capsule.recipient}에게</p>
        <p className="mt-1 text-sm text-stone-400">{formatOpenAt(capsule.openAt)}</p>
        <p className="mt-3 text-sm font-medium text-amber-800">
          <Countdown openAt={capsule.openAt} />
        </p>
      </div>
    </Link>
  );
}
