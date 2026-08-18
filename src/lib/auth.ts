import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function errorCode(error: unknown): string {
  return typeof error === "object" && error && "code" in error
    ? String(error.code)
    : "";
}

function isPopupBlocked(error: unknown): boolean {
  const code = errorCode(error);
  return code === "auth/popup-blocked" || code === "auth/cancelled-popup-request";
}

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getFirebaseAuth();

  try {
    const credential = await signInWithPopup(auth, googleProvider);
    return credential.user;
  } catch (error) {
    if (!isPopupBlocked(error)) {
      throw error;
    }

    await signInWithRedirect(auth, googleProvider);
    return null;
  }
}

export async function completeGoogleRedirect(): Promise<User | null> {
  const result = await getRedirectResult(getFirebaseAuth());
  return result?.user ?? null;
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export function authErrorMessage(error: unknown): string {
  const code = errorCode(error);

  if (code === "auth/operation-not-allowed") {
    return "Firebase Console에서 Google 로그인을 사용 설정한 뒤 다시 시도해 주세요.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "로그인 창이 닫혔습니다. 다시 시도해 주세요.";
  }
  if (code === "auth/unauthorized-domain") {
    return "이 주소는 Firebase에 허용되어 있지 않습니다. http://localhost:3000 으로 열어 주세요.";
  }
  if (code === "auth/network-request-failed") {
    return "네트워크 오류로 로그인하지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.";
  }
  if (code === "auth/invalid-api-key" || code === "auth/api-key-not-valid.-please-pass-a-valid-api-key.") {
    return "Firebase API 키가 올바르지 않습니다. .env 값을 확인해 주세요.";
  }

  return code
    ? `로그인에 실패했습니다. (${code})`
    : "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}
