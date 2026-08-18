import { cache } from "react";
import { supabase } from "@/lib/supabase";
import { styleFromRow, type CapsuleStyle } from "@/lib/capsule-style";
import { weatherFromRow, type WeatherSnapshot } from "@/lib/weather";

export type CapsuleImage = {
  public_url: string;
  storage_path: string;
  sort_order: number;
};

export type CapsuleSummary = {
  id: string;
  recipient: string;
  openAt: string;
  createdAt: string;
  coverUrl: string | null;
  imageCount: number;
  weather: WeatherSnapshot | null;
  style: CapsuleStyle | null;
};

type CapsuleRow = {
  id: string;
  recipient: string;
  open_at: string;
  created_at: string;
  weather: string | null;
  temperature: number | string | null;
  humidity: number | string | null;
  phrase: string | null;
  keywords: string[] | null;
  shape: string | null;
  color_from: string | null;
  color_to: string | null;
  color_accent: string | null;
  capsule_images: CapsuleImage[] | null;
};

function coverUrl(images: CapsuleImage[] | null) {
  const sorted = [...(images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0]?.public_url ?? null;
}

export async function listCapsules(): Promise<CapsuleSummary[]> {
  const { data, error } = await supabase
    .from("capsules")
    .select(
      "id, recipient, open_at, created_at, weather, temperature, humidity, phrase, keywords, shape, color_from, color_to, color_accent, capsule_images(public_url, storage_path, sort_order)",
    )
    .order("open_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data as CapsuleRow[] | null) ?? []).map((row) => ({
    id: row.id,
    recipient: row.recipient,
    openAt: row.open_at,
    createdAt: row.created_at,
    coverUrl: coverUrl(row.capsule_images),
    imageCount: row.capsule_images?.length ?? 0,
    weather: weatherFromRow(row),
    style: styleFromRow(row),
  }));
}

export type CapsuleDetail = {
  id: string;
  recipient: string;
  letter: string;
  openAt: string;
  weather: WeatherSnapshot | null;
  style: CapsuleStyle | null;
  images: CapsuleImage[];
};

type CapsuleDetailRow = CapsuleRow & {
  letter: string;
};

export const getCapsuleById = cache(async (id: string): Promise<CapsuleDetail | null> => {
  const { data, error } = await supabase
    .from("capsules")
    .select(
      "id, recipient, letter, open_at, created_at, weather, temperature, humidity, phrase, keywords, shape, color_from, color_to, color_accent, capsule_images(public_url, storage_path, sort_order)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as CapsuleDetailRow;
  const images = [...(row.capsule_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return {
    id: row.id,
    recipient: row.recipient,
    letter: row.letter,
    openAt: row.open_at,
    weather: weatherFromRow(row),
    style: styleFromRow(row),
    images,
  };
});
