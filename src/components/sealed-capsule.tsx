"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CountdownClock } from "@/components/countdown-clock";
import { CapsuleVessel } from "@/components/capsule-vessel";
import { KeywordChips } from "@/components/keyword-chips";
import { WeatherNote } from "@/components/weather-note";
import { WeatherScene } from "@/components/weather-scene";
import type { CapsuleImage } from "@/lib/capsules";
import { capsuleSurface, type CapsuleStyle } from "@/lib/capsule-style";
import { formatOpenAt } from "@/lib/time";
import type { WeatherSnapshot } from "@/lib/weather";

type Preview = {
  letter: string;
  images: CapsuleImage[];
  weather: WeatherSnapshot | null;
  style: CapsuleStyle | null;
};

export function SealedCapsule({
  recipient,
  openAt,
  weather,
  style,
  preview,
}: {
  recipient: string;
  openAt: string;
  weather: WeatherSnapshot | null;
  style: CapsuleStyle | null;
  preview: Preview | null;
}) {
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    const remaining = new Date(openAt).getTime() - Date.now();
    if (remaining <= 0) {
      window.location.reload();
      return;
    }

    const timer = window.setTimeout(() => window.location.reload(), remaining + 300);
    return () => window.clearTimeout(timer);
  }, [openAt]);

  if (previewing && preview) {
    return (
      <OpenedCapsuleView
        recipient={recipient}
        openAt={openAt}
        letter={preview.letter}
        images={preview.images}
        weather={preview.weather}
        style={preview.style}
        preview
        onExitPreview={() => setPreviewing(false)}
      />
    );
  }

  return (
    <WeatherScene
      weather={weather}
      className="flex min-h-[calc(100dvh-3.5rem)] flex-1 items-center justify-center px-6 py-16"
    >
      <main
        className="w-full max-w-lg overflow-hidden rounded-[2rem] border bg-white/85 shadow-xl shadow-amber-900/10"
        style={{
          borderColor: style ? `${style.colorFrom}99` : undefined,
        }}
      >
        <div
          className={`relative px-6 pt-10 pb-8 ${
            style ? "" : "bg-linear-to-br from-amber-100 via-rose-100 to-stone-200"
          }`}
          style={{
            background: style
              ? capsuleSurface(style)
              : undefined,
          }}
        >
          {style ? <CapsuleVessel style={style} size="lg" /> : null}
          <div className="mt-6 text-center">
            <p className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] tracking-[0.35em] text-amber-50 uppercase backdrop-blur-sm">
              sealed
            </p>
            <h1
              className={`mt-4 text-3xl font-semibold drop-shadow-sm ${
                style ? "text-white" : "text-stone-800"
              }`}
            >
              {recipient}에게
            </h1>
            <p className={`mt-2 text-sm ${style ? "text-amber-50/80" : "text-stone-500"}`}>
              아직 기간이 남았어요
            </p>
          </div>
        </div>

        <div className="px-8 py-9">
          <p className="text-center text-sm text-stone-500">
            {formatOpenAt(openAt)}에 열립니다
          </p>
          <WeatherNote className="mt-2 text-center text-sm text-stone-400" weather={weather} />
          {style ? (
            <div className="mt-5 space-y-3">
              <p className="text-center text-sm leading-6 text-stone-600">{style.phrase}</p>
              <KeywordChips keywords={style.keywords} accent={style.colorTo} />
            </div>
          ) : null}

          <div className="mt-6">
            <CountdownClock openAt={openAt} />
          </div>

          <p className="mt-6 text-center text-sm leading-6 text-stone-400">
            열람일이 되기 전에는 편지를 볼 수 없어요.
            시간이 지나면 이 페이지에서 함께 열립니다.
          </p>

          {preview ? (
            <button
              type="button"
              onClick={() => setPreviewing(true)}
              className="mt-8 w-full rounded-full border border-dashed border-amber-300 bg-amber-50 px-6 py-3.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
            >
              바로보기
              <span className="ml-2 text-xs font-normal text-amber-700/70">
                개발 모드
              </span>
            </button>
          ) : null}

          <p className="mt-6 text-center">
            <Link href="/" className="text-sm text-stone-400 hover:text-stone-600">
              대시보드로
            </Link>
          </p>
        </div>
      </main>
    </WeatherScene>
  );
}

export function OpenedCapsuleView({
  recipient,
  openAt,
  letter,
  images,
  weather,
  style,
  preview = false,
  onExitPreview,
}: {
  recipient: string;
  openAt: string;
  letter: string;
  images: CapsuleImage[];
  weather: WeatherSnapshot | null;
  style: CapsuleStyle | null;
  preview?: boolean;
  onExitPreview?: () => void;
}) {
  const cover = images[0];
  const rest = images.slice(1);

  return (
    <WeatherScene
      weather={weather}
      className="flex min-h-[calc(100dvh-3.5rem)] flex-1 items-center justify-center px-6 py-16"
    >
      <main className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-amber-100/80 bg-white/90 shadow-xl shadow-amber-900/10">
        {preview ? (
          <div className="bg-amber-800 px-6 py-2 text-center text-xs tracking-wide text-amber-50">
            개발 모드 · 미리보기
          </div>
        ) : null}

        <div className="relative h-64 bg-linear-to-br from-amber-100 via-rose-100 to-stone-200">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.public_url}
              alt=""
              className="size-full object-cover"
            />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-stone-900/70 to-transparent px-8 pt-16 pb-6">
            <p className="text-[11px] tracking-[0.35em] text-amber-100 uppercase">
              opened
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              {recipient}에게
            </h1>
            <p className="mt-1 text-sm text-amber-50/80">
              {formatOpenAt(openAt)}에 열렸어요
            </p>
            <WeatherNote className="mt-1 text-sm text-amber-50/80" weather={weather} />
          </div>
        </div>

        <div className="px-8 py-8">
          {style ? (
            <div className="mb-6 text-center">
              <CapsuleVessel style={style} size="sm" />
              <p className="mt-4 text-base leading-7 text-stone-700">{style.phrase}</p>
              <div className="mt-4">
                <KeywordChips keywords={style.keywords} accent={style.colorTo} />
              </div>
            </div>
          ) : null}
          {rest.length > 0 ? (
            <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
              {rest.map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.storage_path}
                  src={image.public_url}
                  alt=""
                  className="h-28 w-28 shrink-0 rounded-2xl object-cover"
                />
              ))}
            </div>
          ) : null}

          <article className="rounded-3xl bg-amber-50/80 px-6 py-7">
            <p className="text-xs tracking-[0.3em] text-amber-800/60 uppercase">
              letter
            </p>
            <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-stone-700">
              {letter}
            </p>
          </article>

          <div className="mt-8 flex flex-col items-center gap-3">
            {preview && onExitPreview ? (
              <button
                type="button"
                onClick={onExitPreview}
                className="text-sm text-amber-800 hover:text-amber-950"
              >
                봉인 화면으로
              </button>
            ) : null}
            <Link href="/" className="text-sm text-stone-400 hover:text-stone-600">
              대시보드로
            </Link>
          </div>
        </div>
      </main>
    </WeatherScene>
  );
}
