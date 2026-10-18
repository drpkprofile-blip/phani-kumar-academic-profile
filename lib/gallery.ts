import "server-only";

import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type GalleryRow = Database["public"]["Tables"]["gallery_items"]["Row"];

export type PublicGalleryItem = {
  id: number;
  description: string;
  imageUrl: string;
  displayOrder: number;
  updatedAt: string;
};

export function mapGalleryItem(row: GalleryRow, imageUrl: string): PublicGalleryItem {
  return {
    id: row.id,
    description: row.description,
    imageUrl,
    displayOrder: row.display_order,
    updatedAt: row.updated_at,
  };
}

export async function getPublicGalleryItems(): Promise<PublicGalleryItem[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("gallery_items").select("*").order("display_order", { ascending: true });
  if (error?.code === "PGRST205" || error?.code === "42P01") return [];
  if (error || !data) throw new Error("Unable to read public photo gallery from Supabase");
  return data.map((row) => {
    const { data: publicUrl } = supabase.storage.from("profile-assets").getPublicUrl(row.storage_path);
    return mapGalleryItem(row, publicUrl.publicUrl);
  });
}
