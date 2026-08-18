import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "캡슐을 찾지 못했어요",
  description: "요청하신 캡슐을 찾을 수 없습니다.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center bg-linear-to-b from-amber-50 via-rose-50 to-stone-100 px-6 py-16">
      <main className="w-full max-w-md rounded-3xl border border-amber-100 bg-white/80 px-8 py-12 text-center">
        <p className="text-xs tracking-[0.35em] text-amber-800/70 uppercase">
          not found
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-stone-800">
          캡슐을 찾지 못했어요
        </h1>
        <Link
          href="/"
          className="mt-8 inline-flex text-sm text-stone-400 hover:text-stone-600"
        >
          대시보드로
        </Link>
      </main>
    </div>
  );
}
