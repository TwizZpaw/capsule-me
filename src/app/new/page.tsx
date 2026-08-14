"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { getFirebaseAuth } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";

type BuriedCapsule = {
  id: string;
  recipient: string;
  letter: string;
  openAt: string;
  imageUrls: string[];
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

export default function NewPage() {
  const [recipient, setRecipient] = useState("");
  const [letter, setLetter] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BuriedCapsule | null>(null);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const user = getFirebaseAuth().currentUser;
    if (!user) {
      alert("로그인 먼저!");
      return;
    }

    setSubmitting(true);

    try {
      const { data: capsule, error: capsuleError } = await supabase
        .from("capsules")
        .insert({
          sender_uid: user.uid,
          recipient,
          letter,
          open_at: new Date(openAt).toISOString(),
        })
        .select("id")
        .single();

      if (capsuleError || !capsule) {
        throw capsuleError ?? new Error("캡슐을 저장하지 못했어요.");
      }

      const timestamp = Date.now();
      const images: { storage_path: string; public_url: string; sort_order: number }[] =
        [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const storagePath = `${user.uid}/${capsule.id}/${timestamp}-${index}${fileExtension(file)}`;
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

      setResult({
        id: capsule.id,
        recipient,
        letter,
        openAt,
        imageUrls: images.map((image) => image.public_url),
      });
    } catch (error) {
      console.error(error);
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "캡슐을 묻지 못했어요. 잠시 후 다시 시도해 주세요.";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex flex-1 items-center justify-center bg-linear-to-b from-amber-50 via-rose-50 to-stone-100 px-6 py-16">
      {submitting ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-900/50 backdrop-blur-sm">
          <div className="size-10 animate-spin rounded-full border-2 border-amber-100/30 border-t-amber-50" />
          <p className="mt-6 text-sm font-medium tracking-wide text-amber-50">
            업로드 되는 중
          </p>
        </div>
      ) : null}

      <main className="w-full max-w-lg rounded-3xl border border-amber-100/80 bg-white/80 px-8 py-10 shadow-xl shadow-amber-900/5 backdrop-blur-sm sm:px-12">
        {result ? (
          <div className="text-center">
            <p className="mb-4 text-xs tracking-[0.35em] text-amber-800/70 uppercase">
              buried
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
              캡슐을 묻었어요
            </h1>
            <p className="mt-4 text-stone-500">
              {result.recipient}에게, {formatOpenAt(result.openAt)}에 열어요
            </p>

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
              <Link
                href={`/capsule/${result.id}`}
                className="inline-flex rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium tracking-wide text-amber-50 shadow-sm transition hover:bg-stone-700"
              >
                묻은 캡슐 보기
              </Link>
              <Link href="/" className="text-sm text-stone-400 hover:text-stone-600">
                처음으로
              </Link>
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

            <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
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

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium tracking-wide text-amber-50 shadow-sm transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "업로드 되는 중" : "캡슐 묻기"}
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
    </div>
  );
}
