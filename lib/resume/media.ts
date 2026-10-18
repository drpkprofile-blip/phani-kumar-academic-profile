import "server-only";

import { readFile, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import sharp from "sharp";
import type { ManagedProfile } from "../profile-settings";

export type ResumeImage = { data: Buffer; type: "png" | "jpg"; width: number; height: number };
export type ResumeImages = { profilePhoto?: ResumeImage; citationsFigure?: ResumeImage };

const maximumImageBytes = 8 * 1024 * 1024;

function isAllowedBuffer(data: Buffer) {
  return (data[0] === 0x89 && data.subarray(1, 4).toString("ascii") === "PNG")
    || (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff)
    || (data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP");
}

async function normalizeImage(data: Buffer): Promise<ResumeImage | undefined> {
  if (!data.length || data.length > maximumImageBytes || !isAllowedBuffer(data)) return undefined;
  try {
    const image = sharp(data, { limitInputPixels: 30_000_000 });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) return undefined;
    if (metadata.format === "png") return { data, type: "png", width: metadata.width, height: metadata.height };
    if (metadata.format === "jpeg") return { data, type: "jpg", width: metadata.width, height: metadata.height };
    if (metadata.format === "webp") return { data: await image.png().toBuffer(), type: "png", width: metadata.width, height: metadata.height };
  } catch {
    return undefined;
  }
  return undefined;
}

async function readLocalPublicImage(source: string): Promise<ResumeImage | undefined> {
  if (!source.startsWith("/") || source.startsWith("//")) return undefined;
  const publicRoot = resolve(process.cwd(), "public");
  const candidate = resolve(publicRoot, `.${source}`);
  if (!candidate.startsWith(`${publicRoot}${sep}`)) return undefined;
  try {
    if ((await stat(candidate)).size > maximumImageBytes) return undefined;
    return await normalizeImage(await readFile(candidate));
  } catch {
    return undefined;
  }
}

async function readSupabasePublicImage(source: string): Promise<ResumeImage | undefined> {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configured) return undefined;
  try {
    const allowedOrigin = new URL(configured).origin;
    const url = new URL(source);
    if (url.protocol !== "https:" || url.origin !== allowedOrigin
      || !url.pathname.startsWith("/storage/v1/object/public/profile-assets/")) return undefined;
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return undefined;
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > maximumImageBytes) return undefined;
    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (!contentType || !["image/jpeg", "image/png", "image/webp"].includes(contentType)) return undefined;
    if (!response.body) return undefined;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumImageBytes) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(value);
    }
    const data = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), totalBytes);
    return await normalizeImage(data);
  } catch {
    return undefined;
  }
}

async function loadImage(source: string, fallback: string) {
  return await readLocalPublicImage(source)
    ?? await readSupabasePublicImage(source)
    ?? await readLocalPublicImage(fallback);
}

export async function loadResumeImages(profile: ManagedProfile): Promise<ResumeImages> {
  const [profilePhoto, citationsFigure] = await Promise.all([
    loadImage(profile.photo, "/phani-photo.png"),
    loadImage(profile.citationsImageUrl, "/google-scholar-citations.jpg"),
  ]);
  return { profilePhoto, citationsFigure };
}
