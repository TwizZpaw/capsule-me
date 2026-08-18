"use client";

import Link from "next/link";
import { CapsuleVessel } from "@/components/capsule-vessel";
import { KeywordChips } from "@/components/keyword-chips";
import type { CapsuleSummary } from "@/lib/capsules";
import { capsuleSurface } from "@/lib/capsule-style";

export function GuestLanding({ capsules }: { capsules: CapsuleSummary[] }) {
  const preview = capsules.slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <section className="rounded-[2rem] border border-amber-100/80 bg-white/80 px-8 py-14 text-center shadow-xl shadow-amber-900/5 sm:px-16">
        <p className="text-xs tracking-[0.35em] text-amber-800/70 uppercase">
          time capsule
        </p>
        <p className="mt-6 text-sm text-stone-500">지금까지 묻힌 캡슐</p>
        <p className="mt-2 text-6xl font-semibold tracking-tight text-stone-800">
          {capsules.length}
        </p>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-stone-800 sm:text-4xl">
          오늘의 날씨를 담아, 나중에 열어요
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-stone-500">
          로그인 없이 먼저 만들어 볼 수 있어요. 날씨에 맞는 캡슐이 생기면, 그때
          묻어 두세요.
        </p>
        <Link
          href="/new"
          className="mt-8 inline-flex rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium tracking-wide text-amber-50 shadow-sm transition hover:bg-stone-700"
        >
          캡슐 만들어 보기
        </Link>
      </section>

      {preview.length > 0 ? (
        <section className="mt-12">
          <p className="text-center text-sm text-stone-400">사람들이 묻어 둔 캡슐</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {preview.map((capsule) => (
              <li
                key={capsule.id}
                className="overflow-hidden rounded-3xl border bg-white/80"
                style={{
                  borderColor: capsule.style
                    ? `${capsule.style.colorFrom}99`
                    : undefined,
                }}
              >
                <div
                  className="flex h-36 items-center justify-center"
                  style={{
                    background: capsule.style
                      ? capsuleSurface(capsule.style)
                      : undefined,
                  }}
                >
                  {capsule.style ? (
                    <CapsuleVessel style={capsule.style} size="sm" />
                  ) : null}
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm font-medium text-stone-700">
                    {capsule.recipient}에게
                  </p>
                  {capsule.style ? (
                    <div className="mt-3">
                      <KeywordChips
                        keywords={capsule.style.keywords}
                        accent={capsule.style.colorTo}
                      />
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
