import { supabase } from "@/lib/supabase";

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
};

type CapsuleRow = {
  id: string;
  recipient: string;
  open_at: string;
  created_at: string;
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
      "id, recipient, open_at, created_at, capsule_images(public_url, storage_path, sort_order)",
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
  }));
}
