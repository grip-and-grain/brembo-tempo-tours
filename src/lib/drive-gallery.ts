const API_KEY = import.meta.env.GOOGLE_API_KEY;
if (!API_KEY) throw new Error('Missing GOOGLE_API_KEY env var');

const DRIVE_ID_RE = /^[a-zA-Z0-9_-]+$/;

interface DriveImage {
  id: string;
  name: string;
  thumbnail: string;
  full: string;
}

async function fetchDriveImages(folderId: string): Promise<DriveImage[]> {
  if (!DRIVE_ID_RE.test(folderId)) throw new Error(`Invalid Drive folder ID: ${folderId}`);

  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&fields=files(id,name)&orderBy=createdTime+desc&pageSize=100&key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);

  const data = await res.json();
  const files: { id: string; name: string }[] = data.files ?? [];

  return files
    .filter(f => DRIVE_ID_RE.test(f.id))
    .map(f => ({
      id: f.id,
      name: f.name,
      thumbnail: `https://lh3.googleusercontent.com/d/${f.id}=w600`,
      full: `https://lh3.googleusercontent.com/d/${f.id}=w1600`,
    }));
}

export async function fetchGalleryImages(): Promise<DriveImage[]> {
  const folderId = import.meta.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID;
  if (!folderId) throw new Error('Missing GOOGLE_DRIVE_GALLERY_FOLDER_ID env var');
  return fetchDriveImages(folderId);
}

export async function fetchHeroImages(): Promise<DriveImage[]> {
  const folderId = import.meta.env.GOOGLE_DRIVE_HERO_FOLDER_ID;
  if (!folderId) throw new Error('Missing GOOGLE_DRIVE_HERO_FOLDER_ID env var');
  return fetchDriveImages(folderId);
}
