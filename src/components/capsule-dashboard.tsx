"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CapsuleVessel } from "@/components/capsule-vessel";
import { KeywordChips } from "@/components/keyword-chips";
import { WeatherNote } from "@/components/weather-note";
import { useAuth } from "@/components/auth-provider";
import type { CapsuleSummary } from "@/lib/capsules";
import { capsuleSurface } from "@/lib/capsule-style";
import { formatOpenAt, getCountdownParts, isOpened } from "@/lib/time";
import type { WeatherSnapshot } from "@/lib/weather";

type Filter = "all" | "waiting" | "opened";

export function CapsuleDashboard({
  capsules,
  weather,
}: {
  capsules: CapsuleSummary[];
  weather: WeatherSnapshot | null;
}) {
  const { user, ready } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const waitingCount =
    now == null
      ? capsules.length
      : capsules.filter((capsule) => !isOpened(capsule.openAt, now)).length;
  const openedCount = now == null ? 0 : capsules.length - waitingCount;

  const visible = useMemo(() => {
    if (now == null || filter === "all") {
      return capsules;
    }
    if (filter === "waiting") {
      return capsules.filter((capsule) => !isOpened(capsule.openAt, now));
    }
    return capsules.filter((capsule) => isOpened(capsule.openAt, now));
  }, [capsules, filter, now]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="grid gap-4 lg:grid-cols-5">
        <TodayRecord now={now} weather={weather} />
        <BuryCard signedIn={ready && Boolean(user)} weather={weather} />
      </div>

      <section className="mt-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.35em] text-stone-700/70 uppercase">
              buried
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-800">
              묻힌 캡슐
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              열람일까지 남은 시간이 초 단위로 흘러가요
            </p>
          </div>

          <div className="flex gap-3">
            <Stat label="전체" value={capsules.length} />
            <Stat label="기다리는 중" value={waitingCount} />
            <Stat label="열림" value={openedCount} />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
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
          <div className="mt-8 rounded-3xl border border-white/50 bg-white/55 px-8 py-16 text-center backdrop-blur-md">
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
      </section>
    </div>
  );
}

function TodayRecord({
  now,
  weather,
}: {
  now: number | null;
  weather: WeatherSnapshot | null;
}) {
  const date = now == null ? null : new Date(now);
  const dateLabel = date
    ? date.toLocaleDateString("ko-KR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
  const timeLabel = date
    ? date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";
  const temperature =
    weather?.temperature != null && Number.isFinite(weather.temperature)
      ? `${Math.round(weather.temperature)}°`
      : "—";
  const humidity =
    weather?.humidity != null && Number.isFinite(weather.humidity)
      ? `${Math.round(weather.humidity)}%`
      : "—";

  return (
    <section className="rounded-[1.75rem] border border-white/50 bg-white/55 px-6 py-6 shadow-lg shadow-stone-900/5 backdrop-blur-md lg:col-span-3">
      <p className="text-xs tracking-[0.35em] text-stone-700/70 uppercase">today</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-800">
        오늘의 기록
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <RecordCell label="날짜" value={dateLabel} wide />
        <RecordCell label="시간" value={timeLabel} />
        <RecordCell label="날씨" value={weather?.condition ?? "불러오는 중"} />
        <RecordCell label="온도" value={temperature} />
        <RecordCell label="습도" value={humidity} />
      </div>
    </section>
  );
}

function RecordCell({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-white/70 px-4 py-3 ${wide ? "col-span-2" : ""}`}
    >
      <p className="text-[11px] tracking-wide text-stone-400">{label}</p>
      <p className="mt-1 text-base font-medium tabular-nums text-stone-800">{value}</p>
    </div>
  );
}

function BuryCard({
  signedIn,
  weather,
}: {
  signedIn: boolean;
  weather: WeatherSnapshot | null;
}) {
  return (
    <section className="flex flex-col justify-between rounded-[1.75rem] border border-white/50 bg-stone-800 px-6 py-6 text-amber-50 shadow-lg shadow-stone-900/10 lg:col-span-2">
      <div>
        <p className="text-xs tracking-[0.35em] text-amber-100/60 uppercase">write</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">캡슐 묻기</h2>
        <p className="mt-3 text-sm leading-6 text-amber-50/75">
          지금 이 시각과 날씨를 편지에 함께 담아요.
          {weather?.condition ? ` 지금은 ${weather.condition}이에요.` : ""}
        </p>
      </div>
      <Link
        href="/new"
        className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-amber-50 px-6 py-3.5 text-sm font-medium text-stone-800 transition hover:bg-white"
      >
        {signedIn ? "캡슐 묻으러 가기" : "만들어 보기"}
      </Link>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-24 rounded-2xl border border-white/50 bg-white/55 px-4 py-3 text-center backdrop-blur-md">
      <p className="text-2xl font-semibold text-stone-800">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{label}</p>
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
          : "border border-white/50 bg-white/55 text-stone-600 hover:text-stone-800"
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
  now: number | null;
}) {
  const opened = now != null && isOpened(capsule.openAt, now);
  const parts = now == null ? null : getCountdownParts(capsule.openAt, now);

  return (
    <Link
      href={`/capsule/${capsule.id}`}
      className="block overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-sm shadow-stone-900/5 backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor: capsule.style ? `${capsule.style.colorFrom}99` : undefined,
      }}
    >
      <div
        className={`relative flex h-36 items-center justify-center ${
          capsule.style ? "" : "bg-linear-to-br from-amber-100 to-rose-100"
        }`}
        style={{
          background: capsule.style
            ? capsuleSurface(capsule.style)
            : undefined,
        }}
      >
        {opened && capsule.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capsule.coverUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : capsule.style ? (
          <CapsuleVessel style={capsule.style} size="sm" />
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
        <WeatherNote className="mt-1 text-xs text-stone-400" weather={capsule.weather} />

        <div className="mt-4">
          {now == null || parts == null ? (
            <p className="text-sm text-stone-400">···</p>
          ) : opened ? (
            <p className="text-sm font-semibold text-emerald-700">열 수 있어요</p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              <TimeUnit value={parts.days} label="일" />
              <TimeUnit value={parts.hours} label="시간" />
              <TimeUnit value={parts.minutes} label="분" />
              <TimeUnit value={parts.seconds} label="초" />
            </div>
          )}
        </div>

        {capsule.style ? (
          <div className="mt-3">
            <KeywordChips keywords={capsule.style.keywords} accent={capsule.style.colorTo} />
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-stone-800 px-1 py-2 text-center text-amber-50">
      <p className="text-lg font-semibold tabular-nums leading-none">
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 text-[9px] tracking-wide text-amber-100/70">{label}</p>
    </div>
  );
}
