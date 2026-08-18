import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  OpenedCapsuleView,
  SealedCapsule,
} from "@/components/sealed-capsule";
import { getCapsuleById } from "@/lib/capsules";
import { SITE_NAME, SITE_TAGLINE, absoluteUrl } from "@/lib/site";
import { isOpened } from "@/lib/time";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const capsule = await getCapsuleById(id);

  if (!capsule) {
    return {
      title: "캡슐을 찾지 못했어요",
      robots: { index: false, follow: false },
    };
  }

  const opened = isOpened(capsule.openAt);
  const title = `${capsule.recipient}에게 묻은 캡슐`;
  const description = opened
    ? `${capsule.recipient}에게 묻어 둔 캡슐이 열렸어요.`
    : `${capsule.recipient}에게 묻어 둔 캡슐은 아직 봉인되어 있어요. ${SITE_TAGLINE}`;
  const url = absoluteUrl(`/capsule/${capsule.id}`);
  const ogImage =
    opened && capsule.images[0]
      ? [{ url: capsule.images[0].public_url, alt: title }]
      : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: ogImage,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage?.map((image) => image.url),
    },
  };
}

export default async function CapsulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const capsule = await getCapsuleById(id);

  if (!capsule) {
    notFound();
  }

  const opened = isOpened(capsule.openAt);
  const isDev = process.env.NODE_ENV === "development";

  if (!opened) {
    return (
      <SealedCapsule
        recipient={capsule.recipient}
        openAt={capsule.openAt}
        weather={capsule.weather}
        style={capsule.style}
        preview={
          isDev
            ? {
                letter: capsule.letter,
                images: capsule.images,
                weather: capsule.weather,
                style: capsule.style,
              }
            : null
        }
      />
    );
  }

  return (
    <OpenedCapsuleView
      recipient={capsule.recipient}
      openAt={capsule.openAt}
      letter={capsule.letter}
      images={capsule.images}
      weather={capsule.weather}
      style={capsule.style}
    />
  );
}
