import { connection } from "next/server";
import type { Metadata } from "next";
import { HomeScreen } from "@/components/home-screen";
import { listCapsules, type CapsuleSummary } from "@/lib/capsules";
import { SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: "캡슐 미",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "캡슐 미",
    description: SITE_TAGLINE,
    url: "/",
  },
};

export default async function Home() {
  await connection();

  let capsules: CapsuleSummary[] = [];
  try {
    capsules = await listCapsules();
  } catch (error) {
    console.error(error);
  }

  return (
    <div className="flex flex-1 flex-col">
      <HomeScreen capsules={capsules} />
    </div>
  );
}
