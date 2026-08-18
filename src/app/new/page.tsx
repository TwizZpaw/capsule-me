"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { type User } from "firebase/auth";
import { useAuth } from "@/components/auth-provider";
import { GoogleSignInButton } from "@/components/site-header";
import { WeatherNote } from "@/components/weather-note";
import { WeatherScene } from "@/components/weather-scene";
import { CapsuleVessel } from "@/components/capsule-vessel";
import { KeywordChips } from "@/components/keyword-chips";
import { authErrorMessage, signInWithGoogle } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { CapsuleStyle } from "@/lib/capsule-style";
import type { WeatherSnapshot } from "@/lib/weather";

type BuriedCapsule = {
  id: string | null;
  recipient: string;
  letter: string;
  openAt: string;
  imageUrls: string[];
  weather: WeatherSnapshot | null;
  style: CapsuleStyle | null;
  trial: boolean;
};

function fileExtension(file: File) {
  const dot = file.name.lastIndexOf(".");
  if (dot !== -1) {
    const ext = file.name
      .slice(dot + 1)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (ext) return `.${ext}`;
  }

  const mimeExt = file.type.split("/")[1]?.replace(/[^a-z0-9]/g, "");
  return mimeExt ? `.${mimeExt}` : "";
}

function formatOpenAt(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function getBrowserCoords() {
  if (!navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise<{ lat: number; lon: number } | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

async function fetchWeatherSnapshot(): Promise<WeatherSnapshot | null> {
  const coords = await getBrowserCoords();
  const params = new URLSearchParams();
  if (coords) {
    params.set("lat", String(coords.lat));
    params.set("lon", String(coords.lon));
  }

  const query = params.toString();
  const response = await fetch(query ? `/api/weather?${query}` : "/api/weather");
  if (!response.ok) return null;

  const payload = (await response.json()) as { weather?: WeatherSnapshot | null };
  return payload.weather ?? null;
}

async function fetchCapsuleStyle(
  weather: WeatherSnapshot | null,
  letter: string,
): Promise<CapsuleStyle | null> {
  const response = await fetch("/api/capsule-style", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weather, letter }),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { style?: CapsuleStyle | null };
  return payload.style ?? null;
}

async function persistCapsule(input: {
  user: User;
  recipient: string;
  letter: string;
  openAt: string;
  files: File[];
  weather: WeatherSnapshot | null;
  style: CapsuleStyle | null;
}): Promise<BuriedCapsule> {
  const { data: capsule, error: capsuleError } = await supabase
    .from("capsules")
    .insert({
      sender_uid: input.user.uid,
      recipient: input.recipient,
      letter: input.letter,
      open_at: new Date(input.openAt).toISOString(),
      weather: input.weather?.condition ?? null,
      temperature: input.weather?.temperature ?? null,
      humidity: input.weather?.humidity ?? null,
      phrase: input.style?.phrase ?? null,
      keywords: input.style?.keywords ?? [],
      shape: input.style?.shape ?? null,
      color_from: input.style?.colorFrom ?? null,
      color_to: input.style?.colorTo ?? null,
      color_accent: input.style?.colorAccent ?? null,
    })
    .select("id")
    .single();

  if (capsuleError || !capsule) {
    throw capsuleError ?? new Error("캡슐을 저장하지 못했어요.");
  }

  const timestamp = Date.now();
  const images: { storage_path: string; public_url: string; sort_order: number }[] =
    [];

  for (let index = 0; index < input.files.length; index += 1) {
    const file = input.files[index];
    const storagePath = `${input.user.uid}/${capsule.id}/${timestamp}-${index}${fileExtension(file)}`;
    const { error: uploadError } = await supabase.storage
      .from("capsules")
      .upload(storagePath, file, { contentType: file.type });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("capsules").getPublicUrl(storagePath);
    images.push({
      storage_path: storagePath,
      public_url: data.publicUrl,
      sort_order: index,
    });
  }

  if (images.length > 0) {
    const { error: imageError } = await supabase.from("capsule_images").insert(
      images.map((image) => ({
        capsule_id: capsule.id,
        ...image,
      })),
    );

    if (imageError) {
      throw imageError;
    }
  }

  return {
    id: capsule.id,
    recipient: input.recipient,
    letter: input.letter,
    openAt: input.openAt,
    imageUrls: images.map((image) => image.public_url),
    weather: input.weather,
    style: input.style,
    trial: false,
  };
}

export default function NewPage() {
  const [recipient, setRecipient] = useState("");
  const [letter, setLetter] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BuriedCapsule | null>(null);
  const { user, ready: authReady } = useAuth();
  const [pendingSignIn, setPendingSignIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ambientWeather, setAmbientWeather] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    void fetchWeatherSnapshot().then(setAmbientWeather).catch(() => {
      setAmbientWeather(null);
    });
  }, []);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!recipient.trim() || !letter.trim() || !openAt) {
      setError("받는 사람, 편지, 열람일을 모두 입력해 주세요.");
      return;
    }

    if (!authReady) {
      setError("잠시만 기다려 주세요.");
      return;
    }

    setSubmitting(true);

    try {
      let weather: WeatherSnapshot | null = null;
      let style: CapsuleStyle | null = null;
      try {
        weather = await fetchWeatherSnapshot();
        setAmbientWeather(weather);
      } catch (weatherError) {
        console.error(weatherError);
      }

      try {
        style = await fetchCapsuleStyle(weather, letter);
      } catch (styleError) {
        console.error(styleError);
      }

      if (!user) {
        setResult({
          id: null,
          recipient,
          letter,
          openAt,
          imageUrls: previews,
          weather,
          style,
          trial: true,
        });
        return;
      }

      setResult(
        await persistCapsule({
          user,
          recipient,
          letter,
          openAt,
          files,
          weather,
          style,
        }),
      );
    } catch (caught) {
      console.error(caught);
      const message =
        typeof caught === "object" && caught && "message" in caught
          ? String(caught.message)
          : "캡슐을 묻지 못했어요. 잠시 후 다시 시도해 주세요.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBuryTrial() {
    if (!result) return;
    setError(null);
    setPendingSignIn(true);
    setSubmitting(true);

    try {
      const nextUser = user ?? (await signInWithGoogle());
      if (!nextUser) {
        return;
      }

      setResult(
        await persistCapsule({
          user: nextUser,
          recipient: result.recipient,
          letter: result.letter,
          openAt: result.openAt,
          files,
          weather: result.weather,
          style: result.style,
        }),
      );
    } catch (caught) {
      console.error(caught);
      const code =
        typeof caught === "object" && caught && "code" in caught
          ? String(caught.code)
          : "";
      setError(
        code.startsWith("auth/")
          ? authErrorMessage(caught)
          : typeof caught === "object" && caught && "message" in caught
            ? String(caught.message)
            : "캡슐을 묻지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setPendingSignIn(false);
      setSubmitting(false);
    }
  }

  return (
    <WeatherScene
      weather={result?.weather ?? ambientWeather}
      className="flex min-h-[calc(100dvh-3.5rem)] flex-1 items-center justify-center px-6 py-16"
    >
      {submitting ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-900/50 backdrop-blur-sm">
          <div className="size-10 animate-spin rounded-full border-2 border-amber-100/30 border-t-amber-50" />
          <p className="mt-6 text-sm font-medium tracking-wide text-amber-50">
            그 날의 캡슐을 빚는 중
          </p>
        </div>
      ) : null}

      <main className="w-full max-w-lg rounded-3xl border border-white/50 bg-white/55 px-8 py-10 shadow-xl shadow-stone-900/10 backdrop-blur-md sm:px-12">
        {result ? (
          <div className="text-center">
            <p className="mb-4 text-xs tracking-[0.35em] text-amber-800/70 uppercase">
              {result.trial ? "preview" : "buried"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
              {result.trial ? "이런 캡슐이 생겨요" : "캡슐을 묻었어요"}
            </h1>
            <p className="mt-4 text-stone-500">
              {result.recipient}에게, {formatOpenAt(result.openAt)}에 열어요
            </p>
            {result.trial ? (
              <p className="mt-2 text-sm text-stone-400">
                아직 묻히지 않은 체험 캡슐이에요. 로그인하면 진짜로 남아요.
              </p>
            ) : null}
            <WeatherNote className="mt-2 text-sm text-stone-500" weather={result.weather} />
            {result.style ? (
              <div className="mt-8">
                <CapsuleVessel style={result.style} />
                <p className="mt-4 text-sm leading-7 text-stone-600">
                  {result.style.phrase}
                </p>
                <div className="mt-4">
                  <KeywordChips
                    keywords={result.style.keywords}
                    accent={result.style.colorTo}
                  />
                </div>
              </div>
            ) : null}

            {result.imageUrls.length > 0 ? (
              <div className="mt-8 flex justify-center gap-3 overflow-x-auto pb-1">
                {result.imageUrls.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="size-20 shrink-0 rounded-2xl object-cover"
                  />
                ))}
              </div>
            ) : null}

            <p className="mt-6 whitespace-pre-wrap text-left text-sm leading-7 text-stone-600">
              {result.letter}
            </p>

            <div className="mt-10 flex flex-col items-center gap-3">
              {result.trial ? (
                <>
                  <GoogleSignInButton
                    pending={pendingSignIn}
                    onClick={() => void handleBuryTrial()}
                    label="이 캡슐 묻기"
                  />
                  {error ? (
                    <p className="text-sm text-rose-600">{error}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setError(null);
                    }}
                    className="text-sm text-stone-400 hover:text-stone-600"
                  >
                    다시 만들어 보기
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/capsule/${result.id}`}
                    className="inline-flex rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium tracking-wide text-amber-50 shadow-sm transition hover:bg-stone-700"
                  >
                    묻은 캡슐 보기
                  </Link>
                  <Link href="/" className="text-sm text-stone-400 hover:text-stone-600">
                    처음으로
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="mb-4 text-center text-xs tracking-[0.35em] text-amber-800/70 uppercase">
              time capsule
            </p>
            <h1 className="text-center text-3xl font-semibold tracking-tight text-stone-800">
              캡슐 묻기
            </h1>
            {authReady && !user ? (
              <p className="mt-3 text-center text-sm text-stone-500">
                먼저 만들어 보고, 마음에 들면 그때 묻어요.
              </p>
            ) : null}

            <form
              className="mt-8 flex flex-col gap-5"
              onSubmit={handleSubmit}
              noValidate
            >
              <label className="flex flex-col gap-2 text-sm text-stone-600">
                받는 사람
                <input
                  type="text"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  disabled={submitting}
                  className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-stone-800 outline-none focus:border-stone-400 disabled:opacity-60"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-stone-600">
                편지
                <textarea
                  value={letter}
                  onChange={(event) => setLetter(event.target.value)}
                  disabled={submitting}
                  rows={6}
                  className="resize-none rounded-2xl border border-amber-100 bg-white px-4 py-3 text-stone-800 outline-none focus:border-stone-400 disabled:opacity-60"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-stone-600">
                열람일
                <input
                  type="datetime-local"
                  value={openAt}
                  onChange={(event) => setOpenAt(event.target.value)}
                  disabled={submitting}
                  className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-stone-800 outline-none focus:border-stone-400 disabled:opacity-60"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-stone-600">
                사진
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={submitting}
                  onChange={(event) =>
                    setFiles(Array.from(event.target.files ?? []))
                  }
                  className="rounded-2xl border border-dashed border-amber-200 bg-white px-4 py-3 text-stone-500 file:mr-3 file:rounded-full file:border-0 file:bg-stone-800 file:px-4 file:py-2 file:text-xs file:text-amber-50 disabled:opacity-60"
                />
              </label>
              <p className="text-xs text-stone-400">
                위치 권한이 있으면 지금 곳의 날씨를, 없으면 서울 날씨를 담아요.
              </p>

              {previews.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {previews.map((src, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${files[index]?.name}-${index}`}
                      src={src}
                      alt=""
                      className="size-20 shrink-0 rounded-2xl object-cover"
                    />
                  ))}
                </div>
              ) : null}

              {error ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting || !authReady}
                className="mt-2 rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium tracking-wide text-amber-50 shadow-sm transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "캡슐을 빚는 중" : user ? "캡슐 묻기" : "만들어 보기"}
              </button>
            </form>

            <p className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm text-stone-400 hover:text-stone-600"
              >
                처음으로
              </Link>
            </p>
          </>
        )}
      </main>
    </WeatherScene>
  );
}
