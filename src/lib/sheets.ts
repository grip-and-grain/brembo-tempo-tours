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
    const coverImage = await downloadDriveImage(r.coverImage);
    const mapThumbnail = await downloadDriveImage(r.mapThumbnail);
    const galleryLinks = splitSemicolon(r.gallery);
    const gallery = [];
    for (const link of galleryLinks) {
      const local = await downloadDriveImage(link);
      if (local) gallery.push(local);
    }

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
      difficulty: r.difficulty,
      difficultyEn: r.difficultyEn,
      region: r.region || 'Östergötland',
      coverImage: coverImage || '/images/map-braviken-rundan.jpeg',
      mapThumbnail: mapThumbnail || '',
      gallery,
      highlights: splitSemicolon(r.highlights),
      dates: datesBySlug.get(r.slug) || [],
      published: true,
      bodySv: r.bodySv || '',
      bodyEn: r.bodyEn || '',
    });
  }

  return routes;
}
