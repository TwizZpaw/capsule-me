"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { GoogleMark } from "@/components/google-mark";
import { authErrorMessage, signInWithGoogle, signOutUser } from "@/lib/auth";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    try {
      const signIn = signInWithGoogle();
      setPending(true);
      const nextUser = await signIn;
      if (!nextUser) {
        return;
      }
    } catch (caught) {
      console.error(caught);
      setError(authErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function handleSignOut() {
    setError(null);
    setPending(true);
    try {
      await signOutUser();
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/20 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight text-stone-800">
          전송: 캡슐
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {pathname === "/new" ? (
            <span className="rounded-full bg-stone-800/40 px-4 py-2 text-xs font-medium tracking-wide text-amber-50/80">
              {user ? "작성 중" : "체험 중"}
            </span>
          ) : (
            <Link
              href="/new"
              className="rounded-full bg-stone-800 px-4 py-2 text-xs font-medium tracking-wide text-amber-50 transition hover:bg-stone-700"
            >
              {user ? "캡슐 묻기" : "만들어 보기"}
            </Link>
          )}

          {!ready ? (
            <span className="size-8 rounded-full bg-stone-200/80" aria-hidden />
          ) : user ? (
            <div className="flex items-center gap-2 rounded-full border border-amber-100 bg-white/90 py-1 pr-3 pl-1">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt=""
                  className="size-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex size-7 items-center justify-center rounded-full bg-stone-800 text-[10px] text-amber-50">
                  {(user.displayName ?? user.email ?? "?").slice(0, 1)}
                </span>
              )}
              <span className="hidden max-w-28 truncate text-xs text-stone-600 sm:inline">
                {user.displayName ?? user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={pending}
                className="text-xs text-stone-400 transition hover:text-stone-600 disabled:opacity-60"
              >
                로그아웃
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="px-6 pb-3 text-center text-xs text-rose-600">{error}</p>
      ) : null}
    </header>
  );
}

export function GoogleSignInButton({
  pending,
  onClick,
  label = "Google로 묻기",
}: {
  pending: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-stone-800 px-6 py-3.5 text-sm font-medium tracking-wide text-amber-50 shadow-sm transition hover:bg-stone-700 disabled:opacity-60"
    >
      <GoogleMark />
      {pending ? "로그인 중…" : label}
    </button>
  );
}
