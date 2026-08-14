"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { authErrorMessage, signInWithGoogle, signOutUser } from "@/lib/auth";
import { getFirebaseAuth } from "@/lib/firebase";

function GoogleMark() {
  return (
    <svg aria-hidden className="size-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09A6.97 6.97 0 0 1 5.48 12c0-.72.12-1.41.36-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 4.93l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  );
}

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser);
      setReady(true);
    });
  }, []);

  async function handleSignIn() {
    setError(null);
    setPending(true);
    try {
      await signInWithGoogle();
    } catch (caught) {
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
    <header className="sticky top-0 z-40 border-b border-amber-100/70 bg-amber-50/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight text-stone-800">
          전송: 캡슐
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/new"
            className="rounded-full bg-stone-800 px-4 py-2 text-xs font-medium tracking-wide text-amber-50 transition hover:bg-stone-700"
          >
            캡슐 묻기
          </Link>

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
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
            >
              <GoogleMark />
              {pending ? "로그인 중…" : "Google 로그인"}
            </button>
          )}
        </div>
      </div>
      {error ? (
        <p className="px-6 pb-3 text-center text-xs text-rose-600">{error}</p>
      ) : null}
    </header>
  );
}
