export const GALLERY_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const GALLERY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type GalleryFormValues = { description: string };

export function parseGalleryDescription(form: FormData): GalleryFormValues | null {
  const raw = form.get("description");
  if (typeof raw !== "string" || !raw.trim()) return null;
  return { description: raw.trim() };
}

export function validGalleryImage(file: File, bytes: Uint8Array): boolean {
  if (file.size === 0 || file.size > GALLERY_MAX_IMAGE_BYTES || !GALLERY_IMAGE_TYPES.includes(file.type as typeof GALLERY_IMAGE_TYPES[number])) return false;
  if (file.type === "image/png") return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (file.type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
}

export function galleryStoragePath(file: File): string | null {
  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : null;
  return extension ? `gallery/${crypto.randomUUID()}.${extension}` : null;
}

export function positiveGalleryId(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
