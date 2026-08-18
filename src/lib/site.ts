export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://capsule-me-iota.vercel.app";

export const SITE_NAME = "캡슐 미";
export const SITE_NAME_EN = "Capsule Me";
export const SITE_TAGLINE = "사진과 편지를 묻고, 열람일에 함께 열어요";
export const SITE_DESCRIPTION =
  "오늘의 날씨와 시간을 담아 사진과 편지를 묻고, 열람일에 함께 여는 타임캡슐. 캡슐 미에서 미래의 나에게, 혹은 소중한 사람에게 남기세요.";

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ??
  "";

export function absoluteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, SITE_URL).toString();
}
