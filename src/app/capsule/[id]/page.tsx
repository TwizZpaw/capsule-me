import { connection } from "next/server";
import { notFound } from "next/navigation";
import {
  OpenedCapsuleView,
  SealedCapsule,
} from "@/components/sealed-capsule";
import type { CapsuleImage } from "@/lib/capsules";
import { supabase } from "@/lib/supabase";
import { isOpened } from "@/lib/time";
import { weatherFromRow } from "@/lib/weather";
import { styleFromRow } from "@/lib/capsule-style";

export default async function CapsulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const { data: capsule, error } = await supabase
    .from("capsules")
    .select(
      "id, recipient, letter, open_at, weather, temperature, humidity, phrase, keywords, shape, color_from, color_to, color_accent, capsule_images(public_url, storage_path, sort_order)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !capsule) {
    notFound();
  }

  const weather = weatherFromRow(capsule);
  const style = styleFromRow(capsule);
  const images = [
    ...((capsule.capsule_images as CapsuleImage[] | null) ?? []),
  ].sort((a, b) => a.sort_order - b.sort_order);
  const opened = isOpened(capsule.open_at);
  const isDev = process.env.NODE_ENV === "development";

  if (!opened) {
    return (
      <SealedCapsule
        recipient={capsule.recipient}
        openAt={capsule.open_at}
        weather={weather}
        style={style}
        preview={
          isDev
            ? {
                letter: capsule.letter,
                images,
                weather,
                style,
              }
            : null
        }
      />
    );
  }

  return (
    <OpenedCapsuleView
      recipient={capsule.recipient}
      openAt={capsule.open_at}
      letter={capsule.letter}
      images={images}
      weather={weather}
      style={style}
    />
  );
}
