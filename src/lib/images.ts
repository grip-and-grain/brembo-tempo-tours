import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const IMAGES_DIR = new URL('../../public/images', import.meta.url).pathname;

function extractDriveId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

function extensionFromContentType(ct: string): string {
  if (ct.includes('png')) return 'png';
  if (ct.includes('webp')) return 'webp';
  return 'jpg';
}

export async function downloadDriveImage(driveUrl: string): Promise<string> {
  if (!driveUrl?.trim()) return '';

  const fileId = extractDriveId(driveUrl.trim());
  if (!fileId) return driveUrl; // not a Drive link, return as-is (e.g. local path)

  // Check if already downloaded
  for (const ext of ['jpg', 'png', 'webp', 'jpeg']) {
    const localPath = join(IMAGES_DIR, `drive-${fileId}.${ext}`);
    if (existsSync(localPath)) return `/images/drive-${fileId}.${ext}`;
  }

  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(downloadUrl, { redirect: 'follow' });
  if (!res.ok) {
    console.warn(`Failed to download Drive image ${fileId}: ${res.status}`);
    return '';
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    console.warn(`Drive file ${fileId} is not an image (${contentType}), skipping`);
    return '';
  }
  const ext = extensionFromContentType(contentType);
  const filename = `drive-${fileId}.${ext}`;
  const localPath = join(IMAGES_DIR, filename);

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(localPath, buffer);
  console.log(`Downloaded: ${filename}`);

  return `/images/${filename}`;
}
