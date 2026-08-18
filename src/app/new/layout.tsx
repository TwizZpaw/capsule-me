import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "캡슐 묻기",
  description:
    "오늘의 날짜, 시간과 날씨를 함께 담아 편지와 사진을 묻어 두세요. 열람일이 되면 이 페이지에서 함께 열립니다.",
  alternates: {
    canonical: "/new",
  },
  openGraph: {
    title: "캡슐 묻기",
    description: "오늘의 날씨를 담아, 나중에 열어요.",
    url: "/new",
  },
};

export default function NewLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
