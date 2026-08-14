import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(getFirebaseAuth(), googleProvider);
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  if (code === "auth/operation-not-allowed") {
    return "Firebase Console에서 Google 로그인을 사용 설정한 뒤 다시 시도해 주세요.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "로그인이 취소되었습니다.";
  }
  if (code === "auth/unauthorized-domain") {
    return "이 도메인은 Firebase 인증에 허용되어 있지 않습니다.";
  }

  return "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}
