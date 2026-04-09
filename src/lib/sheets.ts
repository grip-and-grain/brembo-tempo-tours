import { parse } from 'csv-parse/sync';
import { downloadDriveImage } from './images.js';

const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID;
if (!SHEET_ID) throw new Error('Missing GOOGLE_SHEET_ID env var');

function sheetUrl(tab: string): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
}

async function fetchCsv(tab: string): Promise<Record<string, string>[]> {
  const res = await fetch(sheetUrl(tab));
  if (!res.ok) throw new Error(`Failed to fetch sheet "${tab}": ${res.status}`);
  const text = await res.text();
  if (!text.trim()) return [];
  return parse(text, { columns: true, skip_empty_lines: true, trim: true });
}

function splitSemicolon(val: string): string[] {
  if (!val?.trim()) return [];
  return val.split(';').map(s => s.trim()).filter(Boolean);
}

export interface Video {
  videoId: string;
  title: string;
  thumbnail: string;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

async function fetchYouTubeTitle(videoId: string): Promise<string> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return '';
    const data = await res.json();
    return data.title ?? '';
  } catch {
    return '';
  }
}

function isSafeUrl(raw: string): boolean {
  try {
    const { protocol } = new URL(raw);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

export interface Playlist {
  url: string;
  title: string;
}

export interface VideoData {
  videos: Video[];
  playlists: Playlist[];
}

export async function fetchVideos(): Promise<VideoData> {
  const rows = await fetchCsv('Videor');

  const published = rows.filter((r) => !r.published || r.published.toUpperCase() === 'TRUE');

  const playlists = published
    .filter((r) => r.isPlaylist?.toUpperCase() === 'TRUE' && r.url?.trim())
    .map((r) => ({ url: r.url.trim(), title: r.title?.trim() || '' }))
    .filter((pl) => isSafeUrl(pl.url));

  const parsed = published
    .filter((r) => r.isPlaylist?.toUpperCase() !== 'TRUE')
    .map((r) => {
      const videoId = extractYouTubeId(r.url ?? '');
      if (!videoId) return null;
      return { videoId, sheetTitle: r.title?.trim() || '' };
    })
    .filter((v): v is { videoId: string; sheetTitle: string } => v !== null);

  const videos = await Promise.all(
    parsed.map(async ({ videoId, sheetTitle }) => ({
      videoId,
      title: sheetTitle || await fetchYouTubeTitle(videoId),
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    })),
  );

  return { videos, playlists };
}

export async function fetchRoutes() {
  const [rawRoutes, rawDates] = await Promise.all([
    fetchCsv('Rutter'),
    fetchCsv('Datum'),
  ]);

  // Group dates by routeSlug
  const datesBySlug = new Map<string, { date: string; spots: number; spotsLeft: number }[]>();
  for (const d of rawDates) {
    const slug = d.routeSlug;
    if (!slug) continue;
    if (!datesBySlug.has(slug)) datesBySlug.set(slug, []);
    datesBySlug.get(slug)!.push({
      date: d.date,
      spots: parseInt(d.spots, 10) || 8,
      spotsLeft: parseInt(d.spotsLeft, 10) || 0,
    });
  }

  const routes = [];
  for (const r of rawRoutes) {
    if (r.published?.toUpperCase() !== 'TRUE') continue;

    // Download images from Drive
    const mapThumbnail = await downloadDriveImage(r.mapThumbnail);
    routes.push({
      id: r.slug,
      slug: r.slug,
      title: r.title,
      titleEn: r.titleEn,
      description: r.description,
      descriptionEn: r.descriptionEn,
      distance: parseInt(r.distance, 10),
      duration: r.duration,
      durationEn: r.durationEn,
      difficulty: r.difficulty.toLowerCase(),
      difficultyEn: r.difficultyEn.toLowerCase(),
      region: r.region || 'Östergötland',
      mapThumbnail: mapThumbnail || '',
      highlights: splitSemicolon(r.highlights),
      dates: datesBySlug.get(r.slug) || [],
      published: true,
    });
  }

  return routes;
}
